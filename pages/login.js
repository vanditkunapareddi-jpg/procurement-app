import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAccount } from "../lib/accountContext";
const konnukoLogo = "/konnuko-logo-dark.svg";

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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
      setMessage(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-20 flex items-center px-6">
        <Image
          src={konnukoLogo}
          alt="Konnuko"
          priority
          width={220}
          height={70}
          className="h-auto w-auto"
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-[32px] font-semibold text-slate-900">
              Welcome to Konnuko
            </h1>
            <p className="text-sm font-medium text-slate-500">
              To get started, please sign in
            </p>
          </div>

          {message && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-left">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 text-[17px] font-medium text-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:border-slate-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <span className="inline-flex" aria-hidden="true">
              <svg
                className="w-6 h-6"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.15 0 5.3 1.37 6.52 2.52l4.76-4.65C31.68 4.34 28.14 3 24 3 14.98 3 7.21 8.91 4.42 17.11l5.93 4.61C11.83 14.9 17.39 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.14 24.5c0-1.56-.14-2.7-.44-3.88H24v7.05h12.45c-.25 1.74-1.57 4.35-4.52 6.1l6.96 5.4c4.16-3.85 6.25-9.51 6.25-14.67Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.35 26.69C9.95 25.5 9.72 24.25 9.72 23c0-1.25.22-2.5.61-3.69l-5.93-4.6C2.71 16.73 2 19.8 2 23s.71 6.27 2.4 8.29l5.95-4.6Z"
                />
                <path
                  fill="#34A853"
                  d="M24 43c5.7 0 10.49-1.86 13.99-5.08l-6.96-5.4C29.26 33.43 26.94 34.5 24 34.5c-6.6 0-12.17-5.38-13.24-12.44l-5.95 4.6C7.61 39.1 15.39 43 24 43Z"
                />
                <path fill="none" d="M2 2h44v44H2z" />
              </svg>
            </span>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </main>

      <footer className="pb-10 text-center text-sm text-slate-500 space-x-3">
        <span>Konnuko.com</span>
        <span>|</span>
        <span>Support</span>
        <span>|</span>
        <span>Privacy</span>
        <span>|</span>
        <span>Terms</span>
      </footer>
    </div>
  );
}
