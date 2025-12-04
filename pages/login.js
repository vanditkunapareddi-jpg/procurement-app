import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAccount } from "../lib/accountContext";

export default function LoginPage() {
  const router = useRouter();
  const { provisionAndSetAccount } = useAccount();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/");
      }
    });
    return () => unsub();
  }, [router]);

  const handleLogin = async () => {
    setMessage("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await provisionAndSetAccount(user.uid, {
        name: user.displayName || "My Workspace",
      });
      router.replace("/");
    } catch (err) {
      console.error("Login error:", err);
      setMessage(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-600">
            Sign in to create your workspace and start tracking suppliers.
          </p>
        </div>

        {message && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-slate-800 disabled:opacity-60"
        >
          <span aria-hidden="true">G</span>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-[12px] text-slate-500">
          We create an account and membership for you automatically after sign-in.
        </p>
      </div>
    </div>
  );
}
