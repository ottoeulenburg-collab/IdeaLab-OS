import { test, expect } from "@playwright/test";
import { createInitialData } from "../../src/data.js";

const fakeClient = `
let authListener;
const session = { user: { id: 'test-user', email: 'otto@team.test' } };
export const ADMIN_EMAIL = 'admin@idealab.local';
window.__login = () => { localStorage.setItem('test-session','1'); authListener('SIGNED_IN',session); };
export const supabase = {
  auth: {
    getSession: async () => ({data:{session:localStorage.getItem('test-session') ? session : null}}),
    onAuthStateChange: fn => { authListener=fn; return {data:{subscription:{unsubscribe(){}}}}; },
    signInWithPassword: async args => { window.__loginArgs=args; return {error: args.email === ADMIN_EMAIL && args.password === 'orgatechfickt' ? null : {message:'invalid'}}; },
    signOut: async () => { localStorage.removeItem('test-session'); authListener('SIGNED_OUT',null); return {}; }
  },
  rpc: async (name,args) => {
    const res = await fetch('/__test/'+name, {method:'POST',body:JSON.stringify(args||{})});
    return res.json();
  },
  channel: () => { const c = { on(_e,_opts,fn){window.__cloudChange=fn;return c;},subscribe(fn){queueMicrotask(()=>fn('SUBSCRIBED'));return c;} }; return c; },
  removeChannel(){}
};`;

