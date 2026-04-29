# Night Watch — Jhagadia Plant Safety System

Real-time night-shift safety incident reporting for DCM Shriram Chemicals, Jhagadia Plant.

- **Public mobile URL** that workers / NDOs open on their phone to report incidents
- **Live dashboard URL** that leadership keeps open on a laptop, updates instantly when reports come in
- **Automatic email** to the Area HOD when an incident is reported
- **Email reply capture** — when the HOD replies, their feedback appears on the dashboard automatically
- **Photo evidence** stored and viewable from both the dashboard and the email
- All data is real, persistent, and pushed to the dashboard via WebSocket — no manual refresh

Stack: **Vite + React** (frontend) · **Supabase Postgres + Storage + Realtime** (data) · **Resend** (transactional + inbound email) · **Vercel** (hosting + serverless functions). Every service has a free tier sufficient for this prototype — total monthly cost: ₹0.

---

## What you'll have at the end of this guide

| URL | Who uses it | Purpose |
|-----|-------------|---------|
| `https://<your-app>.vercel.app/` | Anyone | Landing page with two buttons |
| `https://<your-app>.vercel.app/report` | Workers / NDOs (mobile) | Incident reporting form |
| `https://<your-app>.vercel.app/dashboard` | Leadership (laptop) | Live Area × Category matrix |

---

## One-time setup (≈25 minutes)

### Step 1 — Create the Supabase project (5 min)

1. Go to <https://supabase.com> and sign up (GitHub login is fastest).
2. Click **New project**. Region: `ap-south-1` (Mumbai) — closest to Bharuch.
3. Pick a strong DB password and save it. Wait ~2 min for the project to provision.
4. Once the dashboard loads, open **SQL Editor** (left sidebar).
5. Open `supabase/schema.sql` from this repo, copy the entire contents, paste into a new SQL Editor query, and click **Run**.
6. Verify it worked: go to **Table Editor** — you should see an `incidents` table; go to **Storage** — you should see an `incident-photos` bucket marked Public.
7. Open **Project Settings → API**. Copy the two values you'll need later:
   - **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - **anon public** key (long JWT-style string)
   - **service_role** key (used only server-side — keep secret)

### Step 2 — Create the Resend account for emails (5 min)

1. Go to <https://resend.com> and sign up.
2. Once logged in, your account automatically gets a free subdomain like `cool-hedgehog.resend.app`. Note it — you'll see it in the dashboard.
3. Open **API Keys** → **Create API Key**. Name it `night-watch`. Copy the key (`re_…`) — you'll only see it once.
4. **Set up inbound parsing:**
   - Open **Receiving** in the left sidebar.
   - Click **Add Webhook**.
   - Endpoint URL: leave blank for now — you'll fill it in after deploying to Vercel (Step 5).
   - Event: select **email.received**.
   - Save. We'll come back to update the URL.

### Step 3 — Push this repo to GitHub (2 min)

1. Create a new empty repo on GitHub (private is fine).
2. From inside this project folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

### Step 4 — Deploy to Vercel (5 min)

1. Go to <https://vercel.com> and sign up (use GitHub login).
2. Click **Add New → Project**. Pick the repo you just pushed.
3. **Framework Preset**: Vite (auto-detected).
4. Before clicking Deploy, expand **Environment Variables** and add these one by one (use values from Steps 1–2):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon public** key |
   | `RESEND_API_KEY` | Your Resend API key (`re_…`) |
   | `FROM_EMAIL` | `alerts@<your-id>.resend.app` |
   | `REPLY_TO_DOMAIN` | `<your-id>.resend.app` |
   | `PUBLIC_SITE_URL` | Leave blank for now — fill after first deploy |
   | `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase **service_role** key |

5. Click **Deploy**. Wait ~1 minute.
6. Once deployed, copy the URL Vercel gives you (e.g. `https://jhagadia-night-watch.vercel.app`).
7. Go to **Settings → Environment Variables** and update `PUBLIC_SITE_URL` to that URL.
8. Redeploy: **Deployments → … → Redeploy**.

