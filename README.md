# Studyverse

Portail gratuit pour les étudiants tunisiens : actualités (emplois du temps, examens, annonces, vacances), anciens examens, cours et listes de matériel par filière.

Pilotes : ISAM Mahdia (Université de Monastir) et ISTIC Borj Cédria (Université de Carthage).

## Dev

```bash
cp .env.example .env
npm install
npm run db:up                  # Postgres on localhost:5434
npm run db:migrate
npm run db:seed -- --demo      # --demo adds sample news posts
npm run dev
```

`db:seed` imports universities, institutes and programs from `data/raw/*.json` (format in `data/raw/FORMAT.md`; each entry keeps its sources and a confidence level). Pilot institutes are listed in `PILOTS` in `src/db/seed.ts`.

National announcements (official calendar, holidays) live in `data/posts/*.json` and are imported by the same command.

### Ambassadors

1. Sign up at `/connexion`, then make yourself admin: `npm run user:role -- you@example.com admin`.
2. In `/panel/admin`, assign an institute to an account. This makes the account an ambassador and activates the institute.
3. Ambassadors publish from `/panel/<institute-slug>` (photo of the notice, dates, target program/year).

### Notifications

Students follow an active institute (optionally a program/year) from its page and get a Web Push notification when an ambassador publishes. Generate keys with `npx web-push generate-vapid-keys` and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Push needs HTTPS (localhost is fine in dev); on iPhone it only works once the site is added to the home screen.

Schema changes: edit `src/db/schema.ts`, then `npm run db:generate && npm run db:migrate`.

## Production

`docker build -t studyverse .` builds a standalone Next.js image listening on `PORT` (default 3000). It needs `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` and `UPLOAD_DIR` (mount a volume there for notice photos); see `.env.example`. Run `npm run db:migrate` against the production database before deploying a new schema.
