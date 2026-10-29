import React, { useState } from "react";
import { AREAS, PRIORITIES, STATUSES, localDate, uid } from "../utils.js";
import { Field, FormActions, Modal } from "./UI.jsx";

import AssignmentFields from "./AssignmentFields.jsx";
export default function TaskForm({ task, store, onClose, initialDue }) {
  const [form, setForm] = useState(
    task || {
      id: uid(),
      title: "",
      area: "Sonstiges",
      owner: "",
      due: initialDue || localDate(),
      priority: "Mittel",
      status: "Offen",
    },
  );
  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  function submit(e) {
    e.preventDefault();
    if (
      store.upsert("tasks", {
        ...form,
        title: form.title.trim(),
        owner: form.owner.trim(),
      })
    )
      onClose();
  }
  return (
    <Modal
      title={task ? "Aufgabe bearbeiten" : "Aufgabe erstellen"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <Field label="Titel">
          <input
            data-autofocus
            required
            maxLength={150}
            value={form.title}
            onChange={change("title")}
            placeholder="Was gibt es zu tun?"
            pattern=".*\S.*"
          />
        </Field>
        <div className="form-grid">
          <Field label="Bereich">
            <select value={form.area} onChange={change("area")}>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <AssignmentFields
            value={form.owner}
            onChange={(owner) => setForm((f) => ({ ...f, owner }))}
          />
          {form.legacyOwner ? (
            <p className="form-note">
              Bisherige Zuständigkeit: {form.legacyOwner}. Bitte neu zuweisen.
            </p>
          ) : null}
          <Field label="Fälligkeitsdatum">
            <input
              type="date"
              required
              value={form.due}
              onInput={change("due")}
              onChange={change("due")}
            />
          </Field>
          <Field label="Priorität">
            <select value={form.priority} onChange={change("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Status">
          <select value={form.status} onChange={change("status")}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
