# OPINZO — Free Virtual-Points Prediction Platform

**Think it. Predict it. Prove it.**

A deployable, responsive prediction website: discover questions, make YES/NO picks, win or lose free virtual points, track history and rank on a leaderboard. Built for **GitHub Pages** + **Supabase Free**. No React build process, Node hosting or credit card required for the basic setup.

> ⚠️ OPINZO is **not** a real-money prediction exchange. Points are free, non-purchasable, non-transferable and have no monetary or redeemable value. Do not add paid stakes, withdrawal, gifts, financial prizes or wagering without appropriate legal advice and a separate compliance architecture.

## What's included

| Feature | Browser demo | Supabase online mode |
| --- | --- | --- |
| Mobile-friendly prediction marketplace | ✅ | ✅ |
| Search / category filters / trending sorting | ✅ | ✅ |
| Virtual wallet with transaction history | ✅ (local storage) | ✅ (database ledger) |
| Choose YES / NO and stake 10 / 25 / 50 / 100 | ✅ | ✅ |
| Reward correct pick 2× stake / wrong pick loses stake | ✅ (simulated) | ✅ (trusted SQL transaction) |
| One pick per market per account | ✅ (one browser profile) | ✅ (database constraint) |
| Public leaderboard | ✅ (illustrative sample rankings) | ✅ (actual registered users) |
| Create questions and resolve results | ✅ (demo tools) | ✅ (admin-only secure functions) |
| VOID / refund invalid markets | ✅ | ✅ |
| Email / password registration | Not applicable | ✅ |
| Google login | Not applicable | Optional: enable Google provider in Supabase |
| Automatic feeds, verified results, auto settlement | ❌ | ❌ — admin must settle after the deadline |

## Files

```
opinzo/
├── index.html         # Website layout
├── styles.css         # Responsive design
├── app.js             # Pages + UI + API + demo mode
├── config.js          # Public Supabase URL and publishable key
├── schema.sql         # Secure SQL tables, RLS policies, RPC functions
├── assets/favicon.svg
├── .nojekyll          # GitHub Pages: publish static files unchanged
└── README.md
```

## 1. Test without any accounts (2 minutes)

Open `index.html` in your browser. Because `config.js` has empty values, the app switches to **DEMO** mode automatically.

Try: click YES/NO on a question, stake 25 points and confirm. Your starting balance changes from 500 to 475. Go to `My Predictions` and `My Wallet` to see your history. Open **Demo tools** at the bottom of the right rail (or navigate to `#admin`) to simulate a verified YES, NO or VOID outcome. Correct pick returns 50 points (net +25), a wrong pick returns zero (net −25), and VOID refunds 25. Demo information stays on this browser through `localStorage`; it is *not* an online account system. Demo market questions, counts and leaderboard profiles are examples, not live factual claims.

## 2. Publish on GitHub Pages — ₹0

1. Go to <https://github.com/new> and create a **public** repository named `opinzo`.
2. Extract the ZIP. Open the repository, select **Add file → Upload files** and upload the **contents** of the `opinzo` folder (not the ZIP itself). Ensure `index.html`, `app.js`, `styles.css`, `config.js` and `assets/favicon.svg` are in the right locations. Commit.
3. Go to **Settings → Pages → Build and deployment**. Source **Deploy from a branch**. Branch **main**, folder **/(root)**. Save.
4. Site URL should be: `https://YOUR_GITHUB_USERNAME.github.io/opinzo/`. It will load in DEMO mode until you configure Supabase.

GitHub Pages serves static HTML/CSS/JS and **cannot run a secure backend**. We use Supabase database functions for real shared accounts and wallet operations.

## 3. Enable real accounts + secure virtual coins with Supabase Free

