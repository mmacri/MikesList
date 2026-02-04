# Mike's List

Craigslist-style, single-vertical classifieds built with Next.js App Router + SQLite + Prisma. Includes a static marketing site in `/docs` that deploys to GitHub Pages.

## Repo Layout

- `/docs` static landing site (GitHub Pages)
- `/app` Next.js app (server-rendered, SQLite)
- `/docker` Dockerfile + docker-compose for self-hosted deployment
- `/.github/workflows` CI + Pages deploy

## GitHub Pages (Docs Landing Site)

This repo deploys `/docs` to GitHub Pages via `.github/workflows/pages.yml`.

1. Go to **Settings → Pages** in your GitHub repo.
2. Set **Source** to **GitHub Actions**.
3. Push changes to `main` under `docs/**` or run the workflow manually.

### If You See the README Instead of the Landing Page

That means Pages is still set to **Deploy from a branch** (usually the repository root). Switch to **GitHub Actions**, or set the branch source to `/docs`. The landing page URL should look like:

```
https://mmacri.github.io/MikesList/
```

### Configure `APP_BASE_URL`

Update the app base URL in `docs/assets/app.js` so all landing-page links point to your live app:

```js
const APP_BASE_URL = "https://your-app-domain.com";
```

If you want sitemap URLs to reflect your GitHub Pages domain, update `docs/sitemap.xml` as well.

## Quick Start (Local Dev)

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set values:

- `DATABASE_URL=file:./dev.db`
- `SITE_URL=http://localhost:3000`
- `SMTP_*` credentials
- `TOKEN_SALT_SECRET` and `IP_HASH_SALT_SECRET` (random strings)
- `ADMIN_PASSWORD_HASH` (bcrypt hash)
- `CRON_SECRET` (random string)

3. Generate Prisma client and migrate:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Admin Login

Generate a bcrypt password hash:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('your-password',10));"
```

Set the output in `ADMIN_PASSWORD_HASH`, then visit `/admin/login`.

## SMTP Setup

Set these in `.env`:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_FROM`

Emails sent:

- Manage listing link after posting
- Replies (email relay)
- Expiration reminders

## Stripe (Optional)

Set `MONETIZATION_ENABLED=true` and provide:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_FEATURED_30_DAYS`
- `STRIPE_PRICE_BUMP_ONCE`

Configure your Stripe webhook to `POST /api/stripe/webhook`.

## Scheduler (No Managed Cron Required)

The app uses `node-cron` internally to run daily:

- Expire listings
- Send reminder emails

If you prefer external cron, call:

- `POST /api/cron/expire`
- `POST /api/cron/reminders`

Include `x-cron-secret: <CRON_SECRET>` header.

Note: Reminder emails include a fresh manage link for renewals. Use the latest email.

## Docker (Self-Hosted)

Build and run with a persistent SQLite volume:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

The SQLite DB lives at `/data/mikeslist.db` inside the container and is persisted via the `mikeslist-data` volume.

## CI

GitHub Actions runs lint, typecheck, and build on every push/PR using `.github/workflows/ci.yml`.

## Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`

Local migration:

```bash
npx prisma migrate dev --name init
```

Production migration:

```bash
npx prisma migrate deploy
```

## Deployment Notes

- The app requires a server and persistent disk because SQLite is file-based.
- GitHub Pages only hosts the static `/docs` site. The app is not deployed to Pages.
- Ensure `SITE_URL` is correct for absolute email links.
- Do not log emails or message bodies.
