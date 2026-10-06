import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AuthProvider, RequireAuth, useAuth } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";

const signedInSession = {
  access_token: "signed-token",
  user: { id: "rep-1", email: "rep@example.com" },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createClient(session: typeof signedInSession | null = null) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

function SessionProbe() {
  const auth = useAuth();
  return <div>{auth.session?.user.email ?? auth.status}</div>;
}

describe("AuthProvider", () => {
  it("does not render protected content before session resolution", async () => {
    const pending = deferred<{ data: { session: typeof signedInSession }; error: null }>();
    const client = createClient();
    client.auth.getSession.mockReturnValueOnce(pending.promise);

    render(
      <AuthProvider client={client}>
        <RequireAuth fallback={<div>Sign in required</div>} loading={<div>Checking session</div>}>
          <div>Protected territory</div>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(screen.getByText("Checking session")).toBeInTheDocument();
    expect(screen.queryByText("Protected territory")).not.toBeInTheDocument();

    pending.resolve({ data: { session: signedInSession }, error: null });
    expect(await screen.findByText("Protected territory")).toBeInTheDocument();
  });

  it("exposes the signed-in representative session", async () => {
    render(
      <AuthProvider client={createClient(signedInSession)}>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("rep@example.com")).toBeInTheDocument();
  });
});

describe("AuthScreen", () => {
  function Wrapper({
    children,
    client,
  }: {
    children: ReactNode;
    client: ReturnType<typeof createClient>;
  }) {
    return <AuthProvider client={client}>{children}</AuthProvider>;
  }

  it("sends a magic link and confirms where it was sent", async () => {
    const client = createClient();
    render(
      <Wrapper client={client}>
        <AuthScreen />
      </Wrapper>,
    );

    await userEvent.type(screen.getByLabelText("Work email"), "rep@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));

    await waitFor(() =>
      expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "rep@example.com",
        options: { emailRedirectTo: window.location.origin },
      }),
    );
    expect(
      await screen.findByText("Check rep@example.com for your secure sign-in link."),
    ).toBeInTheDocument();
  });

  it("shows a provider error without claiming a link was sent", async () => {
    const client = createClient();
    client.auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: new Error("Email rate limit reached"),
    });
    render(
      <Wrapper client={client}>
        <AuthScreen />
      </Wrapper>,
    );

    await userEvent.type(screen.getByLabelText("Work email"), "rep@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email rate limit reached");
    expect(screen.queryByText(/Check rep@example.com/)).not.toBeInTheDocument();
  });
});
