import React from "react";
import { formatDate, isOverdue, STATUSES } from "../utils.js";
import { Badge, Empty, Icon, IconButton, useConfirm } from "./UI.jsx";

export default function TaskList({
  tasks,
  store,
  editTask,
  controls = false,
  createTask,
  emptyTitle = "Keine Aufgaben vorhanden",
}) {
  const confirm = useConfirm();
  if (!tasks.length)
    return (
      <Empty title={emptyTitle}>
        Erstelle eine Aufgabe oder passe deine Filter an.
        {createTask ? (
          <button className="button primary" onClick={() => createTask()}>
            Erste Aufgabe erstellen
          </button>
        ) : null}
      </Empty>
    );
  return (
    <div className={`task-checklist ${controls ? "with-controls" : ""}`}>
      {tasks.map((task) => (
        <article
          key={task.id}
          className={`task-list-row ${task.status === "Erledigt" ? "is-done" : ""}`}
        >
          <input
            type="checkbox"
            aria-label={`Erledigt: ${task.title}`}
            checked={task.status === "Erledigt"}
            onChange={(e) =>
              store.upsert("tasks", {
                ...task,
                status: e.target.checked ? "Erledigt" : "Offen",
              })
            }
          />
          <div className="task-list-copy">
            <button className="task-list-title" onClick={() => editTask(task)}>
              {task.title}
            </button>
            <div className="task-list-meta">
              <span>{task.area}</span>
              <span>{task.owner || "Noch nicht zugewiesen"}</span>
              <span className={isOverdue(task) ? "overdue-text" : ""}>
                <Icon name="calendar" size={13} />
                {formatDate(task.due)}
                {isOverdue(task) ? " · überfällig" : ""}
              </span>
            </div>
          </div>
          <Badge>{task.priority}</Badge>
          {controls ? (
            <div className="task-list-controls">
              <select
                aria-label={`Status: ${task.title}`}
                value={task.status}
                onChange={(e) =>
                  store.upsert("tasks", { ...task, status: e.target.value })
                }
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <IconButton
                icon="edit"
                label={`Aufgabe bearbeiten: ${task.title}`}
                onClick={() => editTask(task)}
              />
              <IconButton
                icon="trash"
                label={`Aufgabe löschen: ${task.title}`}
                onClick={async () => {
                  if (await confirm(`Aufgabe „${task.title}“ löschen?`))
                    store.remove("tasks", task.id);
                }}
              />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
