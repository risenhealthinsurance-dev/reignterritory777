import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";

export function AuthScreen({ onSubmit }: { onSubmit?: (email: string) => void }) {
  const { signInWithMagicLink, status } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setSending(true);
    setError(null);
    setSentTo(null);
    onSubmit?.(normalizedEmail);
    try {
      await signInWithMagicLink(normalizedEmail);
      setSentTo(normalizedEmail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send a sign-in link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="eyebrow">SECURE FIELD ACCESS</div>
        <h1 id="auth-title">Sign in to Reign Territory</h1>
        <p>Use your work email. We’ll send a one-time secure sign-in link.</p>
        {status === "unavailable" ? (
          <div role="alert">Authentication is not configured for this environment.</div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="auth-email">Work email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" disabled={sending}>
              {sending ? "Sending secure link…" : "Email me a sign-in link"}
            </button>
          </form>
        )}
        {sentTo && <div role="status">Check {sentTo} for your secure sign-in link.</div>}
        {error && <div role="alert">{error}</div>}
      </section>
    </main>
  );
}
