# TAWḤĪD KIDS · OneSignal iOS/Web rollout (not live)

Date: 2026-10-18. Branch: `feature/tawhid-kids-push-isolation-20261018`.

## Scope and isolation

- OneSignal KIDS app ID: `f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766`
- Native visitor bundle: `de.daraltawhid.kids`. Creator/test bundle must never register for production push.
- Adult OneSignal App ID `786d7cd6-0455-4434-ab14-0c10a7bc6b1e` is never a Kids fallback.
- Existing Kids Supabase table `public.kids_push_subscriptions` has RLS, no public policies and defaults disabled; it remains empty until secure server-side enrollment exists.
- Web Push is **explicitly disabled** on the shared main-domain `dar-al-tawhid.de`. Browser permission/storage is per origin, not per URL path. Do not activate two distinct OneSignal Web apps on the same origin without verified isolation.
- Future dedicated Kids origin: `https://kids.dar-al-tawhid.de`. The Kids PWA and its `/kids/` paths must all be served by the same new host before enabling browser push there.
- OneSignal Web Site URL currently configured to `https://dar-al-tawhid.de` during onboarding and must be changed to the dedicated origin **only after** the separate host resolves correctly. The write-once onboarding API cannot update this setting; the OneSignal dashboard can.

## Secrets and platform gates

- Production Cloudflare Worker must be provided **Kids-only** secrets via the secrets manager, not GitHub:
  - `ONESIGNAL_KIDS_APP_ID` = the public Kids UUID above.
  - `ONESIGNAL_KIDS_API_KEY` = a fresh KIDS **app-scoped** REST API key (server side only).
- Do **not** use `ONESIGNAL_API_KEY`, `ONESIGNAL_API_KEY_NEW`, `ONESIGNAL_APP_ID` or the adult REST key in the Kids lane.
- If any REST key was committed to a public repository (including previous `.replit` files), rotate it in OneSignal and update its secret binding before enabling production push. Deleting a file does not purge git history.
- On Apple Developer Portal, bundle `de.daraltawhid.kids` must have Push Notifications capability and matching provisioning.
- APNs .p8 credentials were stored by the account owner in the OneSignal Kids dashboard. Verify settings there; do not copy .p8 into source.
- Native OneSignal SwiftPM XCFramework is pinned to `5.5.6`. Open Xcode on macOS to resolve and build it. Debug uses sandbox APNs; Release uses production APNs. Do **not** publish until a signed device build has registered a subscription.
- Kids parental controls must request permission only after a deliberate parent action. The native flow uses device-owner authentication and OneSignal SDK privacy consent gating. Device-owner authentication is **not** a substitute for verified legal guardianship on child-owned devices; server enrollment must separately verify parent authority before scheduling automated messages.

## Checks before merge or deployment

1. `node kids/tools/test-kids-push-isolation.cjs` must pass.
2. Build the visitor, simulator and creator schemes; verify test bundle does not subscribe to production OneSignal.
3. Check Kids `/kids/start`, all heroes, scroll, existing offline SW `/kids/sw.js`, progress persistence, Kids parent settings; adult visitor/test site and root push worker unchanged.
4. After dedicated Kids web origin and Web Site URL are configured, verify the worker returns JavaScript at `/kids/push/onesignal/OneSignalSDKWorker.js`; verify parent-triggered Web subscription on that origin only. iOS Home Screen PWA web push requires iOS 16.4+.
5. Provide a secure parent enrollment endpoint, verify consent and registration in Supabase. Backend senders must target only authorized Kids subscriptions and calculate prayer times per stored location/timezone and calculation method. No automatic prayer, quiz, learning or content messages until the enrollment, deduplication and schedules are independently tested.
6. With explicit test-device consent, send **one** targeted notification, verify delivery in OneSignal, tap deep link, then enable production scheduling gradually.
7. Review OneSignal setup telemetry choice: **keep local**, never send onboarding milestone checkpoints.

## Known blockers

- Kids Cloudflare app-scoped API secret has not yet been configured or verified.
- Dedicated Kids Web origin is not provisioned and the OneSignal Web Site URL still targets the main domain.
- Native iOS project has not been built or run on a signed Apple device in this environment.
- Real Supabase parental authorization/enrollment and daily cron scheduler are not yet connected.
- No live message delivery has been verified.

No changes in this branch are to be merged to the default branch without passing the above gates.
