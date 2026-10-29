import React, { useEffect, useState } from "react";
import { ADMIN_EMAIL, supabase } from "../supabase.js";
import { Button, Field } from "./UI.jsx";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (alive) {
          setSession(data.session);
          setLoading(false);
          if (error)
            setMessage(
              "Anmeldung konnte nicht geladen werden. Bitte erneut versuchen.",
            );
        }
      })
      .catch(() => {
        if (alive) {
          setLoading(false);
          setMessage(
            "Anmeldung konnte nicht geladen werden. Bitte erneut versuchen.",
          );
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) {
        setSession(next);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  if (session) return children(session);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (username.trim().toLowerCase() !== "admin") {
        setMessage("Der Benutzername oder das Passwort ist nicht korrekt.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });
      setMessage(
        error
          ? "Der Benutzername oder das Passwort ist nicht korrekt."
          : "Anmeldung erfolgreich.",
      );
    } catch {
      setMessage("Keine Verbindung. Bitte später erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand">
          <div>
            IdeaLab<span>!</span>
          </div>
          <p>Event Command Center</p>
        </div>
        <h1>Gemeinsam wird’s ein Event.</h1>
        {loading ? (
          <p role="status">Anmeldung wird geladen …</p>
        ) : !supabase ? (
          <p role="alert">
            Die Cloud-Verbindung ist noch nicht eingerichtet. Bitte hinterlege
            die Supabase-Umgebungsvariablen gemäß README und veröffentliche die
            App erneut. Deine bisherigen Browserdaten bleiben erhalten.
          </p>
        ) : (
          <>
            <p>
              Melde dich mit dem gemeinsamen Teamzugang an.
            </p>
            <form onSubmit={submit}>
              <Field label="Benutzername">
                <input
                  required
                  autoComplete="username"
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
              <Field label="Passwort">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? "Wird angemeldet …" : "Anmelden"}
              </Button>
            </form>
            {message && <p role="status">{message}</p>}
          </>
        )}
      </section>
    </main>
  );
}
