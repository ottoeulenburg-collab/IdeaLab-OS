import { formatDate, localDate, uid } from "./utils.js";

export const EQUIPMENT_CATEGORIES = [
  "Technik",
  "Möbel",
  "Schilder",
  "Merchandise",
  "Sonstiges",
];
export const EQUIPMENT_STATUSES = [
  "Geplant",
  "Im Lager",
  "Bestellt",
  "Unterwegs",
  "Vor Ort",
  "Zurückgegeben",
];
export const EQUIPMENT_UNITS = ["Stück", "Sets", "Kartons", "Pakete"];
export const INVENTORY_CODE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,31}$/;

export function newEquipment() {
  const id = uid();
  return {
    id,
    inventoryCode: `IL-${id.slice(0, 8).toUpperCase()}`,
    name: "",
    category: "Technik",
    quantity: 1,
    unit: "Stück",
    storageLocation: "",
    deliveryAt: "",
    owner: "",
    status: "Geplant",
    notes: "",
  };
}

export function validEquipmentItem(item) {
  const text = (value, max) => typeof value === "string" && value.length <= max;
  const deliveryValid =
    item.deliveryAt === "" ||
    (typeof item.deliveryAt === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.deliveryAt) &&
      Number.isFinite(new Date(item.deliveryAt).getTime()) &&
      localDate(new Date(item.deliveryAt)) === item.deliveryAt.slice(0, 10));
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    text(item.inventoryCode, 32) &&
    INVENTORY_CODE_PATTERN.test(item.inventoryCode) &&
    text(item.name, 100) &&
    item.name.trim().length > 0 &&
    EQUIPMENT_CATEGORIES.includes(item.category) &&
    EQUIPMENT_STATUSES.includes(item.status) &&
    EQUIPMENT_UNITS.includes(item.unit) &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 0 &&
    item.quantity <= 1000000 &&
    text(item.storageLocation, 120) &&
    text(item.owner, 100) &&
    text(item.notes, 2000) &&
    deliveryValid
  );
}

export function equipmentDelivery(item) {
  return item.deliveryAt
    ? `${formatDate(item.deliveryAt)} · ${item.deliveryAt.slice(11, 16)} Uhr`
    : "Noch nicht geplant";
}

export function isDeliveryLate(item, now = new Date()) {
  return (
    Boolean(item.deliveryAt) &&
    !["Vor Ort", "Zurückgegeben"].includes(item.status) &&
    new Date(item.deliveryAt) < now
  );
}

export function equipmentLink(id, base = window.location.href) {
  const url = new URL(base);
  url.hash = `equipment/${encodeURIComponent(id)}`;
  return url.href;
}

export function equipmentIdFromHash(hash) {
  const match = /^#equipment\/([^?#]+)$/.exec(hash);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

export function equipmentQrText(item) {
  return [
    "IdeaLab! Equipment",
    `Inventar: ${item.inventoryCode}`,
    `Bezeichnung: ${item.name}`,
    `Kategorie: ${item.category}`,
    `Menge: ${item.quantity} ${item.unit}`,
    `Lagerort: ${item.storageLocation || "Noch nicht hinterlegt"}`,
    `Liefertermin: ${equipmentDelivery(item)}`,
    `Zuständig: ${item.owner || "Noch nicht zugewiesen"}`,
    `Status: ${item.status}`,
    `ID: ${item.id}`,
  ].join("\n");
}
