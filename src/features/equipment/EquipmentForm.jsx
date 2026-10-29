import React, { useState } from "react";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  EQUIPMENT_UNITS,
  INVENTORY_CODE_PATTERN,
  newEquipment,
  validEquipmentItem,
} from "../../equipment.js";
import { Field, FormActions, Modal } from "../../components/UI.jsx";

import { AssignmentSelect } from "../../components/AssignmentFields.jsx";
export default function EquipmentForm({ item, store, onClose }) {
  const [baseline] = useState(() => item || null);
  const [form, setForm] = useState(() => item || newEquipment());
  const [error, setError] = useState("");
  const change = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [key]: key === "inventoryCode" ? value.toUpperCase() : value,
    }));
    setError("");
  };
  async function submit(event) {
    event.preventDefault();
    const cleaned = {
      ...form,
      name: form.name.trim(),
      inventoryCode: form.inventoryCode.trim().toUpperCase(),
      storageLocation: form.storageLocation.trim(),
      owner: form.owner.trim(),
      notes: form.notes.trim(),
      quantity: Number(form.quantity),
    };
    if (!INVENTORY_CODE_PATTERN.test(cleaned.inventoryCode)) {
      setError(
        "Die Inventarnummer muss 2–32 Zeichen lang sein. Verwende Buchstaben, Zahlen, Punkte, Bindestriche oder Unterstriche.",
      );
      return;
    }
    if (
      store.data.equipment.some(
        (entry) =>
          entry.id !== cleaned.id &&
          entry.inventoryCode === cleaned.inventoryCode,
      )
    ) {
      setError(
        "Diese Inventarnummer ist bereits vergeben. Bitte wähle eine eindeutige Nummer.",
      );
      return;
    }
    if (!validEquipmentItem(cleaned)) {
      setError(
        "Bitte prüfe die Angaben: Name, Kategorie, Menge und Liefertermin müssen gültig sein.",
      );
      return;
    }
    if (await store.upsert("equipment", cleaned, baseline)) onClose();
    else
      setError(
        "Der Eintrag konnte nicht gespeichert werden. Bitte prüfe die Verbindung und lade den Teamstand neu.",
      );
  }
  return (
    <Modal
      title={item?.name ? "Equipment bearbeiten" : "Equipment erstellen"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <Field label="Bezeichnung">
          <input
            data-autofocus
            required
            maxLength={100}
            value={form.name}
            onChange={change("name")}
            placeholder="z. B. Funkmikrofon-Set"
          />
        </Field>
        <div className="form-grid">
          <Field label="Inventarnummer">
            <input
              required
              maxLength={32}
              value={form.inventoryCode}
              onChange={change("inventoryCode")}
            />
          </Field>
          <Field label="Kategorie">
            <select value={form.category} onChange={change("category")}>
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Menge">
            <input
              type="number"
              required
              min="0"
              max="1000000"
              step="1"
              value={form.quantity}
              onChange={change("quantity")}
            />
          </Field>
          <Field label="Einheit">
            <select value={form.unit} onChange={change("unit")}>
              {EQUIPMENT_UNITS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Lagerort">
          <input
            maxLength={120}
            value={form.storageLocation}
            onChange={change("storageLocation")}
            placeholder="z. B. Orga-Lager · Regal B, Fach 2"
          />
        </Field>
        <div className="form-grid">
          <Field label="Liefertermin">
            <input
              type="datetime-local"
              value={form.deliveryAt}
              onInput={change("deliveryAt")}
              onChange={change("deliveryAt")}
            />
          </Field>
          <AssignmentSelect
            label="Zuständig"
            value={form.owner}
            onChange={(owner) => setForm((f) => ({ ...f, owner }))}
          />
        </div>
        <Field label="Logistikstatus">
          <select value={form.status} onChange={change("status")}>
            {EQUIPMENT_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>
        <Field label="Notizen">
          <textarea
            rows="3"
            maxLength={2000}
            value={form.notes}
            onChange={change("notes")}
            placeholder="Abholung, Aufbau, Zubehör oder Rückgabe …"
          />
        </Field>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
