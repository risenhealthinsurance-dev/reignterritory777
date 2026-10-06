import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AuthSession {
  access_token: string;
  user: { id: string; email?: string };
}

interface AuthError {
  message: string;
}

export interface AuthClient {
  auth: {
    getSession(): Promise<{
      data: { session: AuthSession | null };
      error: AuthError | null;
    }>;
    onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): {
      data: { subscription: { unsubscribe(): void } };
    };
    signInWithOtp(input: {
      email: string;
      options: { emailRedirectTo: string };
    }): Promise<{ data: unknown; error: AuthError | null }>;
    signOut(): Promise<{ error: AuthError | null }>;
  };
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable" | "error";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;
  signInWithMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  client,
  children,
}: {
  client: AuthClient | null;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<AuthStatus>(client ? "loading" : "unavailable");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setStatus("error");
        return;
      }
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setError(null);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      error,
      async signInWithMagicLink(email) {
        if (!client) throw new Error("Authentication is not configured.");
        const { error: signInError } = await client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signInError) throw new Error(signInError.message);
      },
      async signOut() {
        if (!client) return;
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) throw new Error(signOutError.message);
      },
    }),
    [client, error, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function RequireAuth({
  children,
  fallback,
  loading,
}: {
  children: ReactNode;
  fallback: ReactNode;
  loading: ReactNode;
}) {
  const { status } = useAuth();
  if (status === "loading") return loading;
  if (status !== "authenticated") return fallback;
  return children;
}
