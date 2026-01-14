import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * Ensures the user has an account and membership. If missing, creates them.
 * @param {string} uid - Firebase Auth user id
 * @param {object} opts - { accountId?: string, name?: string, plan?: string }
 * @returns {Promise<{ accountId: string }>}
 */
export async function ensureAccountForUser(uid, opts = {}) {
  if (!uid) throw new Error("uid is required to provision an account");
  const resolveAccount = httpsCallable(functions, "resolveAccountForUser");
  const payload = {
    accountId: opts.accountId || null,
    name: opts.name || "My Workspace",
    plan: opts.plan || "free",
  };
  const res = await resolveAccount(payload);
  const accountId = res?.data?.accountId;
  if (!accountId) {
    throw new Error("Account provisioning failed.");
  }
  return { accountId };
}
