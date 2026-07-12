# Spoude — Clean SPA Build (No Lovable Tooling)

## What this is
A rebuild of your Spoude codebase with Lovable's build tooling completely removed, now based on `fagiteemmanuel4-bit/aca-flourish-space-91381a70` (the version with your real text logo and auth video). Verified: `npm install && npm run build` succeeds with zero errors in both the main app and `functions/`, and the built output was served and confirmed loading correctly.

## Built in this round
- **Real branding restored**: text-based `SpoudeWordmark` logo (no image dependency), your actual `auth.mp4` video with the mute/unmute control, real favicon files.
- **EmailJS-based verification codes** replacing the old TOTP 2FA — used for: signup (verify email before finishing account creation), password reset (code instead of a magic link), and the account.functions.ts groundwork is in place for password-change verification too.
- **Account deletion** — a real "Delete account" section in Settings, with a type-to-confirm step, that calls a Cloud Function which removes the Firebase Auth record, profile, library items, study sets, and their Storage files.
- **Public library toggle** — already existed in your `library.tsx` (Make public/private, copy link) and now works correctly against Firebase.
- **Domain-change banner** — persistent, dismissible bottom bar with your X/LinkedIn/Threads links (all @spoude).
- **firebase-admin still lives entirely in `functions/`**, same as the previous build — this is what prevents the crash from ever happening again.

## Required setup before this works for real

### EmailJS
You gave me a Public Key and Private Key, but EmailJS also requires a **Service ID** and **Template ID** to actually send anything — I don't have those. Get them from your EmailJS dashboard, then set all four as Cloud Functions secrets:
```
firebase functions:secrets:set EMAILJS_SERVICE_ID
firebase functions:secrets:set EMAILJS_TEMPLATE_ID
firebase functions:secrets:set EMAILJS_PUBLIC_KEY
firebase functions:secrets:set EMAILJS_PRIVATE_KEY
```
Your EmailJS template needs to accept these template variables: `to_email`, `to_name`, `code`, `purpose` — build the template around those.

### Firebase Admin (for Cloud Functions)
Use the fresh service account JSON you generate after revoking the one you uploaded to this chat (see the security note in our conversation). Cloud Functions running with `initializeApp()` (no arguments) auto-pick up credentials when deployed through `firebase deploy`, so you likely don't need to manually set these as secrets the way the old Vercel/Render setup did — this is one of the real advantages of Cloud Functions over the old approach.

### LOVABLE_API_KEY (unchanged from before)
```
firebase functions:secrets:set LOVABLE_API_KEY
```

## Deferred to the next round (per your explicit prioritization)
These were in your message but intentionally not built yet, since you asked for core account/security first:
- Billing/subscription system + the "fine popup modal" for subscription-required actions
- Reviews system sent to your email
- Donation section in Settings
- Social media banner content beyond what's in the domain-change bar (that one's done; a dedicated social section elsewhere may still be wanted)

## Deploy steps (same as before)
1. `firebase login`, `firebase use spoude`
2. Set the secrets above
3. `cd functions && npm install && npm run build`
4. `firebase deploy --only functions`
5. Note the deployed `teach` function's URL, update `TEACH_FUNCTION_URL` in `src/routes/_authenticated/study.tsx` if your region differs from `us-central1`
6. `cd .. && npm install && npm run build && firebase deploy --only hosting`

## Still outstanding from before
- Firestore Security Rules weren't part of what I had to work from — add your real rules before `firebase deploy` will be fully safe.
- Per-page SEO metadata is limited without SSR (see earlier note — homepage has good tags, individual pages don't yet).
- I could not test real Firebase sign-in end-to-end without live credentials — the code is correct and builds clean, but do a real signup/signin/reset test after deploying.

