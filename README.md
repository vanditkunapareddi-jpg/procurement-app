# Supplier Tracker – Multi-Tenant Firestore Guide

This app now scopes all data under `/accounts/{accountId}/...` so each customer/account is isolated. Use this guide to finish setup, migrate existing data, and verify access.

## 1) Configure your account id
- Pick a stable id for your workspace (e.g., `acc_prod`, `acc_dev`).
- In `.env.local`, set `NEXT_PUBLIC_DEFAULT_ACCOUNT_ID=acc_prod` (or type it into the account banner in the UI). This value is stored in localStorage per browser.

## 2) Deploy Firestore security rules
- File: `firestore.rules`
- Deploy (Firebase CLI): `firebase deploy --only firestore:rules`
- Behavior:
  - Reads allowed only if `request.auth.uid` is a member of `/accounts/{accountId}/members/{uid}`.
  - Writes allowed only for roles `owner` or `admin`.
  - Members subcollection: users can read their account membership; owners/admins (or the user themselves) can create/update/delete membership docs.

## 3) Seed the account and membership
- In Firestore Console (or Admin SDK), create `/accounts/{accountId}` with fields like:
  - `name`: "Your Company"
  - `ownerUid`: `<your Firebase Auth uid>`
  - `createdAt`: server timestamp or ISO string
  - `plan`: optional (e.g., "free" | "pro")
- Add membership: `/accounts/{accountId}/members/{yourUid}` with:
  - `role`: "owner"
  - `joinedAt`: timestamp

## 4) Migrate existing root collections (one-time copy)
- Script: `scripts/migrate-to-accounts.js`
- Prereqs: Service account JSON; set `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json`.
- Dry run (no writes):  
  `node scripts/migrate-to-accounts.js --accountId=acc_prod`
- Copy data for real:  
  `node scripts/migrate-to-accounts.js --accountId=acc_prod --dryRun=false`
- What it does: copies docs from root `suppliers`, `itemFolders`, `items`, `transactions` into `/accounts/{accountId}/...` with the same IDs/fields. It does **not** delete old collections.

## 5) Run and smoke-test the app
- Start dev server: `npm run dev`.
- In the banner (top of pages), ensure the account id matches your target (or rely on `NEXT_PUBLIC_DEFAULT_ACCOUNT_ID`).
- Verify flows under that account:
  - Suppliers: list/add/edit.
  - Items & folders: list/create/rename/delete; item create/edit.
  - Transactions: add with supplier/item selections; update tracking; upload invoice; edit/delete.
  - Dashboard counts and recent orders reflect only that account.

## 6) Validate isolation
- Create a second account + member; switch the account id in the banner and confirm data is isolated (empty lists until you add data for that account).
- Optional: use the Firestore Rules simulator to test read/write for a member vs non-member.

## 7) Cleanup (after validation)
- Stop reading legacy root collections (code already points to account-scoped paths).
- After backups and confidence, delete old root collections if desired.
- Keep service account files secure; remove local copies once migration is done.

## Reference
- Account context: `lib/accountContext.js`
- Firestore path helpers: `lib/firestorePaths.js`
- Rules: `firestore.rules`
- Migration: `scripts/migrate-to-accounts.js`
