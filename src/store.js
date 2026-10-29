import { migrateTask } from "./assignment.js";
import { validEquipmentItem } from "./equipment.js";

export const STORAGE_KEY = "idealab-command-center:v1";
const string = (v) => typeof v === "string";
const nonnegative = (v) => Number.isFinite(v) && v >= 0;
const date = (v) =>
  string(v) &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(new Date(`${v}T12:00`).getTime());
const datetime = (v) =>
  string(v) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) &&
  !Number.isNaN(new Date(v).getTime());
const collection = (v, check) =>
  Array.isArray(v) &&
  v.every((x) => x && string(x.id) && check(x)) &&
  new Set(v.map((x) => x.id)).size === v.length;
export function validData(d) {
  if (
    d?.equipment !== undefined &&
    (!collection(d.equipment, validEquipmentItem) ||
      new Set(d.equipment.map((item) => item.inventoryCode)).size !==
        d.equipment.length)
  )
    return false;
  if (
    !d?.event ||
    !string(d.event.name) ||
    !(d.event.start === "" || datetime(d.event.start)) ||
    !string(d.event.location) ||
    !nonnegative(d.event.budget)
  )
    return false;
  if (
    !collection(
      d.tasks,
      (x) =>
        string(x.title) &&
        string(x.area) &&
        string(x.owner) &&
        (x.legacyOwner === undefined || string(x.legacyOwner)) &&
        date(x.due) &&
        ["Hoch", "Mittel", "Niedrig"].includes(x.priority) &&
        ["Offen", "In Arbeit", "Erledigt"].includes(x.status),
    )
  )
    return false;
  if (
    !collection(
      d.checklist,
      (x) => string(x.title) && typeof x.done === "boolean",
    ) ||
    !collection(d.people, (x) => string(x.name))
  )
    return false;
  if (
    !collection(
      d.contacts,
      (x) =>
        ["name", "role", "organization", "phone", "email", "notes"].every((k) =>
          string(x[k]),
        ) &&
        ["responsibility", "internalOwner"].every(
          (k) => x[k] === undefined || string(x[k]),
        ),
    )
  )
    return false;
  if (
    !collection(
      d.expenses,
      (x) =>
        string(x.category) &&
        string(x.note) &&
        nonnegative(x.planned) &&
        nonnegative(x.actual),
    )
  )
    return false;
  return collection(
    d.shifts,
    (x) =>
      datetime(x.start) &&
      datetime(x.end) &&
      x.end > x.start &&
      string(x.role) &&
      string(x.note) &&
      Number.isInteger(x.capacity) &&
      x.capacity > 0 &&
      Array.isArray(x.personIds) &&
      new Set(x.personIds).size === x.personIds.length &&
      x.personIds.length <= x.capacity &&
      x.personIds.every((id) => d.people.some((p) => p.id === id)),
  );
}
export function normalizeData(data) {
  return {
    ...data,
    equipment: data.equipment || [],
    tasks: data.tasks.map(migrateTask),
    contacts: data.contacts.map((contact) => ({
      responsibility: "",
      internalOwner: "",
      ...contact,
    })),
  };
}
