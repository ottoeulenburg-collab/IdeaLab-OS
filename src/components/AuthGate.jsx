import React, { useEffect, useState } from "react";
import { supabase, loginOptions } from "../supabase.js";
import { Button, Field } from "./UI.jsx";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [email, setEmail] = useState("");
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
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: loginOptions(),
      });
      setMessage(
        error
          ? "Link konnte nicht gesendet werden. Prüfe deine Einladung oder versuche es später erneut."
          : "Wenn deine E-Mail freigeschaltet ist, erhältst du einen Anmeldelink. Öffne ihn zum Anmelden.",
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
              Melde dich mit deiner eingeladenen Team-E-Mail an. Du erhältst
              einen Link und brauchst kein Passwort.
            </p>
            <form onSubmit={submit}>
              <Field label="E-Mail">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? "Wird gesendet …" : "Anmeldelink senden"}
              </Button>
            </form>
            {message && <p role="status">{message}</p>}
          </>
        )}
      </section>
    </main>
  );
}
