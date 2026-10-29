import React, { useState } from "react";
import { uid, initials } from "../utils.js";
import {
  Badge,
  Empty,
  Field,
  FormActions,
  Icon,
  IconButton,
  Modal,
  useConfirm,
} from "../components/UI.jsx";

import { AssignmentSelect } from "../components/AssignmentFields.jsx";
const ROLES = ["Speaker", "Dienstleister", "Location", "Team"];
function ContactForm({ contact, store, onClose }) {
  const [form, setForm] = useState({
    id: uid(),
    name: "",
    role: "Speaker",
    organization: "",
    phone: "",
    email: "",
    notes: "",
    responsibility: "",
    internalOwner: "",
    ...contact,
  });
  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <Modal
      title={contact?.id ? "Kontakt bearbeiten" : "Kontakt erstellen"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v.trim()]),
          );
          if (store.upsert("contacts", trimmed)) onClose();
        }}
      >
        <Field label="Name">
          <input
            data-autofocus
            required
            pattern=".*\S.*"
            maxLength={100}
            value={form.name}
            onChange={change("name")}
            placeholder="Vor- und Nachname"
          />
        </Field>
        <div className="form-grid">
          <Field label="Rolle">
            <select value={form.role} onChange={change("role")}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Organisation">
            <input
              maxLength={120}
              value={form.organization}
              onChange={change("organization")}
            />
          </Field>
          <Field label="Telefonnummer">
            <input
              type="tel"
              maxLength={50}
              value={form.phone}
              onChange={change("phone")}
            />
          </Field>
          <Field label="E-Mail">
            <input
              type="email"
              maxLength={150}
              value={form.email}
              onChange={change("email")}
            />
          </Field>
        </div>
        <Field label="Zuständigkeit">
          <input
            maxLength={250}
            value={form.responsibility}
            onChange={change("responsibility")}
            placeholder="z. B. Raumreservierung, Technik oder Catering"
          />
        </Field>
        <AssignmentSelect
          value={form.internalOwner}
          onChange={(internalOwner) =>
            setForm((f) => ({ ...f, internalOwner }))
          }
        />
        <Field label="Notizen">
          <textarea
            rows="4"
            maxLength={2000}
            value={form.notes}
            onChange={change("notes")}
            placeholder="Absprachen, Erreichbarkeit, Besonderheiten …"
          />
        </Field>
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

