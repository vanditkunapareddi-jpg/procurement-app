import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../lib/firebase";
import { useAccount } from "../lib/accountContext";

export default function InvitePage() {
  const router = useRouter();
  const { setAccountId } = useAccount();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const accountId =
    typeof router.query.accountId === "string"
      ? router.query.accountId.trim()
      : "";

  useEffect(() => {
    if (!accountId) return undefined;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("needs-auth");
        return;
      }
      setStatus("accepting");
      setMessage("");
      try {
        const acceptInvite = httpsCallable(functions, "acceptInvite");
        await acceptInvite({ accountId });
        setAccountId(accountId);
        router.replace("/");
      } catch (err) {
        setStatus("error");
        setMessage(err?.message || "Invite could not be accepted.");
      }
    });

    return () => unsub();
  }, [accountId, router, setAccountId]);

  const handleSignIn = () => {
    const redirect = encodeURIComponent(router.asPath || "/invite");
    router.push(`/login?redirect=${redirect}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Join workspace</h1>
        {!accountId && (
          <p className="text-sm text-slate-600">
            This invite link is missing an account id.
          </p>
        )}
        {accountId && status === "needs-auth" && (
          <>
            <p className="text-sm text-slate-600">
              Sign in to accept your invite.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2 hover:bg-slate-800"
            >
              Sign in with Google
            </button>
          </>
        )}
        {accountId && status === "accepting" && (
          <p className="text-sm text-slate-600">Accepting invite...</p>
        )}
        {accountId && status === "error" && (
          <p className="text-sm text-rose-600">{message}</p>
        )}
      </div>
    </div>
  );
}
