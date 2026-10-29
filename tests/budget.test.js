import test from "node:test";
import assert from "node:assert/strict";
import {
  amountRecorded,
  saveBudgetAmount,
  clearBudgetAmount,
} from "../src/budget.js";
import { validData } from "../src/store.js";
import { createInitialData } from "../src/data.js";

test("planning and actual expenses can be entered and cleared independently, including zero", () => {
  const empty = {
    id: "budget-1",
    category: "Technik",
    note: "",
    planned: 0,
    actual: 0,
    plannedRecorded: false,
    actualRecorded: false,
  };
  const plan = saveBudgetAmount(empty, "planned", 100);
  assert.equal(plan.actual, 0);
  assert.equal(amountRecorded(plan, "actual"), false);
  const actual = saveBudgetAmount(plan, "actual", 90);
  assert.equal(actual.planned, 100);
  assert.equal(clearBudgetAmount(actual, "actual").planned, 100);
  assert.equal(
    amountRecorded(clearBudgetAmount(actual, "actual"), "actual"),
    false,
  );
  const actualOnly = saveBudgetAmount(empty, "actual", 50);
  assert.equal(amountRecorded(actualOnly, "planned"), false);
  assert.equal(clearBudgetAmount(actualOnly, "actual"), null);
  assert.equal(
    amountRecorded(saveBudgetAmount(empty, "actual", 0), "actual"),
    true,
  );
  assert.equal(empty.planned, 0);
});

test("existing budgets and new recording flags survive backup validation", () => {
  const legacy = {
    id: "legacy",
    category: "Miete",
    note: "",
    planned: 200,
    actual: 0,
  };
  assert.equal(amountRecorded(legacy, "planned"), true);
  assert.equal(amountRecorded(legacy, "actual"), false);
  const data = {
    ...createInitialData(),
    expenses: [saveBudgetAmount(legacy, "actual", 0)],
  };
  assert.equal(validData(JSON.parse(JSON.stringify(data))), true);
  assert.equal(
    validData({
      ...data,
      expenses: [{ ...data.expenses[0], actualRecorded: "false" }],
    }),
    false,
  );
  assert.equal(
    validData({
      ...data,
      expenses: [{ ...data.expenses[0], actualRecorded: false, actual: 50 }],
    }),
    false,
  );
});
