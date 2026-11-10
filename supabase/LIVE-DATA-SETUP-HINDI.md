# CricketData connection — one-time Supabase setup

The website code is ready. GitHub Pages deployment does NOT deploy Supabase functions or run SQL migrations.

1. Open https://supabase.com/dashboard/project/hpzrdrbnwpvbzakgznxg/sql/new
2. Copy the complete contents of `supabase/migrations/20261110_cricketdata_feed.sql` into SQL Editor and Run. Existing cricket prediction tables/functions must already be installed. This adds a private feed cache and accepts provider UUID match IDs; existing numeric IDs continue to work.
3. Open https://supabase.com/dashboard/project/hpzrdrbnwpvbzakgznxg/functions
4. Open **cricket-live → Code**, replace **index.ts** with the complete `supabase/functions/cricket-live/index.ts` from this repository, then **Deploy**. This uses the existing `jsr:@supabase/server` publishable-key authentication wrapper.
5. In Edge Function Secrets, keep the regenerated CricketData key under **CRICKET_DATA_API_KEY**. Never put it in app.js, config.js, GitHub, a browser URL, or a screenshot. Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the server; never copy the service key into the website.
6. Open https://krishnanare9.github.io/opinzo/#matches and refresh. Successful integration shows **Source: CricketData**, snapshot time and provider-supplied match times/statuses. If setup fails, inspect the function deployment/log status without sharing credentials.

## Free-plan behavior

- Shared database cache refreshes currentMatches offset 0 at most every **15 minutes** and at most **96 provider attempts per UTC day**. Website refresh does not bypass this limit. Failed attempts also count; retry after the interval. Other apps / API playground requests consume the account's remaining quota.
- These are delayed snapshots, not continuous real-time updates. After 3 minutes the UI stops presenting status as freshly confirmed LIVE. It may therefore show an unknown live count between snapshots.
- One provider page is fetched per snapshot. A `+` count indicates a lower bound when coverage or statuses are incomplete. This implementation does not promise every worldwide match or future fixture.
- Current match data can supply scores, explicit boolean status flags and UTC start time. Missing flags stay unknown. Missing league names stay Unclassified. No inferred statuses from score strings or batting stars.
- Exchange odds, bookmaker odds and all future fixtures are not provided by this integration. No generated odds, automatic results settlement, cash deposits or withdrawals are added.
- No CricketData key: old ESPN RSS fallback. Configured key with an error: explicit failure / stale cached snapshot; no silent RSS substitution.

## Offline validation

From repository root run `node --check app.js` and `node tests/cricketdata-feed.test.cjs`. These checks use synthetic data, not a real credential. A successful real provider response is only verified after the SQL and Edge Function deployment above.