### Step 5 — Wire the inbound webhook back to Resend (1 min)

1. Back in Resend → **Receiving** → click your webhook.
2. Endpoint URL: `https://<your-vercel-url>/api/inbound`
3. Save.

### Step 6 — Set the real HOD email addresses (2 min)

By default the form/email mappings use `*@example.com` placeholders. Open **two files**:

- `src/lib/config.js` — used by the browser (manual feedback button shows the address)
- `api/notify.js` — used by the server to actually send emails

In **both** files, replace the email addresses inside `AREA_LEADERS` with the real HOD emails. Commit and push — Vercel auto-redeploys.

> The two copies exist because the browser code can't import server-side files. If you want a single source of truth, move the mapping to a Supabase table later. For the prototype, two lockstep edits are fine.

---

## Test it end-to-end

1. Open `https://<your-app>.vercel.app/dashboard` on your laptop.
2. Open `https://<your-app>.vercel.app/report` on your phone.
3. Submit a test incident with a photo.
4. **Within ~1 second**, the dashboard cell flashes orange ("NEW" badge), incident appears in the live feed.
5. Check the inbox of the HOD email you configured for that area — there should be a formatted email with the photo embedded.
6. Reply to the email with any text. Within ~5 seconds the dashboard updates: the cell turns green, the modal shows the feedback.

---

## How the real-time push works

- The Supabase database has Realtime replication enabled on the `incidents` table.
- The dashboard subscribes via `supabase.channel('incidents-realtime').on('postgres_changes', …)`.
- When a new row is inserted, Supabase pushes the event over WebSocket → the React state updates → the matrix re-renders. No polling, no refresh button.

## How the email reply capture works

- Each outbound email's **Reply-To** is set to `incident+<INC-ID>@<your-id>.resend.app`.
- When the HOD replies, their email client sends to that address.
- Resend receives it, parses subject/body/attachments, POSTs the data to `/api/inbound`.
- Our handler extracts the incident ID from the To address, cleans the quoted thread out of the body, and runs `UPDATE incidents SET feedback = …`.
- Supabase Realtime fires an UPDATE event → the dashboard updates instantly.

---

## Local development (optional)

```bash
# install
npm install

# create .env.local from .env.example, fill in values
cp .env.example .env.local

# run
npm run dev
# → http://localhost:5173
```

The serverless functions in `api/` only run on Vercel (or `vercel dev`). For purely local testing of the UI without emails, leave `RESEND_API_KEY` unset and the `/api/notify` call will silently no-op.

---

## Going from prototype to production

When the prototype is approved and you're ready to harden it for DCM Shriram's production:

1. **Tighten RLS**: in `supabase/schema.sql`, replace the `anon_*` policies with role-based policies that require auth.
2. **Use a custom domain for emails**: in Resend, add `safety.dcmshriram.com` (or similar), verify the DNS records, set `FROM_EMAIL=alerts@safety.dcmshriram.com` and `REPLY_TO_DOMAIN=safety.dcmshriram.com`.
3. **Move HOD mapping to a database table** so HR can edit it without code changes.
4. **Add SSO**: Supabase Auth + Microsoft Azure AD lets HODs log in with their corporate credentials.
5. **Add escalation cron**: a simple Supabase Edge Function on a 1-hour schedule that emails Plant Head when an incident has been Open for >12 hours.
6. **Upgrade to Supabase Pro** ($25/mo) — gets you 8 GB database, daily backups, no auto-pause.

---

## Project structure

```
jhagadia-safety/
├── api/                     # Vercel serverless functions
│   ├── notify.js            # POST /api/notify — sends HOD email
│   ├── inbound.js           # POST /api/inbound — receives HOD reply
│   └── package.json         # server-side deps
├── public/
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   ├── config.js        # plant areas, categories, HOD mapping
│   │   ├── supabase.js      # client init
│   │   └── data.js          # CRUD + realtime subscription
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── ReportPage.jsx
│   │   └── DashboardPage.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/
│   └── schema.sql           # one-shot DB setup
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```
