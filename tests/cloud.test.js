import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createInitialData } from "../src/data.js";
import { operationsBetween, hasLocalContent } from "../src/cloud-data.js";

test("empty defaults and incremental changes preserve unrelated records", () => {
  const before = createInitialData();
  assert.equal(hasLocalContent(before), false);
  const next = {
    ...before,
    tasks: [{ id: "legacy-id", title: "Aufbau", owner: "Tech" }],
  };
  assert.deepEqual(operationsBetween(before, next), [
    { collection: "tasks", item: next.tasks[0] },
  ]);
  assert.equal(hasLocalContent(next), true);
  assert.deepEqual(operationsBetween(next, before), [
    { collection: "tasks", id: "legacy-id" },
  ]);
});

test("SQL migration: RLS, membership, atomic import, revision conflicts and retained IDs", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');`);
    const sql = await readFile(
      new URL(
        "../supabase/migrations/202610290001_team_workspace.sql",
        import.meta.url,
      ),
      "utf8",
    );
    // PGlite runs real Postgres/RLS; logical replication is tested separately against Supabase.
    await db.exec(
      sql.replace(
        "alter publication supabase_realtime add table public.event_workspaces;",
        "",
      ),
    );
    await db.exec(
      `insert into public.event_members values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111'); set role authenticated; set request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';`,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from public.event_workspaces"))
        .rows[0].n,
      0,
    );
    await assert.rejects(
      db.query(`select public.event_apply(0,'[]',false)`),
      /not a workspace member/,
    );
    await db.exec(
      `set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';`,
    );
    const item = {
      id: "old-text-id",
      title: "Aufbau",
      owner: "Orga – Otto",
      due: "2026-12-01",
      area: "Technik",
      status: "Offen",
      priority: "Hoch",
    };
    const result = await db.query(
      "select public.event_apply(0,$1::jsonb,true) as snapshot",
      [JSON.stringify([{ collection: "tasks", item }])],
    );
    assert.equal(result.rows[0].snapshot.revision, 1);
    assert.deepEqual(result.rows[0].snapshot.data.tasks, [item]);
    await assert.rejects(
      db.query(`select public.event_apply(0,'[]',false)`),
      /conflict/,
    );
    await assert.rejects(
      db.query(`select public.event_apply(1,'[]',true)`),
      /not empty/,
    );
    await assert.rejects(
      db.query(`delete from public.event_tasks`),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.event_apply(1,$1::jsonb,false)", [
        JSON.stringify([
          { collection: "tasks", id: item.id },
          { collection: "bad" },
        ]),
      ]),
      /invalid collection/,
    );
    assert.equal(
      (await db.query("select public.event_snapshot() as s")).rows[0].s.data
        .tasks.length,
      1,
    );
    await db.exec(
      `reset role; delete from public.event_members; set role authenticated;`,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from public.event_tasks"))
        .rows[0].n,
      0,
    );
    await db.exec(`reset role; set role anon;`);
    await assert.rejects(
      db.query("select * from public.event_tasks"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.event_snapshot()"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
