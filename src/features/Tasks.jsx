import React, { useState } from "react";
import {
  AREAS,
  PRIORITIES,
  STATUSES,
  isDueSoon,
  isOverdue,
  sortTasks,
} from "../utils.js";
import { Field, Icon } from "../components/UI.jsx";
import TaskList from "../components/TaskList.jsx";
import TaskCalendar from "../components/TaskCalendar.jsx";

import { ASSIGNMENTS } from "../assignment.js";
export default function Tasks({
  store,
  editTask,
  createTask,
  initialFilter = "all",
}) {
  const [status, setStatus] = useState(initialFilter),
    [area, setArea] = useState("all"),
    [priority, setPriority] = useState("all"),
    [query, setQuery] = useState(""),
    [view, setView] = useState("list"),
    [owner, setOwner] = useState("all");
  const filtered = sortTasks(
    store.data.tasks.filter(
      (task) =>
        (owner === "all" ||
          task.owner === owner ||
          (owner === "Orga" && task.owner.startsWith("Orga"))) &&
        (area === "all" || task.area === area) &&
        (priority === "all" || task.priority === priority) &&
        (status === "all" ||
          (status === "soon"
            ? isDueSoon(task)
            : status === "overdue"
              ? isOverdue(task)
              : status === "active"
                ? task.status !== "Erledigt"
                : task.status === status)) &&
        `${task.title} ${task.owner}`
          .toLocaleLowerCase("de")
          .includes(query.toLocaleLowerCase("de")),
    ),
  );
  return (
    <>
      <div className="toolbar task-filters">
        <label className="search-field">
          <Icon name="search" size={19} />
          <input
            aria-label="Aufgaben suchen"
            placeholder="Aufgabe oder Person suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Field label="Bereich">
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">Alle Bereiche</option>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Zuständigkeit">
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">Alle Zuständigkeiten</option>
            <option value="">Noch nicht zugewiesen</option>
            <option value="Orga">Orga · alle</option>
            {ASSIGNMENTS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Priorität">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">Alle Prioritäten</option>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Status / Fälligkeit">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Alle Aufgaben</option>
            <option value="active">Offene Aufgaben</option>
            <option value="soon">In 7 Tagen fällig</option>
            <option value="overdue">Überfällig</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="task-view-toolbar">
        <p className="result-count" aria-live="polite">
          {filtered.length} von {store.data.tasks.length} Aufgaben · nach
          Priorität sortiert
        </p>
        <div className="view-switch" role="group" aria-label="Aufgabenansicht">
          <button
            className={view === "list" ? "selected" : ""}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <Icon name="board" size={16} />
            Liste
          </button>
          <button
            className={view === "calendar" ? "selected" : ""}
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            <Icon name="calendar" size={16} />
            Kalender
          </button>
        </div>
      </div>
      {view === "list" ? (
        <section className="panel task-list-panel" aria-label="Aufgabenliste">
          <TaskList
            tasks={filtered}
            store={store}
            editTask={editTask}
            controls
            emptyTitle={
              store.data.tasks.length
                ? "Keine passenden Aufgaben"
                : "Deine Aufgaben beginnen hier"
            }
            createTask={!store.data.tasks.length ? createTask : undefined}
          />
        </section>
      ) : (
        <TaskCalendar
          tasks={filtered}
          store={store}
          editTask={editTask}
          createTask={createTask}
        />
      )}
    </>
  );
}
