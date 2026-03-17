

## Diagnostic

The `demo-otp-signup` edge function is failing due to two issues:

1. **CORS headers are incomplete** -- The function is missing the newer Supabase client headers (`x-supabase-client-platform`, etc.). The JS client sends these headers, the preflight OPTIONS check fails, and the browser blocks the actual request entirely. The logs only show "booted" with no request processing, confirming the request never reaches the handler.

2. **The OTP sending strategy is fragile** -- The function uses `generateLink` (admin) to create the user, then `signInWithOtp` via anonClient to send the email. The anonClient call can fail if OTP signups are restricted or rate-limited at the auth level. A simpler approach: use only the admin API to both create the user and send the OTP.

3. **No ref token handling** -- If a user visits `/demo` without `?ref=`, `refToken` is `null`, and the edge function rejects with 400 ("missing required fields"). But the frontend allows this path.

## Plan

### 1. Fix `supabase/functions/demo-otp-signup/index.ts`

- Update CORS `Access-Control-Allow-Headers` to include all required Supabase client headers
- Replace the two-step approach (generateLink + signInWithOtp via anonClient) with a single admin-based approach: use `supabase.auth.admin.generateLink({ type: 'magiclink', email })` to create the user, then use `supabase.auth.admin.generateLink({ type: 'email_otp', email })` or simply call `signInWithOtp` using the **service role client** instead of the anon client
- Actually, the simplest fix: use the service role client for `signInWithOtp` instead of the anon client, since the service role bypasses all restrictions

### 2. Fix `src/components/pages/DemoPage.tsx`

- When `refToken` is null, show an error state instead of allowing the email form (since the edge function requires a valid token)
- OR: make the token optional in the edge function (but this breaks the security model)

The correct fix: if no `?ref=` token is present, show the "invalid link" screen.

### Technical Details

**Edge function CORS fix (critical):**
```
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

**OTP sending fix:** Replace anonClient `signInWithOtp` with service role client `signInWithOtp` (lines 87-103 of the edge function). The service role key bypasses all auth restrictions including signup limits.

**DemoPage fix:** Change line 20 from `refToken ? null : true` to `refToken ? null : false` so visiting `/demo` without a token shows the invalid link screen.

