import React, { useState } from "react";
import { formatDate, localDate, monthDays, sortTasks } from "../utils.js";
import { Button, IconButton, Panel } from "./UI.jsx";
import TaskList from "./TaskList.jsx";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export default function TaskCalendar({ tasks, store, editTask, createTask }) {
  const [month, setMonth] = useState(() => new Date()),
    [selected, setSelected] = useState(() => localDate());
  const today = localDate();
  const byDate = new Map();
  sortTasks(tasks).forEach((task) =>
    byDate.set(task.due, [...(byDate.get(task.due) || []), task]),
  );
  function changeMonth(offset) {
    const next = new Date(
      month.getFullYear(),
      month.getMonth() + offset,
      1,
      12,
    );
    setMonth(next);
    setSelected(localDate(next));
  }
  return (
    <>
      <section className="calendar-panel" aria-label="Aufgabenkalender">
        <header className="calendar-toolbar">
          <div className="month-controls">
            <span className="previous-month">
              <IconButton
                icon="arrow"
                label="Vorheriger Monat"
                onClick={() => changeMonth(-1)}
              />
            </span>
            <h2 aria-live="polite">
              {new Intl.DateTimeFormat("de-DE", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </h2>
            <IconButton
              icon="arrow"
              label="Nächster Monat"
              onClick={() => changeMonth(1)}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setMonth(new Date());
              setSelected(today);
            }}
          >
            Heute
          </Button>
        </header>
        <div className="calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {monthDays(month).map((day) => {
            const key = localDate(day),
              items = byDate.get(key) || [];
            return (
              <div
                key={key}
                className={`calendar-day ${day.getMonth() !== month.getMonth() ? "outside-month" : ""} ${selected === key ? "selected-day" : ""} ${key === today ? "today" : ""}`}
              >
                <div className="calendar-day-heading">
                  <button
                    aria-label={`Aufgaben am ${formatDate(key, true)} anzeigen`}
                    aria-pressed={selected === key}
                    onClick={() => setSelected(key)}
                  >
                    <span className="day-number">{day.getDate()}</span>
                    <span className="calendar-mobile-count">
                      {items.length
                        ? `${items.length} ${items.length === 1 ? "Aufgabe" : "Aufgaben"}`
                        : ""}
                    </span>
                  </button>
                  <IconButton
                    icon="plus"
                    label={`Aufgabe am ${formatDate(key, true)} erstellen`}
                    onClick={() => {
                      setSelected(key);
                      createTask(key);
                    }}
                  />
                </div>
                <div className="calendar-items">
                  {items.map((task) => (
                    <button
                      key={task.id}
                      title={`${task.title} · ${task.priority} · ${task.owner || "Nicht zugewiesen"}`}
                      className={`calendar-item priority-${task.priority.toLowerCase()} ${task.status === "Erledigt" ? "is-done" : ""}`}
                      onClick={() => editTask(task)}
                    >
                      <span>{task.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <Panel
        title={`Aufgaben am ${formatDate(selected, true)}`}
        className="day-agenda"
        action={
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => createTask(selected)}
          >
            Aufgabe erstellen
          </Button>
        }
      >
        <TaskList
          tasks={byDate.get(selected) || []}
          store={store}
          editTask={editTask}
          controls
          emptyTitle="Für diesen Tag ist nichts eingetragen"
        />
      </Panel>
    </>
  );
}
