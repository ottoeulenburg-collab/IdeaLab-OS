export const AREAS = [
  "Location",
  "Technik",
  "Programm",
  "Sponsoring",
  "Marketing",
  "Helfer:innen",
  "Finanzen",
  "Sonstiges",
];
export const STATUSES = ["Offen", "In Arbeit", "Erledigt"];
export const PRIORITIES = ["Hoch", "Mittel", "Niedrig"];
export const SHIFT_ROLES = [
  "Aufbau",
  "Einlass",
  "Garderobe",
  "Technik",
  "Foto/Video",
  "Abbau",
];
export const uid = () => crypto.randomUUID();
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function dateAfter(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export const formatDate = (date, long = false) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00`));
export const time = (date) => date.slice(11, 16);
export const money = (value) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
export const sumMoney = (items, field) =>
  items.reduce((sum, item) => sum + Math.round(item[field] * 100), 0) / 100;
export const isOverdue = (task, today = localDate()) =>
  task.status !== "Erledigt" && task.due < today;

export function isDueSoon(task, today = localDate(), days = 7) {
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + days);
  return (
    task.status !== "Erledigt" &&
    task.due >= today &&
    task.due <= localDate(end)
  );
}

export function sortTasks(tasks) {
  return [...tasks].sort(
    (a, b) =>
      PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
      Number(a.status === "Erledigt") - Number(b.status === "Erledigt") ||
      a.due.localeCompare(b.due) ||
      a.title.localeCompare(b.title, "de"),
  );
}

export function monthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}
export function urgentTasks(tasks, today = localDate()) {
  return tasks
    .filter((t) => t.status !== "Erledigt")
    .sort(
      (a, b) =>
        Number(isOverdue(b, today)) - Number(isOverdue(a, today)) ||
        PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
        a.due.localeCompare(b.due),
    )
    .slice(0, 3);
}
export function daysUntil(date, now = new Date()) {
  const target = new Date(date);
  return Math.round(
    (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000,
  );
}
export function shiftError(candidate, shifts) {
  if (!candidate.start || !candidate.end || candidate.end <= candidate.start)
    return "Das Ende muss nach dem Beginn liegen.";
  if (candidate.personIds.length > candidate.capacity)
    return "Es sind mehr Personen ausgewählt als Plätze vorgesehen.";
  const collision = shifts.find(
    (s) =>
      s.id !== candidate.id &&
      s.start < candidate.end &&
      candidate.start < s.end &&
      s.personIds.some((id) => candidate.personIds.includes(id)),
  );
  return collision
    ? `Doppelte Einteilung: Eine ausgewählte Person ist bereits für „${collision.role}“ (${formatDate(collision.start)}, ${time(collision.start)}–${time(collision.end)}) eingeteilt.`
    : "";
}
export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export function downloadData(data) {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), data },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `idealab-backup-${localDate()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
