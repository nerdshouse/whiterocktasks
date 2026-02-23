import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const COLLECTIONS = {
  TASKS: 'tasks',
  USERS: 'tasks_users',
};

/** Normalize phone to 11za format: country code + number, no + or spaces */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && !digits.startsWith('0')) return '91' + digits;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

/** Call 11za sendTemplate API */
async function send11zaTemplate(
  phone: string,
  templateName: string,
  bodyParams: string[],
  config: { apiUrl: string; originWebsite: string; authToken: string }
): Promise<void> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return;

  const body = {
    phone: normalizedPhone,
    templateName,
    originWebsite: config.originWebsite,
    bodyParams,
  };

  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.authToken}`,
      'X-Origin-Website': config.originWebsite,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`11za API ${res.status}: ${text}`);
  }
}

/**
 * Scheduled function: runs daily at 8:00 AM IST.
 * Sends WhatsApp reminder via 11za to each user who has tasks due today.
 *
 * Set config before deploy:
 *   firebase functions:config:set 11za.auth_token "YOUR_TOKEN"
 *   firebase functions:config:set 11za.origin_website "https://whiterock.co.in/"
 *   firebase functions:config:set 11za.api_url "https://app.11za.in/apis/template/sendTemplate"
 *   firebase functions:config:set 11za.template_daily "daily_tasks_reminder"
 */
export const sendDailyDueDateReminders = functions
  .runWith({ timeoutSeconds: 120, memory: '256MB' })
  .pubsub.schedule('30 2 * * *') // 02:30 UTC = 8:00 AM IST
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const config = functions.config().11za || {};
    const authToken = config.auth_token || process.env.VITE_11ZA_AUTH_TOKEN;
    const apiUrl =
      config.api_url ||
      process.env.VITE_11ZA_API_URL ||
      'https://app.11za.in/apis/template/sendTemplate';
    const originWebsite =
      config.origin_website ||
      process.env.VITE_11ZA_ORIGIN_WEBSITE ||
      'https://whiterock.co.in/';
    const templateDaily = config.template_daily || 'daily_tasks_reminder';

    if (!authToken) {
      functions.logger.warn('11za auth_token not set; skipping daily reminders');
      return null;
    }

    const db = admin.firestore();
    const today = new Date()
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      .replace(/\//g, '-'); // YYYY-MM-DD

    const tasksSnap = await db
      .collection(COLLECTIONS.TASKS)
      .where('due_date', '==', today)
      .where('status', 'in', ['pending', 'in_progress', 'overdue'])
      .get();

    const tasksByUserId = new Map<
      string,
      { title: string; due_date: string; priority: string }[]
    >();
    for (const doc of tasksSnap.docs) {
      const d = doc.data();
      const uid = d.assigned_to_id;
      if (!uid) continue;
      const list = tasksByUserId.get(uid) || [];
      list.push({
        title: d.title || '',
        due_date: d.due_date || today,
        priority: d.priority || 'medium',
      });
      tasksByUserId.set(uid, list);
    }

    const usersSnap = await db.collection(COLLECTIONS.USERS).get();
    const usersById = new Map<string, { phone?: string; name: string }>();
    usersSnap.docs.forEach((doc) => {
      const d = doc.data();
      usersById.set(doc.id, { phone: d.phone, name: d.name || '' });
    });

    const elevenzaConfig = {
      apiUrl,
      originWebsite,
      authToken,
    };

    for (const [userId, tasks] of tasksByUserId) {
      const user = usersById.get(userId);
      const phone = user?.phone;
      if (!phone) {
        functions.logger.info(`No phone for user ${userId}; skipping`);
        continue;
      }
      const taskList =
        tasks.length > 0
          ? tasks
              .map((t) => `${t.title} (Due: ${t.due_date}, ${t.priority})`)
              .join('\n• ')
          : 'No tasks due today.';
      try {
        await send11zaTemplate(
          phone,
          templateDaily,
          [today, taskList],
          elevenzaConfig
        );
        functions.logger.info(`Daily reminder sent to ${phone}`);
      } catch (err) {
        functions.logger.error(`Failed to send to ${phone}:`, err);
      }
    }

    return null;
  });
