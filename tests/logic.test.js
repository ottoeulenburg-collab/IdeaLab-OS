import test from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  isOverdue,
  shiftError,
  sumMoney,
  urgentTasks,
  isDueSoon,
  localDate,
  monthDays,
  sortTasks,
} from "../src/utils.js";
import { normalizeData, validData } from "../src/store.js";
import { createSampleData } from "./fixtures.js";

test("Countdown counts calendar days across a daylight-saving transition", () => {
  assert.equal(
    daysUntil("2026-10-26T18:00", new Date("2026-10-24T23:00:00+02:00")),
    2,
  );
  assert.equal(
    daysUntil("2026-10-24T18:00", new Date("2026-10-26T09:00:00+01:00")),
    -2,
  );
});
test("Overdue excludes completed tasks and tasks due today", () => {
  assert.equal(
    isOverdue({ status: "Offen", due: "2026-10-28" }, "2026-10-29"),
    true,
  );
  assert.equal(
    isOverdue({ status: "Erledigt", due: "2026-10-28" }, "2026-10-29"),
    false,
  );
  assert.equal(
    isOverdue({ status: "Offen", due: "2026-10-29" }, "2026-10-29"),
    false,
  );
});
test("Urgent tasks prioritize overdue work before future high priority tasks", () => {
  const tasks = [
    { id: "future", status: "Offen", due: "2026-11-01", priority: "Hoch" },
    { id: "late", status: "In Arbeit", due: "2026-10-27", priority: "Mittel" },
    { id: "done", status: "Erledigt", due: "2026-10-20", priority: "Hoch" },
  ];
  assert.deepEqual(
    urgentTasks(tasks, "2026-10-29").map((t) => t.id),
    ["late", "future"],
  );
  assert.equal(tasks[0].id, "future");
});
test("Money totals use cents rather than accumulating floating-point drift", () => {
  assert.equal(sumMoney([{ actual: 0.1 }, { actual: 0.2 }], "actual"), 0.3);
});
test("Shifts reject double bookings, invalid ranges and excess assignments", () => {
  const existing = {
    id: "one",
    role: "Technik",
    start: "2026-11-20T16:00",
    end: "2026-11-20T22:00",
    personIds: ["max"],
    capacity: 1,
  };
  const candidate = {
    ...existing,
    id: "two",
    start: "2026-11-20T20:00",
    end: "2026-11-20T23:00",
  };
  assert.match(shiftError(candidate, [existing]), /Doppelte Einteilung/);
  assert.equal(
    shiftError({ ...candidate, start: existing.end }, [existing]),
    "",
  );
  assert.equal(shiftError(existing, [existing]), "");
  assert.match(shiftError({ ...candidate, end: candidate.start }, []), /Ende/);
  assert.match(
    shiftError({ ...candidate, personIds: ["max", "lea"] }, []),
    /mehr Personen/,
  );
});
test("Backup validation accepts sample data and rejects broken values and references", () => {
  const data = createSampleData();
  assert.equal(validData(data), true);
  assert.equal(
    validData({ ...data, event: { ...data.event, budget: -1 } }),
    false,
  );
  assert.equal(
    validData({
      ...data,
      shifts: [{ ...data.shifts[0], personIds: ["unknown"] }],
    }),
    false,
  );
  assert.equal(
    validData({ ...data, expenses: [{ ...data.expenses[0], actual: "200" }] }),
    false,
  );
  assert.equal(
    validData({ ...data, contacts: [data.contacts[0], data.contacts[0]] }),
    false,
  );
});

test("Upcoming deadlines include today and the seventh day but not overdue or completed tasks", () => {
  const task = { status: "Offen", due: "2026-10-29" };
  assert.equal(isDueSoon(task, "2026-10-29"), true);
  assert.equal(isDueSoon({ ...task, due: "2026-11-05" }, "2026-10-29"), true);
  assert.equal(isDueSoon({ ...task, due: "2026-11-06" }, "2026-10-29"), false);
  assert.equal(isDueSoon({ ...task, due: "2026-10-28" }, "2026-10-29"), false);
  assert.equal(isDueSoon({ ...task, status: "Erledigt" }, "2026-10-29"), false);
});

test("Checklist keeps every task, sorts priority first and never mutates source data", () => {
  const tasks = [
    {
      id: "low",
      title: "A",
      priority: "Niedrig",
      status: "Offen",
      due: "2026-10-20",
    },
    {
      id: "done",
      title: "B",
      priority: "Hoch",
      status: "Erledigt",
      due: "2026-10-21",
    },
    {
      id: "high",
      title: "C",
      priority: "Hoch",
      status: "Offen",
      due: "2026-11-05",
    },
    {
      id: "medium",
      title: "D",
      priority: "Mittel",
      status: "In Arbeit",
      due: "2026-10-22",
    },
  ];
  assert.deepEqual(
    sortTasks(tasks).map((task) => task.id),
    ["high", "done", "medium", "low"],
  );
  assert.equal(tasks[0].id, "low");
});

test("Monthly calendar starts Monday and includes leap days and year boundaries without duplicates", () => {
  for (const month of [
    new Date(2026, 9, 1, 12),
    new Date(2027, 0, 1, 12),
    new Date(2028, 1, 1, 12),
  ]) {
    const days = monthDays(month),
      dates = days.map(localDate);
    assert.equal(days.length, 42);
    assert.equal(days[0].getDay(), 1);
    assert.equal(new Set(dates).size, 42);
    assert.ok(
      dates.includes(
        localDate(new Date(month.getFullYear(), month.getMonth(), 1, 12)),
      ),
    );
    assert.ok(
      dates.includes(
        localDate(new Date(month.getFullYear(), month.getMonth() + 1, 0, 12)),
      ),
    );
  }
  assert.ok(
    monthDays(new Date(2028, 1, 1, 12))
      .map(localDate)
      .includes("2028-02-29"),
  );
});

test("Old contact backups receive empty relationship fields while preserving existing content", () => {
  const original = createSampleData();
  const legacy = {
    ...original,
    contacts: original.contacts.map(
      ({ responsibility, internalOwner, ...contact }) => contact,
    ),
  };
  assert.equal(validData(legacy), true);
  const normalized = normalizeData(legacy);
  assert.equal(normalized.contacts[0].responsibility, "");
  assert.equal(normalized.contacts[0].internalOwner, "");
  assert.equal(normalized.contacts[0].notes, original.contacts[0].notes);
  assert.equal(
    validData({
      ...original,
      contacts: [{ ...original.contacts[0], internalOwner: 123 }],
    }),
    false,
  );
});
