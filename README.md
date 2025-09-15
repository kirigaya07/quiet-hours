# Quiet Hours – Silent Study Scheduler (Next.js + Supabase + MongoDB)

Quiet Hours lets authenticated users create silent-study blocks and receive an email reminder 10 minutes before each block starts.

## ✨ Features

- Magic-link authentication (Supabase)
- Create/list/delete study blocks
- Email reminders (Resend) 10 minutes before start
- Scheduling via Inngest (recommended) or GitHub Actions/Vercel Cron
- MongoDB persistence (Mongoose)
- Indian Standard Time (IST) display in UI and emails

## 🧱 Tech Stack

- Next.js 15 (App Router, Turbopack)
- Supabase Auth
- MongoDB + Mongoose
- Resend for emails
- Inngest or GitHub Actions for scheduling
- TypeScript

## 📁 Structure

```
app/
  api/
    cron/send-reminders/route.ts     # Protected runner endpoint
    inngest/route.ts                 # Inngest HTTP handler
  blocks/
    new/page.tsx                     # New block form (validation + IST preview)
    page.tsx                         # All blocks page (IST)
  page.tsx                           # Dashboard Upcoming Blocks (IST)
  signin/page.tsx                    # Magic link signin
actions/
  block.ts                           # createBlock/getUpcomingBlocks/deleteBlock
  email.ts                           # scheduleBlockReminder/sendScheduledReminders
lib/
  email.ts                           # Resend client + template
  mongo.ts                           # Mongo connection (cached + readyState guard)
  supabase/                          # clients
  inngest/
    client.ts                        # Inngest client
    functions.ts                     # Inngest cron function
models/
  StudyBlock.ts                      # Blocks schema
  EmailDelivery.ts                   # Reminder scheduling (pending/sent)
middleware.ts                        # Public routes and auth gating
```

## 🔐 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiet_hours
MONGODB_DB_NAME=quiet_hours_prod

RESEND_API_KEY=re_xxx

CRON_SECRET=your-long-random-secret

# If using Inngest
INNGEST_SIGNING_KEY=xxxxx
```

## ▶️ Local Development

```bash
npm install
npm run dev
```

Supabase → Authentication → URL Configuration:

- Site URL: http://localhost:3000
- Redirect URLs: http://localhost:3000/auth/callback

## ⏱️ Scheduling Options

### Inngest (recommended)

1. Install: `npm install inngest @inngest/next`
2. Ensure files:
   - `app/api/inngest/route.ts` uses `serve({ client: inngest, functions: [sendRemindersFn] })`
   - `lib/inngest/client.ts` exports `inngest`
   - `lib/inngest/functions.ts` defines `sendRemindersFn` with `cron: "*/5 * * * *"`
3. Local dev: `npx inngest-cli@latest dev --url http://localhost:3000/api/inngest`
4. Prod: Set `INNGEST_SIGNING_KEY` and point Inngest app to `/api/inngest`

### GitHub Actions (every 5 minutes)

`.github/workflows/cron-reminders.yml`:

```yaml
name: Send Quiet Hours Reminders
on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminder endpoint
        run: |
          curl -sS -X POST "${{ secrets.APP_URL }}/api/cron/send-reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

Secrets: `APP_URL`, `CRON_SECRET`.

### Vercel Cron (Pro or daily on Hobby)

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/send-reminders", "schedule": "*/5 * * * *" }]
}
```

## 📬 How Reminders Work

1. User creates a block → server stores times (UTC) and schedules an `EmailDelivery` for `startAt - 10m`.
2. Runner queries `pending` deliveries within `[now, now+5m]`, sends email via Resend, marks as `sent`.

## 🕒 Time Zones

- UI renders in IST (Asia/Kolkata)
- Emails formatted in IST
- UTC in storage for correctness

## 🧪 Troubleshooting

- No emails → ensure a scheduler is active (Inngest/Actions/Vercel Cron) and reminders are within the pickup window.
- Supabase sign-in in prod → set Site URL + Redirect URLs to your domain.
- Resend only to you in dev → verify a domain to email others.

## 🚀 Deploy

1. Push to GitHub
2. Import in Vercel
3. Add env vars
4. Configure a scheduler
5. Deploy

## 📄 License

MIT
