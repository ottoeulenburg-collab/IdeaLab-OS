import React, { useState } from "react";
import {
  SHIFT_ROLES,
  formatDate,
  time,
  uid,
  shiftError,
  initials,
} from "../utils.js";
import {
  Badge,
  Button,
  Empty,
  Field,
  FormActions,
  Icon,
  IconButton,
  Modal,
  useConfirm,
} from "../components/UI.jsx";

function ShiftForm({ shift, store, onClose }) {
  const day = store.data.event.start.slice(0, 10);
  const [form, setForm] = useState(
    shift || {
      id: uid(),
      role: "Aufbau",
      start: `${day}T14:00`,
      end: `${day}T16:00`,
      capacity: 2,
      personIds: [],
      note: "",
    },
  );
  const [error, setError] = useState("");
  const change = (key) => (e) => {
    setForm((f) => ({
      ...f,
      [key]: key === "capacity" ? Number(e.target.value) : e.target.value,
    }));
    setError("");
  };
  function submit(e) {
    e.preventDefault();
    const error = shiftError(form, store.data.shifts);
    if (error) {
      setError(error);
      return;
    }
    if (store.upsert("shifts", { ...form, note: form.note.trim() })) onClose();
  }
  return (
    <Modal
      title={shift ? "Schicht bearbeiten" : "Schicht erstellen"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Aufgabe / Einsatzbereich">
            <select data-autofocus value={form.role} onChange={change("role")}>
              {SHIFT_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Benötigte Personen">
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              required
              value={form.capacity}
              onChange={change("capacity")}
            />
          </Field>
          <Field label="Beginn">
            <input
              type="datetime-local"
              required
              value={form.start}
              onInput={change("start")}
              onChange={change("start")}
            />
          </Field>
          <Field label="Ende">
            <input
              type="datetime-local"
              required
              value={form.end}
              onInput={change("end")}
              onChange={change("end")}
            />
          </Field>
        </div>
        <fieldset className="people-picker">
          <legend>
            Helfer:innen zuweisen{" "}
            <span className="muted">
              ({form.personIds.length} / {form.capacity})
            </span>
          </legend>
          {store.data.people.length ? (
            store.data.people.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={form.personIds.includes(p.id)}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      personIds: e.target.checked
                        ? [...f.personIds, p.id]
                        : f.personIds.filter((id) => id !== p.id),
                    }));
                    setError("");
                  }}
                />
                <span className="avatar color-1">{initials(p.name)}</span>
                {p.name}
              </label>
            ))
          ) : (
            <p className="muted small">
              Lege zuerst Helfer:innen über „Team verwalten“ an.
            </p>
          )}
        </fieldset>
        <Field label="Notizen">
          <textarea
            rows="3"
            maxLength={1000}
            value={form.note}
            onChange={change("note")}
            placeholder="Treffpunkt, Material, Besonderheiten …"
          />
        </Field>
        {error ? (
          <p role="alert" className="form-error">
            <Icon name="alert" size={18} />
            {error}
          </p>
        ) : null}
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