export default function Contacts({ store, creating, onCreated }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState(""),
    [role, setRole] = useState("all"),
    [owner, setOwner] = useState("all"),
    [editor, setEditor] = useState(null),
    [detail, setDetail] = useState(null);
  const ownerOptions = [
    ...new Set(store.data.contacts.map((c) => c.internalOwner).filter(Boolean)),
  ].sort();
  const selectedOwner =
    owner === "all" || owner === "unassigned" || ownerOptions.includes(owner)
      ? owner
      : "all";
  const contacts = store.data.contacts.filter(
    (c) =>
      (role === "all" || c.role === role) &&
      (selectedOwner === "all" ||
        (selectedOwner === "unassigned"
          ? !c.internalOwner
          : c.internalOwner === selectedOwner)) &&
      `${c.name} ${c.organization} ${c.email} ${c.notes} ${c.responsibility || ""} ${c.internalOwner || ""}`
        .toLocaleLowerCase("de")
        .includes(query.toLocaleLowerCase("de")),
  );
  return (
    <>
      <div className="toolbar contacts-filters">
        <label className="search-field">
          <Icon name="search" size={19} />
          <input
            aria-label="Kontakte suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, Zuständigkeit oder Person …"
          />
        </label>
        <Field label="Rolle">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">Alle Rollen</option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Interne Ansprechperson">
          <select
            value={selectedOwner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="all">Alle Ansprechpersonen</option>
            <option value="unassigned">Noch nicht zugewiesen</option>
            {ownerOptions.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <span className="muted small">
          {contacts.length} {contacts.length === 1 ? "Kontakt" : "Kontakte"}
        </span>
      </div>
      <div className="table-panel contacts-table">
        <table>
          <thead>
            <tr>
              <th>Name / Organisation</th>
              <th>Zuständigkeit</th>
              <th>Intern zuständig</th>
              <th>Kontakt</th>
              <th>
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td data-label="Name">
                  <div className="contact-name">
                    <span className="avatar color-1">{initials(c.name)}</span>
                    <div>
                      <button
                        className="text-link"
                        onClick={() => setDetail(c)}
                      >
                        {c.name}
                      </button>
                      <small>{c.organization || "Keine Organisation"}</small>
                      <span className="contact-category">{c.role}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Zuständigkeit" className="responsibility-cell">
                  <strong>{c.responsibility || "Noch nicht hinterlegt"}</strong>
                  <button
                    className="notes-preview"
                    onClick={() => setDetail(c)}
                  >
                    {c.notes || "Details ansehen"}
                  </button>
                </td>
                <td data-label="Intern zuständig">
                  <span
                    className={
                      c.internalOwner ? "contact-internal-owner" : "muted"
                    }
                  >
                    {c.internalOwner || "Noch nicht zugewiesen"}
                  </span>
                </td>
                <td data-label="Kontakt">
                  <div className="contact-links">
                    {c.email ? (
                      <a href={`mailto:${c.email}`}>
                        <Icon name="mail" size={15} />
                        {c.email}
                      </a>
                    ) : null}
                    {c.phone ? (
                      <a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}>
                        <Icon name="phone" size={15} />
                        {c.phone}
                      </a>
                    ) : null}
                    {!c.email && !c.phone ? (
                      <span className="muted">Noch keine Angaben</span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton
                      icon="edit"
                      label={`Kontakt bearbeiten: ${c.name}`}
                      onClick={() => setEditor(c)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Kontakt löschen: ${c.name}`}
                      onClick={async () => {
                        if (await confirm(`Kontakt „${c.name}“ löschen?`))
                          store.remove("contacts", c.id);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!contacts.length ? (
          <Empty title="Keine Kontakte gefunden">
            Erstelle einen Kontakt oder passe die Suche an.
            {!store.data.contacts.length ? (
              <button className="button primary" onClick={() => setEditor({})}>
                Ersten Kontakt anlegen
              </button>
            ) : null}
          </Empty>
        ) : null}
      </div>
      <p className="page-footnote">
        Hinterlege externe Ansprechpartner:innen und wähle, wer intern den
        Austausch übernimmt.
      </p>
      {creating || editor ? (
        <ContactForm
          contact={editor}
          store={store}
          onClose={() => {
            setEditor(null);
            onCreated();
          }}
        />
      ) : null}
      {detail ? (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="contact-detail">
            <Badge tone="neutral">{detail.role}</Badge>
            <p>{detail.organization}</p>
            <div className="contact-relations">
              <div>
                <h3>Zuständigkeit</h3>
                <p>{detail.responsibility || "Noch nicht hinterlegt"}</p>
              </div>
              <div>
                <h3>Intern zuständig</h3>
                <p>{detail.internalOwner || "Noch nicht zugewiesen"}</p>
              </div>
            </div>
            {detail.email ? (
              <a href={`mailto:${detail.email}`}>
                <Icon name="mail" />
                {detail.email}
              </a>
            ) : null}
            {detail.phone ? (
              <a href={`tel:${detail.phone.replace(/[^+\d]/g, "")}`}>
                <Icon name="phone" />
                {detail.phone}
              </a>
            ) : null}
            <h3>Notizen</h3>
            <p className="preserve-lines">
              {detail.notes || "Keine Notizen vorhanden."}
            </p>
          </div>
          <div className="form-actions">
            <button
              className="button primary"
              onClick={() => {
                setEditor(detail);
                setDetail(null);
              }}
            >
              Kontakt bearbeiten
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
