import React from "react";
import { Badge, Empty, Icon, Panel } from "../components/UI.jsx";
import TaskList from "../components/TaskList.jsx";
import {
  formatDate,
  isDueSoon,
  localDate,
  money,
  sortTasks,
  sumMoney,
} from "../utils.js";

export default function Dashboard({
  store,
  navigate,
  editTask,
  createTask,
  now,
}) {
  const { tasks, event, expenses } = store.data;
  const today = localDate(now);
  const open = tasks.filter((task) => task.status !== "Erledigt");
  const soon = open
    .filter((task) => isDueSoon(task, today))
    .sort((a, b) => a.due.localeCompare(b.due));
  const actual = sumMoney(expenses, "actual"),
    planned = sumMoney(expenses, "planned");
  const remaining = Math.round((event.budget - actual) * 100) / 100;
  const percent = event.budget
    ? Math.round((actual / event.budget) * 100)
    : actual
      ? 100
      : 0;
  return (
    <>
      <section className="overview-summary" aria-label="Aufgabenübersicht">
        <button onClick={() => navigate("tasks", "active")}>
          <div>
            <span>Offene Aufgaben</span>
            <strong>{open.length}</strong>
          </div>
          <Icon name="board" size={26} />
        </button>
        <button onClick={() => navigate("tasks", "soon")}>
          <div>
            <span>In den nächsten 7 Tagen fällig</span>
            <strong className="deadline-number">{soon.length}</strong>
          </div>
          <Icon name="calendar" size={26} />
        </button>
      </section>
      <div className="overview-layout">
        <Panel
          title="Alle Aufgaben"
          className="overview-tasks"
          action={<span className="muted small">Nach Priorität sortiert</span>}
        >
          <TaskList
            tasks={sortTasks(tasks)}
            store={store}
            editTask={editTask}
            createTask={createTask}
          />
          <button
            className="text-button task-list-footer"
            onClick={() => navigate("tasks")}
          >
            Aufgaben öffnen <Icon name="arrow" size={16} />
          </button>
        </Panel>
        <div className="overview-aside">
          <Panel
            title="Bald fällig"
            action={<span className="muted small">Nächste 7 Tage</span>}
          >
            {soon.length ? (
              <div className="deadline-list">
                {soon.map((task) => (
                  <button
                    className="deadline-item"
                    key={task.id}
                    onClick={() => editTask(task)}
                  >
                    <div>
                      <strong>{task.title}</strong>
                      <span>
                        <Icon name="calendar" size={13} />
                        {formatDate(task.due)} ·{" "}
                        {task.owner || "Noch nicht zugewiesen"}
                      </span>
                    </div>
                    <Badge>{task.priority}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <Empty title="Ein bisschen Luft im Plan">
                Keine offenen Aufgaben mit Deadline in den nächsten sieben
                Tagen.
              </Empty>
            )}
          </Panel>
          <Panel
            title="Dein Budget"
            action={
              <button
                className="text-button small"
                onClick={() => navigate("budget")}
              >
                Zum Budget <Icon name="arrow" size={15} />
              </button>
            }
          >
            <div className="budget-pair">
              <div>
                <span>Gesamtbudget</span>
                <strong>{money(event.budget)}</strong>
              </div>
              <div>
                <span>Bisherige Ausgaben</span>
                <strong>{money(actual)}</strong>
              </div>
            </div>
            <div className="progress-label">
              <progress
                className={`progress ${percent > 100 ? "over-budget" : ""}`}
                max="100"
                value={Math.min(100, percent)}
                aria-label="Budgetverbrauch"
              />
              <span>{percent} %</span>
            </div>
            <div className="budget-details">
              <div>
                <span>Verbleibend</span>
                <strong className={remaining < 0 ? "orange" : ""}>
                  {money(remaining)}
                </strong>
              </div>
              <div>
                <span>Noch eingeplant</span>
                <strong>
                  {money(
                    Math.max(0, Math.round((planned - actual) * 100) / 100),
                  )}
                </strong>
              </div>
              <div>
                <span>Planungspuffer</span>
                <strong>
                  {money(Math.round((event.budget - planned) * 100) / 100)}
                </strong>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
