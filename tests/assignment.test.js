import test from "node:test";
import assert from "node:assert/strict";
import { createInitialData } from "../src/data.js";
import { normalizeData, validData } from "../src/store.js";
import { migrateTask, normalizeAssignment } from "../src/assignment.js";

test("New installations contain no demo records or budget", () => {
  const data = createInitialData();
  assert.equal(validData(data), true);
  assert.equal(data.event.budget, 0);
  assert.equal(data.event.start, "");
  for (const key of [
    "tasks",
    "contacts",
    "expenses",
    "equipment",
    "people",
    "shifts",
    "checklist",
  ])
    assert.deepEqual(data[key], []);
  data.tasks.push({});
  assert.deepEqual(createInitialData().tasks, []);
});

test("Legacy task ownership migrates without dropping the former name or other fields", () => {
  const original = {
    id: "a",
    title: "Eigene Aufgabe",
    owner: "Freier Name",
    status: "Offen",
  };
  const migrated = migrateTask(original);
  assert.equal(migrated.owner, "");
  assert.equal(migrated.legacyOwner, "Freier Name");
  assert.equal(migrated.title, original.title);
  assert.equal(original.owner, "Freier Name");
  assert.deepEqual(migrateTask(migrated), migrated);
  assert.equal(normalizeAssignment("Otto"), "Orga – Otto");
  assert.equal(normalizeAssignment("Anton"), "Orga – Anton");
  assert.equal(normalizeAssignment("Tech"), "Tech");
  assert.equal(normalizeAssignment("Orga"), "");
});

test("Migration preserves user contacts, budget and inventory", () => {
  const data = createInitialData();
  data.event.budget = 123;
  data.contacts = [
    { id: "c", name: "Eigener Kontakt", internalOwner: "Eigene Person" },
  ];
  const migrated = normalizeData(data);
  assert.equal(migrated.contacts[0].internalOwner, "Eigene Person");
  assert.equal(migrated.event.budget, 123);
  assert.deepEqual(normalizeData(migrated), migrated);
});
