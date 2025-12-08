import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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

  const tryProvision = async (id) => {
    const accountId = id.trim();
    const accountRef = doc(db, "accounts", accountId);
    const memberRef = accountDoc(db, accountId, "members", uid);

    const accountPayload = {
      name: opts.name || "My Workspace",
      ownerUid: uid,
      createdAt: serverTimestamp(),
      plan: opts.plan || "free",
    };

    const memberPayload = {
      role: "owner",
      joinedAt: serverTimestamp(),
    };

    await Promise.all([
      setDoc(accountRef, accountPayload, { merge: true }),
      setDoc(memberRef, memberPayload, { merge: true }),
    ]);
    return accountId;
  };

  const primaryId = (opts.accountId || `acc_${uid}`).trim();
  try {
    const id = await tryProvision(primaryId);
    return { accountId: id };
  } catch (err) {
    // Fallback: if the stored accountId is invalid or permissions blocked, reset to acc_<uid>.
    const fallbackId = `acc_${uid}`;
    if (fallbackId !== primaryId) {
      const id = await tryProvision(fallbackId);
      return { accountId: id };
    }
    throw err;
  }

}
