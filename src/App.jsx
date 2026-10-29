import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useEventStore, validData } from "./store.js";
import { downloadData } from "./utils.js";
import { Button, Icon, useConfirm } from "./components/UI.jsx";
import TaskForm from "./components/TaskForm.jsx";
import Dashboard from "./features/Dashboard.jsx";
import Tasks from "./features/Tasks.jsx";
import Contacts from "./features/Contacts.jsx";
import Budget from "./features/Budget.jsx";
import { equipmentIdFromHash, equipmentLink } from "./equipment.js";

const Equipment = lazy(() => import("./features/Equipment.jsx"));

const NAV = [
  {
    id: "dashboard",
    label: "Übersicht",
    short: "Übersicht",
    icon: "home",
    title: "Dein Überblick.",
    subtitle: "Aufgaben, nächste Deadlines und Budget an einem Ort.",
    action: "Aufgabe erstellen",
  },
  {
    id: "tasks",
    label: "Aufgaben",
    short: "Aufgaben",
    icon: "board",
    title: "Deine Aufgaben.",
    subtitle: "Als Liste oder im Kalender. So, wie du gerade planst.",
    action: "Aufgabe erstellen",
  },
  {
    id: "contacts",
    label: "Kontakte",
    short: "Kontakte",
    icon: "users",
    title: "Ein kurzer Draht hilft.",
    subtitle: "Wer wofür zuständig ist – und wer mit wem im Austausch steht.",
    action: "Kontakt erstellen",
  },
  {
    id: "budget",
    label: "Budget",
    short: "Budget",
    icon: "budget",
    title: "Große Ideen. Klare Zahlen.",
    subtitle: "Behalte Planung, Ausgaben und Spielraum im Blick.",
    action: "Budgetposten erstellen",
  },
  {
    id: "equipment",
    label: "Equipment & Logistik",
    short: "Equipment",
    icon: "equipment",
    title: "Equipment & Logistics Tracker",
    subtitle:
      "Alles, was vor Ort sein muss – mit Lagerort, Liefertermin und Zuständigkeit.",
    action: "Equipment erstellen",
  },
];

