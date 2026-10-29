import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";
import { createInitialData } from "./data.js";
import { normalizeData, validData, STORAGE_KEY } from "./store.js";
import { operationsBetween, hasLocalContent } from "./cloud-data.js";

export function readLocalBackup() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const backup = JSON.parse(raw);
    return backup.version === 1 && validData(backup.data)
      ? normalizeData(backup.data)
      : null;
  } catch {
    return null;
  }
}
export function useCloudStore(session) {
  const [state, setState] = useState({
    data: createInitialData(),
    loading: true,
    error: "",
    revision: 0,
  });
  const [sync, setSync] = useState("Verbindung wird hergestellt …");
  const [busy, setBusy] = useState(false);
  const current = useRef(state);
  const locked = useRef(false);
  const mounted = useRef(true);
  const request = useRef(0);
  const [localData, setLocalData] = useState(readLocalBackup);
  const receiptKey = `${STORAGE_KEY}:adopted:${session.user.id}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(receiptKey) === "1";
    } catch {
      return false;
    }
  });
  function accept(snapshot) {
    if (!mounted.current || !validData(snapshot?.data))
      throw new Error("Ungültige Cloud-Daten");
    if (snapshot.revision < current.current.revision) return;
    const next = {
      ...snapshot,
      data: normalizeData(snapshot.data),
      loading: false,
      error: "",
    };
    current.current = next;
    setState(next);
  }
  async function refresh() {
    const ticket = ++request.current;
    try {
      const { data, error } = await supabase.rpc("event_snapshot");
      if (!mounted.current || ticket !== request.current) return;
      if (error) throw error;
      accept(data);
    } catch {
      if (mounted.current && ticket === request.current) {
        // Never leave cached team data visible when membership/session cannot be verified.
        const next = {
          data: createInitialData(),
          loading: false,
          error:
            "Arbeitsbereich nicht erreichbar. Prüfe Verbindung und Teamfreigabe und lade erneut.",
          revision: -1,
        };
        current.current = next;
        setState(next);
      }
    }
  }
  useEffect(() => {
    mounted.current = true;
    refresh();
    const channel = supabase
      .channel(`workspace-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_workspaces" },
        () => refresh(),
      )
      .subscribe((status) => {
        if (!mounted.current) return;
        setSync(
          status === "SUBSCRIBED"
            ? "Live verbunden"
            : "Live-Verbindung unterbrochen · regelmäßiger Abgleich",
        );
        if (status === "SUBSCRIBED") refresh();
      });
    const online = () => {
      setSync(
        navigator.onLine
          ? "Online · regelmäßiger Abgleich"
          : "Offline · Änderungen nicht möglich",
      );
      refresh();
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    const timer = setInterval(() => {
      if (!locked.current) refresh();
    }, 15000);
    return () => {
      mounted.current = false;
      ++request.current;
      clearInterval(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      supabase.removeChannel(channel);
    };
  }, [session.user.id]);
  async function commit(
    next,
    onlyEmpty = false,
    expectedRevision = state.revision,
  ) {
    if (!navigator.onLine) {
      setState((s) => ({
        ...s,
        error:
          "Du bist offline. Deine Eingabe wurde nicht gespeichert. Bitte verbinde dich und versuche es erneut.",
      }));
      return false;
    }
    if (
      locked.current ||
      current.current.loading ||
      current.current.error ||
      !navigator.onLine ||
      !validData(next)
    )
      return false;
    locked.current = true;
    setBusy(true);
    const operations = operationsBetween(
      current.current.data,
      normalizeData(next),
    );
    try {
      const { data, error } = await supabase.rpc("event_apply", {
        expected_revision: expectedRevision,
        operations,
        only_empty: onlyEmpty,
      });
      if (error) throw error;
      accept(data);
      return true;
    } catch (error) {
      await refresh();
      if (mounted.current)
        setState((s) => ({
          ...s,
          error:
            s.error ||
            (error.message?.includes("conflict")
              ? "Der Teamstand wurde zwischenzeitlich geändert. Die aktuelle Version ist geladen. Bitte prüfe deine Eingabe und speichere erneut."
              : "Speichern fehlgeschlagen. Die Änderung wurde nicht übernommen. Prüfe Verbindung und Teamfreigabe."),
        }));
      return false;
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const upsert = (key, item, baseline) => {
    const data = current.current.data;
    if (
      baseline !== undefined &&
      JSON.stringify(data[key].find((x) => x.id === item.id) || null) !==
        JSON.stringify(baseline)
    ) {
      setState((s) => ({
        ...s,
        error:
          "Dieser Eintrag wurde inzwischen geändert oder gelöscht. Bitte schließe das Formular und öffne den aktuellen Eintrag erneut.",
      }));
      return Promise.resolve(false);
    }
    return commit({
      ...data,
      [key]: data[key].some((x) => x.id === item.id)
        ? data[key].map((x) => (x.id === item.id ? item : x))
        : [...data[key], item],
    });
  };
  const remove = (key, id) =>
    commit({
      ...current.current.data,
      [key]: current.current.data[key].filter((x) => x.id !== id),
    });
  async function migrateLocal() {
    if (localData && (await commit(localData, true))) {
      try {
        localStorage.setItem(receiptKey, "1");
      } catch {
        /* Cloud data is already safe. */
      }
      setDismissed(true);
      setLocalData(null);
    }
  }
  return {
    ...state,
    busy,
    sync,
    commit,
    upsert,
    remove,
    refresh,
    localData:
      !dismissed && localData && hasLocalContent(localData) ? localData : null,
    migrateLocal,
    dismissLocal: () => setDismissed(true),
  };
}
