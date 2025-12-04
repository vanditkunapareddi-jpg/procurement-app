#!/usr/bin/env node
/**
 * One-time migration: copy root-level collections into /accounts/{accountId}/...
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/migrate-to-accounts.js --accountId=acc_yourid [--dryRun=false]
 *
 * Notes:
 * - Uses Firestore Admin; requires service account creds.
 * - Copies documents as-is (preserves IDs and fields).
 * - Does NOT delete the old root collections.
 */
const admin = require("firebase-admin");

// Parse argv --key=value
const argv = process.argv.slice(2).reduce((acc, cur) => {
  if (!cur.startsWith("--")) return acc;
  const [k, v] = cur.slice(2).split("=");
  acc[k] = v === undefined ? true : v;
  return acc;
}, {});

const accountId = argv.accountId;
const dryRun = argv.dryRun === "false" ? false : true;

if (!accountId) {
  console.error("Missing required --accountId.");
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON (Admin SDK)."
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

const collections = ["suppliers", "itemFolders", "items", "transactions"];

async function copyCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`- ${name}: no docs, skipping`);
    return;
  }
  console.log(`- ${name}: copying ${snap.size} doc(s)`);
  for (const doc of snap.docs) {
    const data = doc.data();
    const targetRef = db
      .collection("accounts")
      .doc(accountId)
      .collection(name)
      .doc(doc.id);
    if (dryRun) {
      console.log(`  (dry-run) would copy ${name}/${doc.id}`);
    } else {
      await targetRef.set(data, { merge: false });
    }
  }
}

(async () => {
  console.log(
    `Starting migration to account '${accountId}' (dryRun=${dryRun})...`
  );
  for (const name of collections) {
    await copyCollection(name);
  }
  console.log("Done. Legacy root collections were left untouched.");
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
