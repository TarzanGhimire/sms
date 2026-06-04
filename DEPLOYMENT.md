# Deploying School ERP for Free

Stack: **Vercel** (frontend) + **Render** free (backend) + **Neon** free (Postgres).
No email / SMS / payment gateways yet — those can be added later.

> All four accounts are free: GitHub, Neon, Render, Vercel.
> Total cost: **$0** (optional custom domain ~$10/yr).

---

## 0. Push the code to GitHub (one time)

From the project root (`school-erp/`):

```bash
git init
git add .
git commit -m "School ERP initial deploy"
git branch -M main
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/school-erp.git
git push -u origin main
```

---

## 1. Database — Neon (free Postgres)

> ⚠️ NEVER paste your real connection string (with password) into any file you
> commit to git. Keep it only in Render's dashboard / your local untracked `.env`.

1. Go to **https://neon.tech** → sign up → **Create project**.
2. Region: pick **Asia Pacific (Singapore)** — closest to Nepal.
3. After it's created, open **Connection Details** → copy the **connection string**.
   It looks like:
   `postgresql://user:pass@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Keep this — it's your `DATABASE_URL`.

---

## 2. Backend — Render (free)

1. Go to **https://render.com** → sign up with GitHub.
2. **New +** → **Blueprint** → select your `school-erp` repo.
   Render reads `render.yaml` and creates the `school-erp-backend` service.
3. When prompted, fill the two secrets:
   - `DATABASE_URL` = the Neon string from step 1.
   - `FRONTEND_URL` = leave a placeholder for now (e.g. `https://example.vercel.app`); you'll fix it in step 4.
   - (`JWT_SECRET` / `JWT_REFRESH_SECRET` auto-generate — leave them.)
4. Click **Apply** / **Create**. First build takes ~3–5 min.
5. On boot it runs `prisma migrate deploy`, creating all tables on Neon automatically.
6. Copy your backend URL — e.g. `https://school-erp-backend.onrender.com`.
7. Quick test in a browser:
   `https://school-erp-backend.onrender.com/api/v1/settings` → should return JSON.

> ⚠️ Free Render sleeps after 15 min idle; the first request then takes ~30s to wake. Normal for free tier.

---

## 3. Seed the first admin (one time)

The database is empty. Create the Super Admin by running the seed **from your computer**, pointed at Neon:

```bash
cd apps/backend
# Windows PowerShell:
$env:DATABASE_URL="<your Neon connection string>"; pnpm prisma:seed
# macOS/Linux:
DATABASE_URL="<your Neon connection string>" pnpm prisma:seed
```

This creates:
- **admin@school.edu.np / Admin@123**  ← change this password after first login
- a default school settings row + the current academic year.

---

## 4. Frontend — Vercel (free)

1. Go to **https://vercel.com** → sign up with GitHub → **Add New… → Project** → import `school-erp`.
2. **Root Directory**: click *Edit* and set it to **`apps/frontend`**.
   (Vercel auto-detects Next.js and the pnpm workspace.)
3. **Environment Variables** → add:
   - `NEXT_PUBLIC_API_URL` = `https://school-erp-backend.onrender.com/api/v1`
     (your Render URL + `/api/v1`)
4. **Deploy**. ~2 min. You'll get a URL like `https://school-erp.vercel.app`.

---

## 5. Connect the two (fix CORS)

1. Back in **Render** → your backend service → **Environment** →
   set `FRONTEND_URL` = your real Vercel URL (e.g. `https://school-erp.vercel.app`, no trailing slash).
2. Save → Render redeploys automatically (~1 min).
3. Open your Vercel URL → log in with the admin account. Done ✅

---

## Updating later
Push to `main` on GitHub → **both** Vercel and Render redeploy automatically.
Schema changes: create a migration locally (`pnpm --filter backend prisma migrate dev --name <change>`),
commit it, and Render applies it on the next deploy via `prisma migrate deploy`.

## Custom domain (optional)
- Buy a domain (~$10/yr) or use the free `*.vercel.app`.
- In Vercel → Project → **Domains** → add it (Vercel issues free SSL).
- Add the new domain to the backend's `FRONTEND_URL` (comma-separated) and redeploy.

## Backups
- In-app: **Settings → Download Backup (JSON)**.
- Neon also keeps automatic point-in-time backups on the free tier.

## Troubleshooting
| Symptom | Fix |
|--------|-----|
| Login page loads but actions fail / CORS error | `FRONTEND_URL` on Render must exactly match the Vercel URL (no trailing slash). |
| First request very slow | Render free cold start (~30s). Upgrade to Render Starter ($7) or a $5 VPS to remove it. |
| `NEXT_PUBLIC_API_URL` changes not taking effect | Redeploy the Vercel project (env vars are baked at build time). |
| Migrations didn't run | Check Render logs; ensure `DATABASE_URL` includes `?sslmode=require`. |
