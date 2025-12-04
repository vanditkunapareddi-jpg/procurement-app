// Account context to share the current accountId across the app.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ensureAccountForUser } from "./provisionAccount";

const AccountContext = createContext(null);

const storageKey = "supplier-tracker:accountId";
const defaultAccountId =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || null
    : null;

export function AccountProvider({ children }) {
  const [accountId, setAccountId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const fromStorage =
          typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey)
            : null;
        const initial = fromStorage || defaultAccountId || null;
        setAccountId(initial);
      } catch (err) {
        console.error("Error loading accountId from storage", err);
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  const updateAccount = (nextId) => {
    const value = (nextId || "").trim() || null;
    setAccountId(value);
    try {
      if (typeof window !== "undefined") {
        if (value) {
          window.localStorage.setItem(storageKey, value);
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      console.error("Error persisting accountId", err);
    }
  };

  const provisionAndSetAccount = async (uid, opts = {}) => {
    const { accountId: newId } = await ensureAccountForUser(uid, opts);
    updateAccount(newId);
    return newId;
  };

  const ctxValue = useMemo(
    () => ({
      accountId,
      setAccountId: updateAccount,
      provisionAndSetAccount,
      ready,
    }),
    [accountId, ready]
  );

  return (
    <AccountContext.Provider value={ctxValue}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return ctx;
}
