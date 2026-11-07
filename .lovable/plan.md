# FireZone admin controls, sign-in, and personal alerts

## What will change
- Add a Google account-choice sign-in button. It will use the app's verified Google sign-in and only open Home after a real session; new players without a Free Fire UID/IGN will finish their profile first. Do not trust email values or sessions supplied through browser storage or a custom Android event.
- Make the Admin dashboard easier to scan with separate Management and Tournament areas, clickable totals, and direct links for Users, Payments, and Push Notifications.
- Build a searchable user list (name, Gmail, coins) and a separate user detail page with name, Gmail, Android device ID when available, referral code, registration date, and current coins. Do not collect or show IP addresses.
- Add secure admin-only block/unblock and coin adjustment actions, with server-side balance checks and audit records. Prevent regular users from changing their own account status.
- Ensure deposit success/failure, withdrawal approval/rejection, and room publication reach the affected user as personal push alerts through FireZone's existing notification and protected Firebase delivery path. Never use a client-side Firebase server key or broadcast private payment/account details.

## Implementation notes
- Keep Google auth and admin operations on verified server-authenticated paths; the Android bridge may provide device metadata only, never authenticate a user by email alone.
- Use the existing database and notification/push pipeline. Apply any necessary schema/function changes through a Lovable Database migration with explicit grants, RLS, and audit logging.
- Preserve existing payment settlement, wallet ledger, room credential, and push-secret safeguards; do not expose room passwords, IP addresses, or server credentials.

## Validation
- Run relevant project tests and inspect the current build log.
- Verify Google account choice doesn't navigate before authentication, and review the admin list/detail and action states on mobile.
- Confirm the configured event paths create recipient-specific notifications and use only the protected push delivery flow; report if real-device delivery needs a published build or registered device.
