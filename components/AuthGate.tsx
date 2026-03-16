"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function AuthGate({ children }: any) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleAuth() {
    setMessage("");

    if (!email || !password) {
      setMessage("Enter email and password.");
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Account created. Check your email if confirmation is enabled.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
            Math Sprint Login
          </h1>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setMode("signin")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: mode === "signin" ? "#0f172a" : "white",
                color: mode === "signin" ? "white" : "#0f172a",
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: mode === "signup" ? "#0f172a" : "white",
                color: mode === "signup" ? "white" : "#0f172a",
                cursor: "pointer",
              }}
            >
              Sign up
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
              }}
            />

            <button
              onClick={handleAuth}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>

            {message ? (
              <div style={{ fontSize: 14, color: "#475569" }}>{message}</div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          padding: 16,
          display: "flex",
          justifyContent: "flex-end",
          background: "#f8fafc",
        }}
      >
        <button
          onClick={signOut}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>

      {children(session)}
    </div>
  );
}