function TeamManager({ store, onClose }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  function save(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (
      store.data.people.some(
        (p) =>
          p.id !== editing &&
          p.name.toLocaleLowerCase("de") === trimmed.toLocaleLowerCase("de"),
      )
    ) {
      setError("Diese Person ist bereits im Team.");
      return;
    }
    if (store.upsert("people", { id: editing || uid(), name: trimmed })) {
      setEditing(null);
      setName("");
      setError("");
    }
  }
  return (
    <Modal title="Team verwalten" onClose={onClose}>
      <p className="form-note">
        Lege hier die Personen an, die du deinen Schichten zuweisen möchtest.
      </p>
      <form onSubmit={save} className="team-form">
        <Field label={editing ? "Name bearbeiten" : "Neue Person"}>
          <input
            data-autofocus
            required
            maxLength={100}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Vor- und Nachname"
          />
        </Field>
        <Button type="submit" icon={editing ? "check" : "plus"}>
          {editing ? "Speichern" : "Hinzufügen"}
        </Button>
        {editing ? (
          <IconButton
            icon="close"
            label="Bearbeitung abbrechen"
            onClick={() => {
              setEditing(null);
              setName("");
            }}
          />
        ) : null}
      </form>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      <div className="team-list">
        {store.data.people.map((p) => (
          <div key={p.id} className="team-row">
            <span className="avatar color-1">{initials(p.name)}</span>
            <div>
              <strong>{p.name}</strong>
              <small>
                {
                  store.data.shifts.filter((s) => s.personIds.includes(p.id))
                    .length
                }{" "}
                {store.data.shifts.filter((s) => s.personIds.includes(p.id))
                  .length === 1
                  ? "Schicht"
                  : "Schichten"}
              </small>
            </div>
            <div className="row-actions">
              <IconButton
                icon="edit"
                label={`Person bearbeiten: ${p.name}`}
                onClick={() => {
                  setEditing(p.id);
                  setName(p.name);
                  setError("");
                }}
              />
              <IconButton
                icon="trash"
                label={`Person löschen: ${p.name}`}
                onClick={async () => {
                  if (
                    await confirm(
                      `„${p.name}“ aus dem Team und allen Schichten entfernen?`,
                    )
                  ) {
                    store.remove("people", p.id);
                    if (editing === p.id) {
                      setEditing(null);
                      setName("");
                    }
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <Button onClick={onClose} variant="secondary">
          Schließen
        </Button>
      </div>
    </Modal>
  );
}

export default function Shifts({ store, creating, onCreated }) {
  const confirm = useConfirm();
  const [editor, setEditor] = useState(null),
    [teamOpen, setTeamOpen] = useState(false),
    [person, setPerson] = useState("all"),
    [role, setRole] = useState("all");
  const selectedPerson = store.data.people.some((p) => p.id === person)
    ? person
    : "all";
  const shifts = store.data.shifts
    .filter(
      (s) =>
        (selectedPerson === "all" || s.personIds.includes(selectedPerson)) &&
        (role === "all" || s.role === role),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const dates = [...new Set(shifts.map((s) => s.start.slice(0, 10)))];
  const open = store.data.shifts.reduce(
    (total, s) => total + Math.max(0, s.capacity - s.personIds.length),
    0,
  );
  return (
    <>
      <div className="toolbar">
        <div className="toolbar-description">
          <strong>{store.data.people.length} Helfer:innen</strong>
          <span>
            {open} unbesetzte {open === 1 ? "Position" : "Positionen"} in{" "}
            {store.data.shifts.length} Schichten
          </span>
        </div>
        <Field label="Person">
          <select
            value={selectedPerson}
            onChange={(e) => setPerson(e.target.value)}
          >
            <option value="all">Alle Helfer:innen</option>
            {store.data.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Einsatzbereich">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">Alle Bereiche</option>
            {SHIFT_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Button
          variant="secondary"
          icon="users"
          onClick={() => setTeamOpen(true)}
        >
          Team verwalten
        </Button>
      </div>
      <div className="shift-days">
        {dates.map((day) => (
          <section key={day}>
            <h2 className="day-heading">
              <Icon name="calendar" />
              {formatDate(day, true)}
            </h2>
            <div className="shift-list">
              {shifts
                .filter((s) => s.start.startsWith(day))
                .map((s) => (
                  <article className="shift-card" key={s.id}>
                    <div className="shift-time">
                      <strong>{time(s.start)}</strong>
                      <span>bis {time(s.end)}</span>
                      {s.end.slice(0, 10) !== day ? (
                        <small>{formatDate(s.end)}</small>
                      ) : null}
                    </div>
                    <div className="shift-info">
                      <div className="shift-title">
                        <h3>{s.role}</h3>
                        <Badge
                          tone={
                            s.personIds.length < s.capacity
                              ? "warning"
                              : "success"
                          }
                        >
                          {s.personIds.length} / {s.capacity} besetzt
                        </Badge>
                      </div>
                      {s.note ? <p>{s.note}</p> : null}
                      <div className="assigned-people">
                        {s.personIds.map((id) => {
                          const p = store.data.people.find((p) => p.id === id);
                          return p ? (
                            <span key={id}>
                              <span className="avatar color-1">
                                {initials(p.name)}
                              </span>
                              {p.name}
                            </span>
                          ) : null;
                        })}
                        {s.personIds.length === 0 ? (
                          <span className="muted">Noch niemand eingeteilt</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="row-actions">
                      <IconButton
                        icon="edit"
                        label={`Schicht bearbeiten: ${s.role} ${time(s.start)}`}
                        onClick={() => setEditor(s)}
                      />
                      <IconButton
                        icon="trash"
                        label={`Schicht löschen: ${s.role} ${time(s.start)}`}
                        onClick={async () => {
                          if (
                            await confirm(
                              `Schicht „${s.role}“ am ${formatDate(s.start)} löschen?`,
                            )
                          )
                            store.remove("shifts", s.id);
                        }}
                      />
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
      {!shifts.length ? (
        <Empty title="Keine Schichten gefunden">
          Erstelle eine Schicht oder ändere deine Filter.
        </Empty>
      ) : null}
      {creating || editor ? (
        <ShiftForm
          store={store}
          shift={editor}
          onClose={() => {
            setEditor(null);
            onCreated();
          }}
        />
      ) : null}
      {teamOpen ? (
        <TeamManager store={store} onClose={() => setTeamOpen(false)} />
      ) : null}
    </>
  );
}