test("login, migration, shared updates, stale edit, reload and logout on desktop/mobile", async ({
  context,
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let snapshot = { revision: 0, data: createInitialData() };
  await context.route(/\/src\/supabase\.js(?:\?.*)?$/, (route) =>
    route.fulfill({ contentType: "application/javascript", body: fakeClient }),
  );
  await context.route("**/__test/*", async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().url().endsWith("event_apply")) {
      if (
        body.expected_revision !== snapshot.revision ||
        (body.only_empty && snapshot.revision !== 0)
      )
        return route.fulfill({
          json: { data: null, error: { message: "conflict" } },
        });
      for (const op of body.operations) {
        if (op.collection === "metadata") Object.assign(snapshot.data, op.item);
        else if (op.item)
          snapshot.data[op.collection] = [
            ...snapshot.data[op.collection].filter((x) => x.id !== op.item.id),
            op.item,
          ];
        else
          snapshot.data[op.collection] = snapshot.data[op.collection].filter(
            (x) => x.id !== op.id,
          );
      }
      snapshot.revision++;
    }
    await route.fulfill({ json: { data: snapshot, error: null } });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gemeinsam wird’s ein Event." }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/idealab-team-login.png" });
  await page.getByLabel("Passwort").fill("orgatechfickt");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("status")).toContainText("Anmeldung erfolgreich");
  expect(await page.evaluate(() => window.__loginArgs.email)).toBe(
    "admin@idealab.local",
  );
  const local = createInitialData();
  local.tasks.push({
    id: "old-id",
    title: "Lokaler Aufbau",
    area: "Technik",
    owner: "Tech",
    due: "2026-12-01",
    priority: "Hoch",
    status: "Offen",
  });
  await page.evaluate(
    (data) =>
      localStorage.setItem(
        "idealab-command-center:v1",
        JSON.stringify({ version: 1, data }),
      ),
    local,
  );
  await page.reload();
  await page.evaluate(() => window.__login());
  await expect(
    page.getByRole("button", { name: "Lokale Daten übernehmen" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Lokale Daten übernehmen" }).click();
  await page.getByRole("button", { name: "Bestätigen", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lokaler Aufbau", exact: true }),
  ).toBeVisible();
  expect(snapshot.data.tasks[0].id).toBe("old-id");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("idealab-command-center:v1")).data
          .tasks[0].id,
    ),
  ).toBe("old-id");
  const second = await context.newPage();
  await second.goto("/");
  await expect(
    second.getByRole("button", { name: "Lokaler Aufbau", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Erledigt: Lokaler Aufbau" })
    .click();
  await expect.poll(() => snapshot.data.tasks[0].status).toBe("Erledigt");
  await second.evaluate(() => window.__cloudChange());
  await expect(
    second.getByRole("checkbox", { name: "Erledigt: Lokaler Aufbau" }),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Erledigt: Lokaler Aufbau" }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Lokaler Aufbau", exact: true })
    .click();
  snapshot.data.tasks[0].title = "Teamänderung";
  snapshot.revision++;
  await page.evaluate(() => window.__cloudChange());
  await page.getByLabel("Titel", { exact: true }).fill("Veraltete Eingabe");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByText("Dieser Eintrag wurde inzwischen geändert", { exact: false })
      .first(),
  ).toBeVisible();
  expect(snapshot.data.tasks[0].title).toBe("Teamänderung");
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await page
    .getByRole("button", { name: "Aufgabe erstellen", exact: true })
    .click();
  await page.getByLabel("Titel", { exact: true }).fill("Teamaufgabe");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(snapshot.data.tasks.some((x) => x.title === "Teamaufgabe")).toBe(true);
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  await nav.getByRole("button").filter({ hasText: "Kontakte" }).click();
  await page
    .getByRole("button", { name: "Kontakt erstellen", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Teamkontakt");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(snapshot.data.contacts[0].name).toBe("Teamkontakt");
  await nav.getByRole("button").filter({ hasText: "Budget" }).click();
  await page
    .getByRole("button", { name: "Budgetposten erstellen", exact: true })
    .click();
  await page.getByLabel("Kategorie", { exact: true }).fill("Miete");
  await expect(page.getByLabel("Tatsächliche Ausgabe (€)")).toHaveCount(0);
  await page.getByLabel("Planbetrag (€)").fill("100");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(snapshot.data.expenses[0].planned).toBe(100);
  expect(snapshot.data.expenses[0].actualRecorded).toBe(false);
  await page
    .getByRole("button", { name: "Tatsächliche Ausgaben", exact: true })
    .click();
  await expect(
    page.getByText("Noch nicht erfasst", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ausgabe bearbeiten: Miete", exact: true })
    .click();
  await expect(page.getByLabel("Planbetrag (€)")).toHaveCount(0);
  await page.getByLabel("Tatsächliche Ausgabe (€)").fill("90");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(snapshot.data.expenses[0].actual).toBe(90);
  expect(snapshot.data.expenses[0].planned).toBe(100);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/tmp/idealab-budget-actual-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/idealab-budget-actual-mobile.png",
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("button", { name: "Ausgabe löschen: Miete", exact: true })
    .click();
  await page.getByRole("button", { name: "Bestätigen", exact: true }).click();
  await expect(
    page.getByText("Noch nicht erfasst", { exact: true }),
  ).toBeVisible();
  expect(snapshot.data.expenses[0].planned).toBe(100);
  expect(snapshot.data.expenses[0].actual).toBe(0);
  await page
    .getByRole("button", { name: "Ausgabe hinzufügen", exact: true })
    .click();
  await page.getByLabel("Kategorie", { exact: true }).fill("Spontankauf");
  await page.getByLabel("Tatsächliche Ausgabe (€)").fill("20");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    snapshot.data.expenses.find((x) => x.category === "Spontankauf")
      .plannedRecorded,
  ).toBe(false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dein Überblick." }),
  ).toBeVisible();
  await nav.getByRole("button").filter({ hasText: "Budget" }).click();
  await expect(
    page.getByRole("button", {
      name: "Planbetrag bearbeiten: Miete",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/idealab-budget-plan-desktop.png",
    fullPage: true,
  });
  await nav.getByRole("button").filter({ hasText: "Equipment" }).click();
  await page
    .getByRole("button", { name: "Equipment erstellen", exact: true })
    .click();
  await page.getByLabel("Bezeichnung", { exact: true }).fill("Teammikrofon");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(snapshot.data.equipment[0].name).toBe("Teammikrofon");
  await nav.getByRole("button").filter({ hasText: "Übersicht" }).click();
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Aufgabe erstellen", exact: true })
    .click();
  await page.getByLabel("Titel", { exact: true }).fill("Offline-Eingabe");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Du bist offline.", { exact: false }).first(),
  ).toBeVisible();
  expect(snapshot.data.tasks.some((x) => x.title === "Offline-Eingabe")).toBe(
    false,
  );
  await context.setOffline(false);
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await page.evaluate(() => window.__cloudChange());
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Abmelden", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/idealab-team-mobile.png",
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/tmp/idealab-team-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abmelden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Gemeinsam wird’s ein Event." }),
  ).toBeVisible();
  await expect(page.getByText("Teamänderung", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("unconfigured installation explains setup without exposing local data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Cloud-Verbindung ist noch nicht eingerichtet",
  );
  await expect(page.getByRole("navigation")).toHaveCount(0);
});
