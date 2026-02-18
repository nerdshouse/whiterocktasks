# WhiteRock Tasks - Task Management

Task management web app for **tasks.whiterock.co.in**

## Features

- **Assign Task** - Create tasks with due date, priority, recurring options, attachment requirements
- **Removal Request** - Request task removal (Manager approves/rejects)
- **Red Zone** - View overdue tasks
- **KPI** - Metrics: total assigned, on-time completed, late completed, overdue count, % late completion
- **Task Table** - View all tasks; mark complete; Auditor view: name, city, task, attachment, mark bogus/unclear
- **Settings** - Holidays list, Add Members, Mark Myself Absent

### Role-based Access

| Role | Permissions |
|------|-------------|
| **Owner** | Full access |
| **Manager** | Add/delete members & tasks |
| **Doer** | Assign tasks to others, complete own tasks |
| **Auditor** | View completed tasks, mark as audited/bogus/unclear |

### KPI Rules

- Tasks on holidays are shown in **orange** and excluded from KPI
- Tasks during user absence are excluded from KPI
- Late completion % = (late completed / total completed) × 100

### WhatsApp Integration

- On task assignment: WhatsApp sent to assignee with title, due date, priority, link, assigned by
- Daily morning: WhatsApp sent with today's tasks (per due date)

**Note:** WhatsApp requires Twilio or WhatsApp Business API integration. Placeholder functions exist in `src/services/api.ts` - implement `sendTaskAssignmentWhatsApp` and `sendDailyTasksWhatsApp` with your provider.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Firebase**
   - Create/use a Firebase project
   - Deploy Firestore rules from `firestore.rules` (or allow read/write for testing)
   - Collections used: `tasks_users`, `tasks`, `holidays`, `absences`, `removal_requests`
   - Create `.env` with:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     ```

3. **Seed demo users**
   - Visit `/#/seed` in your browser (or click "Seed demo users" on the login page)
   - Click "Seed Demo Users" to create 4 test accounts
   - All use password: **password123**

   | Email | Role |
   |-------|------|
   | owner@whiterock.co.in | Owner |
   | manager@whiterock.co.in | Manager |
   | doer@whiterock.co.in | Doer |
   | auditor@whiterock.co.in | Auditor |

4. **Run**
   ```bash
   npm run dev
   ```

5. **Build**
   ```bash
   npm run build
   ```

## Deploy

Deploy the `dist` folder to Vercel/Netlify for **tasks.whiterock.co.in**
