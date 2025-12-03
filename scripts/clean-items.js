#!/usr/bin/env node
const admin = require('firebase-admin');

// Simple arg parsing: --key=value or --flag
const argv = process.argv.slice(2);
const opts = argv.reduce((acc, cur) => {
  if (!cur.startsWith('--')) return acc;
  const parts = cur.slice(2).split('=');
  acc[parts[0]] = parts.length > 1 ? parts[1] : true;
  return acc;
}, {});

const dryRun = opts['dry-run'] === undefined ? true : opts['dry-run'] !== 'false';
const action = opts['action'] || 'report'; // report | delete | rename
const newName = opts['new-name'] || 'Untitled item';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('\nERROR: set the environment variable GOOGLE_APPLICATION_CREDENTIALS to the path of a service account JSON file.');
  console.error('See https://firebase.google.com/docs/admin/setup for details.\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

(async () => {
  console.log(`Running clean-items.js --action=${action} --dry-run=${dryRun} --new-name="${newName}"`);

  const snap = await db.collection('items').get();
  const candidates = snap.docs.filter((d) => {
    const data = d.data() || {};
    const name = (data.name || '').toString().trim();
    return name === '';
  });

  console.log(`Found ${candidates.length} item(s) with empty or missing name.`);
  if (candidates.length === 0) return;

  for (const d of candidates) {
    const data = d.data() || {};
    console.log('\n---');
    console.log('id:', d.id);
    console.log('data:', JSON.stringify(data));

    if (dryRun) {
      if (action === 'delete') {
        console.log('(dry-run) would delete this document');
      } else if (action === 'rename') {
        console.log(`(dry-run) would set name = "${newName}"`);
      } else {
        console.log('(dry-run) report only');
      }
    } else {
      if (action === 'delete') {
        await d.ref.delete();
        console.log('Deleted.');
      } else if (action === 'rename') {
        await d.ref.update({ name: newName });
        console.log(`Updated name -> "${newName}"`);
      } else {
        console.log('Report-only run (no changes applied).');
      }
    }
  }

  if (dryRun) {
    console.log('\nDry run complete. Re-run with --dry-run=false to apply changes.');
  } else {
    console.log('\nOperation complete.');
  }
})().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