1. Create a **Free** project at <https://supabase.com/dashboard> (separate new project for OPINZO).
2. In your project open **SQL Editor → New query**. Copy the entire content of `schema.sql`, paste and **Run**. This creates the wallet ledger, prediction tables, public market listing, RLS policies, signup trigger, leaderboards and safe database functions. Run on a *new project*, not on your existing database.
3. Go to **Authentication → Providers → Email**. Turn on Email/password. Keep **Confirm email** enabled. If you want Google login, configure Google OAuth provider separately (requires Google's OAuth client configuration); the button is already included in the UI.
4. Go to **Authentication → URL Configuration**. Set Site URL to your GitHub Pages URL and add `https://YOUR_GITHUB_USERNAME.github.io/opinzo/` as an allowed Redirect URL. If testing on localhost, also add its URL, e.g. `http://localhost:8000/`.
5. In **Project Settings → API Keys**, copy the project URL and **publishable** (or legacy **anon**) key. Edit `config.js`:

   ```js
   window.OPINZO_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT.supabase.co",
     supabaseAnonKey: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
   };
   ```

   **NEVER** put a `service_role` key or secret API key in `config.js`, GitHub, or frontend code. The public key is only safe with the SQL RLS and secure functions properly installed.
6. Commit changes and refresh the website. The badge changes to **LIVE BETA**. Users can sign up with email or sign in and start with 500 virtual points.

**Critical:** Email confirmation messages must work for your users. Supabase's default mail service is rate-limited and unsuitable for scaling. Configure appropriate SMTP and bot protection before public promotion.

## 4. Give your own account Admin permissions

1. Sign up on your OPINZO website, then confirm your email.
2. Go to **Supabase Dashboard → Authentication → Users** and copy **your account's UUID**.
3. Go to **SQL Editor** and run (replace the UUID with your actual value):

   ```sql
   insert into public.app_admins(user_id)
   values ('YOUR-ACCOUNT-UUID-HERE')
   on conflict do nothing;
   ```

4. Reload the site. At the bottom of the right rail there is **Admin dashboard**. On smaller screens open the URL with `#admin` appended (for example `https://YOUR_GITHUB_USERNAME.github.io/opinzo/#admin`). Only approved admins can run creation / resolution database functions; hiding the link is *not* the security mechanism.
5. Create a new market with explicit resolution criteria and deadline at least 5 minutes away. Users can make one pick until the deadline. After it closes, **manually verify the authoritative source** and resolve YES, NO or VOID (refunds stakes). Every settlement is atomic and can't be run twice.

## 5. Point math (non-monetary)

| Action | Balance movement | Example, stake 25 |
| --- | --- | --- |
| Signup | +500 | 500 |
| Submit YES/NO | −25 immediately | 475 |
| Correct outcome | +50 payout | 525 final balance = +25 net |
| Incorrect outcome | +0 payout | 475 final balance = −25 net |
| VOID | +25 refund | 500 final balance = 0 net |

The payout is a fixed virtual-point game mechanic, **not a pool or real financial return**. There are no odds, deposits, purchases, withdrawals or prize redemptions.

## Security architecture

- RLS: users only read their own profile, transaction ledger and predictions.
- Public: market questions, aggregate YES/NO *pick counts*, and limited leaderboard aliases / scores. No public emails or wallet transaction records.
- Client: cannot directly write a balance, market, prediction or ledger record. `GRANT` and RLS lock those changes down.
- Atomic RPC: `place_prediction` locks market/account, checks deadline, available points, duplicate choice; debits once and writes ledger in a single database transaction.
- Atomic settlement RPC: admin identity comes from `auth.uid()`; locks market, prevents repeat settlement, checks deadline, awards winners or refunds VOID in one transaction.
- New user bonus is created only by the trusted Auth signup trigger.
- UI escapes untrusted content to avoid HTML injection. External evidence URLs are restricted to HTTPS.

### Before an actual public launch

This starter is a working MVP, **not a security audited or legally approved production service**. Priorities: custom Terms/Privacy, moderation, user reporting, email deliverability, stronger bot/CAPTCHA protection and rate limits, database monitoring, backups, accessibility audit, incident/abuse handling, source verification policies and dedicated staging project. The free backend has usage limits and may pause after inactivity. Never offer money or gift redemptions without obtaining jurisdiction-specific legal advice.

## Troubleshooting

- **Demo badge despite configuring Supabase:** check `config.js` and that `@supabase/supabase-js@2` CDN is not blocked.
- **No markets in Live Beta:** expected at first. Sign in as approved admin, open `#admin` and create your first market.
- **“Account profile unavailable”:** ensure `schema.sql` ran before you created the account. Existing Auth users are not automatically backfilled by the new-user trigger. Use a fresh test account or insert a profile + signup ledger in the SQL Editor after verifying its real UUID.
- **Supabase permission / 404 errors:** check API URL/key, database RPCs, schema, privileges, and public schema exposure. Reload after changing SQL.
- **Google sign-in fails:** set up Supabase Google provider, the Google Cloud OAuth redirect configuration, and the site's allowed redirect URL. Email/password works without Google provider.
- **GitHub URL is 404:** confirm `index.html` is at repo root and Pages is configured to deploy `main` from `/(root)`.
- **Market not settling:** admin can resolve only after `ends_at` has passed; use an official HTTPS source for the outcome or a refund.

## License

You can use and modify this starter for your OPINZO project. Branding is illustrative and domain/trademark availability has **not** been verified.