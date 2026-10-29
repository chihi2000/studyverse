# Prompt for Claude Cowork: custom domain, email sending and inbox

Copy everything below the line into Cowork.

---

Set up the custom domain and email for my web app Studyverse. The code is already done; this is only configuration in Vercel, OVH, Resend and ImprovMX.

**Context**
- App: Next.js on Vercel, project `ghadachihi10s-projects/studyverse` (current URL https://studyverse-six-puce.vercel.app). Code: GitHub `chihi2000/studyverse`, local folder `~/Projects/studyverse`.
- Domain: `devappland.com`, DNS managed at OVH. Use ONLY the subdomain `studyverse.devappland.com`. Do not modify, delete or replace any other DNS record of devappland.com (the root and other subdomains serve other sites).
- Email is sent with Resend (password reset + email verification). The app reads `RESEND_API_KEY` and `EMAIL_FROM`; without the key it just logs emails.

**Rules**
- Never print, paste or store secrets (API keys, passwords) in chat or files; enter them only in the provider dashboards or with `vercel env add`.
- Ask me before accepting any terms of service or choosing any paid plan. Free plans only.
- Do not change the code and do not push to GitHub.

**1. Website on studyverse.devappland.com**
1. In Vercel → project studyverse → Settings → Domains, add `studyverse.devappland.com` (CLI: `npx vercel domains add studyverse.devappland.com`).
2. At OVH (Web Cloud → Domain names → devappland.com → DNS zone), add an **A record**: subdomain `studyverse` → `76.76.21.21` (TTL default).
   - IMPORTANT: use an A record, NOT a CNAME. A CNAME on `studyverse` would forbid the MX records needed for the inbox in step 3.
   - If Vercel shows a different IP for this domain, use the one Vercel shows.
3. Wait until Vercel shows the domain as valid with an HTTPS certificate.
4. In Vercel → Domains, set `studyverse-six-puce.vercel.app` to **redirect (308)** to `studyverse.devappland.com`.

**2. Sending email with Resend**
1. I will sign up at resend.com myself (or ask me to). Add the domain `studyverse.devappland.com`, region **eu-west-1 (Ireland)**.
2. Add at OVH exactly the DNS records Resend shows (they live on separate names such as `resend._domainkey.studyverse` and `send.studyverse`: DKIM TXT, SPF MX + TXT). Also add a DMARC record: TXT on `_dmarc.studyverse` with value `v=DMARC1; p=none;`.
3. Click Verify in Resend and wait until the domain is verified.
4. Create an API key named `studyverse-prod` with **sending access only, restricted to this domain**.

**3. Receiving email: contact@studyverse.devappland.com**
1. Create a free ImprovMX account (improvmx.com) and add the domain `studyverse.devappland.com`.
2. Add at OVH, on the subdomain `studyverse`: MX `mx1.improvmx.com.` priority 10, MX `mx2.improvmx.com.` priority 20, and TXT `v=spf1 include:spf.improvmx.com ~all`.
3. Create the alias `contact@studyverse.devappland.com` forwarding to my personal mailbox (ask me which address). Optionally a catch-all `*` to the same address.
4. Wait for ImprovMX to show the domain as active.

**4. Vercel environment variables (Production), then redeploy**
From `~/Projects/studyverse` (replace existing values if present):
- `RESEND_API_KEY` = the Resend key (mark as sensitive)
- `EMAIL_FROM` = `Studyverse <noreply@studyverse.devappland.com>`
- `BETTER_AUTH_URL` = `https://studyverse.devappland.com`
- `BETTER_AUTH_TRUSTED_ORIGINS` = `https://studyverse-six-puce.vercel.app`
- `VAPID_SUBJECT` = `mailto:contact@studyverse.devappland.com`

Also enable **Web Analytics** in the Vercel project (Analytics tab, free plan). Then redeploy production: `npx vercel deploy --prod --yes`.

**5. Check everything and report**
- https://studyverse.devappland.com loads with a valid certificate; https://studyverse-six-puce.vercel.app redirects to it.
- Sign up on the site with a real mailbox you can read (or ask me): the "Confirme ton adresse e-mail" email arrives from `noreply@studyverse.devappland.com`, not in spam, and its link confirms the account.
- "Mot de passe oublié" on /connexion: the email arrives, the link opens /reinitialiser, the new password works.
- Delete that test account afterwards from /compte → Supprimer mon compte.
- An email sent to contact@studyverse.devappland.com reaches my personal mailbox.
- Resend dashboard shows the sent emails as delivered.
- Tell me the final state of each step, and list anything you could not do.
