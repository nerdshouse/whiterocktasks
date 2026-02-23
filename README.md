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

### WhatsApp Integration (11za)

- **On task assignment:** When a task is assigned, the assignee receives a WhatsApp message with task title, due date, priority, assigned-by name, and link to the task.
- **Daily morning (8:00 AM IST):** A scheduled Cloud Function sends each user a WhatsApp reminder listing all tasks due that day.

**Setup:** See [11za WhatsApp setup](#11za-whatsapp-setup) below.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Firebase**
   - Create/use a Firebase project
   - Deploy Firestore rules from `firestore.rules` (or allow read/write for testing)
   - Collections used: `tasks_users`, `tasks`, `holidays`, `absences`, `removal_requests`
   - Copy `.env.example` to `.env` and fill in:
     - Firebase keys (optional if using default project)
     - **11za:** `VITE_11ZA_API_URL`, `VITE_11ZA_ORIGIN_WEBSITE`, `VITE_11ZA_AUTH_TOKEN` (see [11za WhatsApp setup](#11za-whatsapp-setup))

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

## 11za WhatsApp setup

1. **Environment variables (frontend)**  
   In `.env` set:
   - `VITE_11ZA_API_URL=https://app.11za.in/apis/template/sendTemplate`
   - `VITE_11ZA_ORIGIN_WEBSITE=https://whiterock.co.in/`
   - `VITE_11ZA_AUTH_TOKEN=<your 11za auth token>`

2. **Templates in 11za dashboard**  
   Create two approved WhatsApp templates in your 11za account and use their exact names (or set the optional env vars below).

   - **Task assignment** (default name: `task_assignment`)  
     Body variables in order: `{{1}}` Title, `{{2}}` Due date, `{{3}}` Priority, `{{4}}` Assigned by, `{{5}}` Link.  
     Optional env: `VITE_11ZA_TEMPLATE_TASK_ASSIGNMENT=your_template_name`

   - **Daily due-date reminder** (default name: `daily_tasks_reminder`)  
     Body variables: `{{1}}` Date (e.g. today), `{{2}}` Task list (one per line).  
     Optional env: `VITE_11ZA_TEMPLATE_DAILY_TASKS=your_template_name`

3. **Daily morning reminders (Cloud Function)**  
   - Install Firebase CLI and login: `npm i -g firebase-tools && firebase login`
   - From project root: `cd functions && npm install && npm run build`
   - Set 11za config for the scheduled function:
     ```bash
     firebase functions:config:set 11za.auth_token="YOUR_11ZA_AUTH_TOKEN"
     firebase functions:config:set 11za.origin_website="https://whiterock.co.in/"
     firebase functions:config:set 11za.api_url="https://app.11za.in/apis/template/sendTemplate"
     firebase functions:config:set 11za.template_daily="daily_tasks_reminder"
     ```
   - Deploy: `firebase deploy --only functions`  
   The function runs daily at **8:00 AM IST** and sends one WhatsApp per user with tasks due that day. Ensure each member has a **phone** in the users collection (e.g. 10-digit Indian number or with country code).

**Note:** If 11za’s API expects different request field names (e.g. `mobile`, `parameters`), update `src/services/whatsapp.ts` to match their documentation.

## Firebase Storage uploads (fix CORS)

If the console shows **CORS errors** when uploading media (e.g. from `localhost:5173` to `firebasestorage.googleapis.com`), the Storage bucket must allow your app’s origin.

1. **Install Google Cloud SDK** (includes `gsutil`):  
   [Install gcloud](https://cloud.google.com/sdk/docs/install)

2. **Log in and set project:**
   ```bash
   gcloud auth login
   gcloud config set project whiterock-tasks
   ```

3. **Apply CORS** using the project’s `storage.cors.json`:
   ```bash
   gsutil cors set storage.cors.json gs://whiterock-tasks.firebasestorage.app
   ```
   If your bucket name is different (e.g. `whiterock-tasks.appspot.com`), use that instead of `whiterock-tasks.firebasestorage.app`. You can see the bucket in [Firebase Console](https://console.firebase.google.com) → Storage → bucket name at the top.

4. **Add more origins** if needed (e.g. a different dev port or production URL) by editing `storage.cors.json` and running the `gsutil cors set` command again.

After CORS is set, reload the app and try the upload again.

## Deploy

Deploy the `dist` folder to Vercel/Netlify for **tasks.whiterock.co.in**
