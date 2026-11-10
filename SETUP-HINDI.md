# OPINZO — GitHub par free website kaise chalayein

## Step A — Turant demo online karo (₹0)

1. ZIP download karke **Extract All** karo.
2. <https://github.com/new> kholo. Repo ka naam **opinzo**, visibility **Public** rakho.
3. Repo me **Add file > Upload files** par click karo. Extracted folder ke **andar ki sab files** upload karo. ZIP upload mat karna. `index.html` repo ke root me hona chahiye, aur `assets/favicon.svg` apne folder me.
4. **Commit changes** karo.
5. **Settings > Pages > Deploy from a branch > main > /(root) > Save**.
6. Web link: `https://YOUR_USERNAME.github.io/opinzo/`

Abhi site demo mode me hogi. Aap YES/NO click kar sakte ho, 25 virtual points laga sakte ho, aur **Demo tools** se outcome simulate karke wallet check kar sakte ho.

## Step B — Real online users aur secure points chalu karo (Supabase Free)

1. <https://supabase.com/dashboard> par naya **Free project** banao.
2. **SQL Editor > New query** me `schema.sql` ka poora code paste karke Run karo. Ye tables, wallet ledger, signup bonus, admin permissions aur security banayega.
3. **Authentication > Providers > Email** enable karo aur email confirmation on rakho.
4. **Authentication > URL Configuration** me apni GitHub Pages URL ko Site URL aur Redirect URL me add karo.
5. **Project Settings > API Keys** se **Project URL** aur **publishable / anon key** copy karke `config.js` me paste karo. `service_role` key kabhi GitHub par mat daalna.
6. Updated `config.js` GitHub repo me commit karo.
7. Website par signup karo, email verify karo. Ab real user account banega aur 500 free virtual points milenge.
8. Supabase **Authentication > Users** se apni account UUID copy karo. **SQL Editor** me ye chalao:

```sql
insert into public.app_admins(user_id)
values ('YAHAN-APNI-ACCOUNT-UUID-DAALO')
on conflict do nothing;
```

9. Website refresh karo, `/#admin` par admin panel khulega. Market create karo. Deadline ke baad source verify karke YES, NO ya VOID (refund) settle karo.

**Zaroori:** Virtual points ko real money, gift cards, withdrawal ya paid bets me convert mat karna. Is starter me koi automatic result verification nahi hai; admin result ko manually verify karta hai. User data aur points protect karne ke liye SQL backend zaroori hai — sirf GitHub Pages se real multi-user wallet secure nahi banta.

Detailed instructions aur troubleshooting `README.md` mein hain.