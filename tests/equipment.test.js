import test from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { createSampleData } from "./fixtures.js";
import { migrateTask } from "../src/assignment.js";
import { normalizeData, validData } from "../src/store.js";
import {
  equipmentIdFromHash,
  equipmentLink,
  equipmentQrText,
  isDeliveryLate,
  newEquipment,
  validEquipmentItem,
} from "../src/equipment.js";
import { equipmentQrSvg, qrGeometry } from "../src/equipment-qr.js";

const item = {
  ...newEquipment(),
  name: "Möbel & Mikrofon-Set",
  inventoryCode: "IL-TEST-001",
  category: "Technik",
  quantity: 2,
  unit: "Sets",
  storageLocation: "Lager A · Regal B",
  deliveryAt: "2026-11-20T14:30",
  owner: "Lea Schneider",
  status: "Unterwegs",
  notes: "Inklusive Stativ und Zubehör.",
};

test("Equipment validation rejects bad quantities, dates and category values", () => {
  assert.equal(validEquipmentItem(item), true);
  assert.equal(validEquipmentItem({ ...item, quantity: 0 }), true);
  for (const invalid of [
    { quantity: -1 },
    { quantity: 1.5 },
    { quantity: "2" },
    { deliveryAt: "2026-02-31T12:00" },
    { inventoryCode: "../../bad" },
    { name: " " },
    { category: "Other" },
  ])
    assert.equal(validEquipmentItem({ ...item, ...invalid }), false);
});

test("Older backups receive an empty inventory and preserve all existing data", () => {
  const { equipment, ...legacy } = createSampleData();
  assert.equal(validData(legacy), true);
  const normalized = normalizeData(legacy);
  assert.deepEqual(normalized.equipment, []);
  assert.deepEqual(normalized.tasks, legacy.tasks.map(migrateTask));
  assert.deepEqual(normalized.expenses, legacy.expenses);
  const current = { ...normalized, equipment: [item] };
  assert.equal(validData(current), true);
  assert.deepEqual(
    normalizeData(JSON.parse(JSON.stringify(current))).equipment,
    [item],
  );
  assert.equal(
    validData({ ...current, equipment: [item, { ...item, id: "different" }] }),
    false,
  );
  assert.equal(validData({ ...current, equipment: null }), false);
});

test("Delivery warnings stop after arrival or return", () => {
  const now = new Date("2026-11-21T12:00");
  assert.equal(isDeliveryLate(item, now), true);
  assert.equal(isDeliveryLate({ ...item, status: "Vor Ort" }, now), false);
  assert.equal(
    isDeliveryLate({ ...item, status: "Zurückgegeben" }, now),
    false,
  );
  assert.equal(isDeliveryLate({ ...item, deliveryAt: "" }, now), false);
});

test("Direct links preserve the app path and support safe ID decoding", () => {
  const link = equipmentLink(
    "item / ü",
    "http://127.0.0.1:5173/app/?view=all#main",
  );
  const url = new URL(link);
  assert.equal(url.pathname, "/app/");
  assert.equal(url.search, "?view=all");
  assert.equal(equipmentIdFromHash(url.hash), "item / ü");
  assert.equal(equipmentIdFromHash("#equipment/%zz"), "");
  assert.equal(equipmentIdFromHash("#main"), "");
});

test("Exported SVG codes are independently decodable as offline info and direct links", () => {
  for (const payload of [
    equipmentQrText(item),
    equipmentLink(item.id, "http://127.0.0.1:5173/"),
    equipmentQrText({
      ...item,
      name: "Äußere Beschilderung für Bühne und Möbel",
      storageLocation: "Lager Süd / Regal 3 · Rückwand",
    }),
  ]) {
    const svg = equipmentQrSvg(payload),
      { size } = qrGeometry(payload);
    const scale = 7,
      width = size * scale;
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    const path = /<path d="([^"]+)"/.exec(svg)[1];
    for (const cell of path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
      const x = Number(cell[1]),
        y = Number(cell[2]);
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const offset = ((y * scale + dy) * width + x * scale + dx) * 4;
          pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 30;
        }
    }
    assert.equal(jsQR(pixels, width, width)?.data, payload);
    assert.ok(!svg.includes(item.name)); // User text is encoded, never inserted as markup.
  }
});