export default function App() {
  const confirm = useConfirm();
  const store = useEventStore();
  const [page, setPage] = useState(() =>
      equipmentIdFromHash(window.location.hash) ? "equipment" : "dashboard",
    ),
    [equipmentId, setEquipmentId] = useState(() =>
      equipmentIdFromHash(window.location.hash),
    ),
    [taskEditor, setTaskEditor] = useState(null),
    [newTask, setNewTask] = useState(false),
    [taskDate, setTaskDate] = useState(undefined),
    [creating, setCreating] = useState(false),
    [taskFilter, setTaskFilter] = useState("all"),
    [notice, setNotice] = useState(""),
    [now, setNow] = useState(() => new Date());
  const importRef = useRef(null),
    headingRef = useRef(null);
  const current = NAV.find((n) => n.id === page);
  useEffect(() => {
    function readHash() {
      const id = equipmentIdFromHash(window.location.hash);
      setEquipmentId(id);
      if (id) {
        setPage("equipment");
        setCreating(false);
      }
    }
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, []);
  function closeEquipment() {
    setEquipmentId("");
    if (equipmentIdFromHash(window.location.hash)) {
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(null, "", url);
    }
  }
  function openEquipment(id) {
    setEquipmentId(id);
    window.history.replaceState(null, "", equipmentLink(id));
  }
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  function navigate(id, filter = "all") {
    closeEquipment();
    setPage(id);
    setTaskFilter(filter);
    setCreating(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function create() {
    if (page === "dashboard" || page === "tasks") createTask();
    else setCreating(true);
  }
  function createTask(date) {
    setTaskDate(date);
    setNewTask(true);
  }
  async function importData(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5000000) {
      setNotice(
        "Die Datei ist zu groß. Bitte wähle ein IdeaLab-Backup unter 5 MB.",
      );
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.version !== 1 || !validData(parsed.data))
        throw new Error("invalid");
      if (
        await confirm(
          "Dieses Backup ersetzt den aktuellen Stand. Möchtest du es wiederherstellen?",
        )
      ) {
        if (store.commit(parsed.data)) {
          setNotice("Backup wiederhergestellt.");
          navigate("dashboard");
        }
      }
    } catch {
      setNotice(
        "Das ist kein gültiges IdeaLab-Backup. Deine aktuellen Daten wurden nicht verändert.",
      );
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <aside className="sidebar">
        <div className="brand">
          <div>
            IdeaLab<span>!</span>
          </div>
          <p>Event Command Center</p>
        </div>
        <nav aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              aria-current={page === n.id ? "page" : undefined}
              onClick={() => navigate(n.id)}
              title={n.label}
            >
              <Icon name={n.icon} size={23} />
              <span className="nav-full">{n.label}</span>
              <span className="nav-short">{n.short}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>
            <span className="saved-dot" />
            Lokal gespeichert
          </p>
          <button
            onClick={() => {
              downloadData(store.data);
              setNotice("Backup heruntergeladen.");
            }}
          >
            <Icon name="download" size={16} />
            Daten exportieren
          </button>
          <button onClick={() => importRef.current?.click()}>
            <Icon name="upload" size={16} />
            Backup laden
          </button>
          <small>Alles an einem Ort.</small>
        </div>
      </aside>
      <main id="main" className="main">
        <p className="storage-notice">
          Nur in diesem Browser gespeichert · Keine Synchronisierung zwischen
          Geräten oder Teammitgliedern. Sichere deinen Stand über „Daten
          exportieren“.
        </p>
        <div className="mobile-brand">
          IdeaLab<span>!</span>
          <small>Event Command Center</small>
        </div>
        <header className="page-header">
          <div>
            <h1 ref={headingRef} tabIndex="-1">
              {current.title}
            </h1>
            <p>{current.subtitle}</p>
          </div>
          <Button icon="plus" onClick={create}>
            {current.action}
          </Button>
        </header>
        {store.error ? (
          <div role="alert" className="notice error">
            <Icon name="alert" />
            {store.error}
          </div>
        ) : null}
        {page === "dashboard" ? (
          <Dashboard
            createTask={create}
            store={store}
            navigate={navigate}
            editTask={setTaskEditor}
            now={now}
          />
        ) : null}
        {page === "tasks" ? (
          <Tasks
            key={taskFilter}
            store={store}
            editTask={setTaskEditor}
            createTask={createTask}
            initialFilter={taskFilter}
          />
        ) : null}
        {page === "contacts" ? (
          <Contacts
            store={store}
            creating={creating}
            onCreated={() => setCreating(false)}
          />
        ) : null}
        {page === "budget" ? (
          <Budget
            store={store}
            creating={creating}
            onCreated={() => setCreating(false)}
          />
        ) : null}
        {page === "equipment" ? (
          <Suspense
            fallback={
              <div className="panel" role="status">
                Inventarliste wird geladen …
              </div>
            }
          >
            <Equipment
              store={store}
              creating={creating}
              onCreated={() => setCreating(false)}
              selectedId={equipmentId}
              onOpenItem={openEquipment}
              onCloseItem={closeEquipment}
            />
          </Suspense>
        ) : null}
        <footer className="main-footer">
          <span>Mit einem guten Plan wird aus einer Idee ein Event.</span>
          <div>
            <button
              onClick={() => {
                downloadData(store.data);
                setNotice("Backup heruntergeladen.");
              }}
            >
              Daten exportieren
            </button>
            <span>·</span>
            <button onClick={() => importRef.current?.click()}>
              Backup laden
            </button>
          </div>
        </footer>
      </main>
      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        aria-label="IdeaLab-Backup auswählen"
        hidden
        onChange={importData}
      />
      {newTask || taskEditor ? (
        <TaskForm
          task={taskEditor}
          initialDue={taskDate}
          store={store}
          onClose={() => {
            setNewTask(false);
            setTaskEditor(null);
          }}
        />
      ) : null}
      {notice ? (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {notice}
          <button aria-label="Meldung schließen" onClick={() => setNotice("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : null}
      {store.error && (newTask || taskEditor || creating) ? (
        <div role="alert" className="toast toast-error">
          {store.error}
        </div>
      ) : null}
    </div>
  );
}
