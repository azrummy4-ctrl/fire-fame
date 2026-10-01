# FireZone: moving to a standalone Supabase project

## Current state

This repository still connects to its existing Lovable Cloud backend. Do not disconnect or delete it during migration. There is **no separate destination project connected here**, so no live data, accounts, or production traffic have been moved. The bundled migration files describe the original schema and initial sample tournaments; they are **not** a backup of the current database.

## Before changing the app

1. Create a new standalone Supabase project under your own account. Keep its project URL and publishable/anon key for the app; keep its database password and service-role key out of this repository and the browser.
2. Back up the existing backend through an authorized export facility, if available. Take a consistent snapshot of authentication identities, all `public` tables, functions, policies, grants, and any storage. This repository cannot access the managed database password. Never put a dump of users, UPI IDs, wallet transactions, room passwords, or credentials in Git, chat, or a public download.
3. Record row counts and balance reconciliation totals in a private location. Pause new joins, deposits, withdrawals, room publishing, and result publishing for the final export/cutover. Keep the original backend intact for rollback.

## Destination preparation

1. In the destination, configure email authentication, Google OAuth credentials and the new project's allowed redirect URLs. The current Google button uses the Lovable sign-in broker and **must be changed and tested** for standalone Supabase before cutover. Existing users may need a verified password-reset/re-registration flow if password hashes and identities cannot be migrated legitimately.
2. Apply the files in `supabase/migrations/` in timestamp order to an empty destination. The first file defines the original schema/functions/policies and the third inserts **starter** tournaments. Do not insert the starter tournaments if importing live tournaments afterward unless you intentionally reconcile them; otherwise you create duplicates. Check any subsequent schema changes on the source before assuming these files represent the entire live schema.
3. Restore auth identities first, preserving UUIDs only via an authorized secure auth migration. Then import dependent data in FK order: profiles/user_roles/wallets, tournaments, participants, deposits/withdrawals/transactions, notifications/audit_logs/settings. Disable the new-user bootstrap trigger only for a controlled restore if it would create conflicting rows; restore and verify it afterward. Do not re-run wallet credit/debit or prize functions on imported ledger rows: import balances and immutable transactions exactly once, then reconcile.
4. Recreate any storage buckets, access policies, and object files if the source has them. There are currently no configured storage buckets in this project. Rotate provider keys and recreate third-party webhook endpoints/signatures in the destination as applicable; there is **no live payment gateway** here, only manual payment references and admin review.
5. Verify grants, row-level policies, admin role rows, restricted function execution, and room-detail access. The existing `tournaments` public read policy includes `room_id` and `room_password` columns in the table; restrict public column exposure before relying on room privacy in a standalone deployment.

## App cutover (only after data verification)

1. Replace the app's deployment configuration for `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` with values from **the destination**. Never commit a service-role key. The generated Supabase client/integration files in this Lovable project are managed files; for a standalone deployment, make changes in an independently owned copy of the source rather than overriding managed configuration here.
2. Replace the Lovable-specific Google broker in `src/routes/auth.tsx` with the destination's configured OAuth flow and test public callback/redirect handling. Ensure sign-out and session renewal work after hard refresh. The email/password path uses Supabase directly already.
3. On a non-production copy, test signup/login, admin access, tournament join exactly once, wallet deduction and ledger consistency, room visibility only to joined players after publishing, result/prize settlement exactly once, deposit review, withdrawal approval/refund, and notifications. Include anonymous and non-admin denial tests. Reconcile counts and wallet totals against the private source snapshot.
4. Switch traffic only after sign-off; keep the original backend untouched until the rollback window closes. Roll back app configuration to the old backend if validation fails—never replay monetary events to repair an incomplete import.

## Blockers

- A destination standalone project and its **public URL + publishable key** have not been provided or connected.
- This environment does not provide an authorized full export of managed auth identities/password hashes or a consistent private database dump. Without one, lossless user/financial history transfer cannot be claimed. Coordinate a private supported export with the backend owner; otherwise plan a verified user re-enrollment and a separately audited, consented financial-data transition.
- No live cutover or end-to-end destination tests have occurred. Do not point production at an empty destination.