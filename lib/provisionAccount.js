import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { accountDoc } from "./firestorePaths";

/**
 * Ensures the user has an account and membership. If missing, creates them.
 * @param {string} uid - Firebase Auth user id
 * @param {object} opts - { accountId?: string, name?: string, plan?: string }
 * @returns {Promise<{ accountId: string }>}
 */
export async function ensureAccountForUser(uid, opts = {}) {
  if (!uid) throw new Error("uid is required to provision an account");

  const accountId = (opts.accountId || `acc_${uid}`).trim();
  const accountRef = doc(db, "accounts", accountId);
  const memberRef = accountDoc(db, accountId, "members", uid);

  const [acctSnap, memberSnap] = await Promise.all([
    getDoc(accountRef),
    getDoc(memberRef),
  ]);

  if (acctSnap.exists() && memberSnap.exists()) {
    return { accountId };
  }

  if (!acctSnap.exists()) {
    await setDoc(accountRef, {
      name: opts.name || "My Workspace",
      ownerUid: uid,
      createdAt: serverTimestamp(),
      plan: opts.plan || "free",
    });
  }

  if (!memberSnap.exists()) {
    await setDoc(memberRef, {
      role: "owner",
      joinedAt: serverTimestamp(),
    });
  }

  return { accountId };
}
