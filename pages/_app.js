import "../styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { AccountProvider, useAccount } from "../lib/accountContext";
import { auth } from "../lib/firebase";

const authExcludedRoutes = ["/login"];

function AuthGate({ children }) {
  const router = useRouter();
  const { provisionAndSetAccount } = useAccount();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        if (!authExcludedRoutes.includes(router.pathname)) {
          router.replace("/login");
        }
        return;
      }
      try {
        await provisionAndSetAccount(user.uid, {
          name: user.displayName || "My Workspace",
        });
      } catch (err) {
        console.error("Provisioning error:", err);
      } finally {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [provisionAndSetAccount, router]);

  if (authExcludedRoutes.includes(router.pathname)) {
    return children;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  return children;
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AccountProvider>
      <AuthGate>
        <Component {...pageProps} />
      </AuthGate>
    </AccountProvider>
  );
}
