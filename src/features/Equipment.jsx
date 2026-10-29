import React, { useState } from "react";
import {
  Button,
  Empty,
  Field,
  Icon,
  IconButton,
  Modal,
  useConfirm,
} from "../components/UI.jsx";
import {
  newEquipment,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  equipmentDelivery,
  isDeliveryLate,
} from "../equipment.js";
import EquipmentForm from "./equipment/EquipmentForm.jsx";
import EquipmentDetails from "./equipment/EquipmentDetails.jsx";
import EquipmentLabels from "./equipment/EquipmentLabels.jsx";
import "../equipment.css";

export default function Equipment({
  store,
  creating,
  onCreated,
  selectedId,
  onOpenItem,
  onCloseItem,
}) {
  const confirm = useConfirm();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [status, setStatus] = useState("all"),
    [editor, setEditor] = useState(null),
    [labels, setLabels] = useState(null),
    [qrMode, setQrMode] = useState("info");
  const equipment = store.data.equipment
    .filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (status === "all" || item.status === status) &&
        `${item.inventoryCode} ${item.name} ${item.category} ${item.storageLocation} ${item.owner} ${item.notes}`
          .toLocaleLowerCase("de")
          .includes(query.toLocaleLowerCase("de")),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  const selected = store.data.equipment.find((item) => item.id === selectedId);
  return (
    <>
      <div className="toolbar equipment-filters">
        <label className="search-field">
          <Icon name="search" size={19} />
          <input
            aria-label="Equipment suchen"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bezeichnung, Inventarnummer, Lagerort oder Person …"
          />
        </label>
        <Field label="Kategorie">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Alle Kategorien</option>
            {EQUIPMENT_CATEGORIES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Alle Status</option>
            {EQUIPMENT_STATUSES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="equipment-list-toolbar">
        <p className="result-count" aria-live="polite">
          {equipment.length} von {store.data.equipment.length} Einträgen
        </p>
        <Button
          variant="secondary"
          icon="qr"
          disabled={!equipment.length}
          onClick={() => setLabels(equipment)}
        >
          QR-Etiketten
        </Button>
      </div>
      <div className="table-panel equipment-table">
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Menge</th>
              <th>Lagerort</th>
              <th>Liefertermin</th>
              <th>Zuständig</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id}>
                <td data-label="Equipment">
                  <button
                    className="text-link"
                    onClick={() => onOpenItem(item.id)}
                  >
                    {item.name}
                  </button>
                  <code className="inventory-code">{item.inventoryCode}</code>
                  <span className="equipment-category">{item.category}</span>
                </td>
                <td data-label="Menge" className="equipment-quantity">
                  <strong>{item.quantity}</strong>
                  <span>{item.unit}</span>
                </td>
                <td data-label="Lagerort">
                  <span className={item.storageLocation ? "" : "muted"}>
                    {item.storageLocation || "Noch nicht hinterlegt"}
                  </span>
                </td>
                <td data-label="Liefertermin">
                  <div className={isDeliveryLate(item) ? "equipment-late" : ""}>
                    {equipmentDelivery(item)}
                    {isDeliveryLate(item) ? (
                      <small>Termin überschritten</small>
                    ) : null}
                  </div>
                </td>
                <td data-label="Zuständig">
                  <span className={item.owner ? "" : "muted"}>
                    {item.owner || "Noch nicht zugewiesen"}
                  </span>
                </td>
                <td data-label="Status">
                  <select
                    className={`equipment-status ${item.status === "Vor Ort" || item.status === "Zurückgegeben" ? "is-ready" : ""}`}
                    aria-label={`Status: ${item.name}`}
                    value={item.status}
                    onChange={(event) =>
                      store.upsert("equipment", {
                        ...item,
                        status: event.target.value,
                      })
                    }
                  >
                    {EQUIPMENT_STATUSES.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton
                      icon="qr"
                      label={`QR-Code: ${item.name}`}
                      onClick={() => onOpenItem(item.id)}
                    />
                    <IconButton
                      icon="edit"
                      label={`Equipment bearbeiten: ${item.name}`}
                      onClick={() => setEditor(item)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Equipment löschen: ${item.name}`}
                      onClick={async () => {
                        if (
                          await confirm(
                            `Equipment „${item.name}“ (${item.inventoryCode}) aus dem Inventar löschen? Bereits gedruckte QR-Links führen anschließend zu keinem Eintrag mehr.`,
                          )
                        ) {
                          if (
                            store.remove("equipment", item.id) &&
                            selectedId === item.id
                          )
                            onCloseItem();
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!equipment.length ? (
          <Empty
            title={
              store.data.equipment.length
                ? "Kein passendes Equipment"
                : "Dein Inventar beginnt hier"
            }
          >
            {store.data.equipment.length
              ? "Passe die Suche oder die Filter an."
              : "Erfasse Technik, Möbel, Schilder und Material – mit Lagerort, Liefertermin und Zuständigkeit."}
            {!store.data.equipment.length ? (
              <Button onClick={() => setEditor(newEquipment())}>
                Erstes Equipment anlegen
              </Button>
            ) : null}
          </Empty>
        ) : null}
      </div>
      <p className="page-footnote">
        Jeder Eintrag hat eine eindeutige Inventarnummer. QR-Codes entstehen
        lokal; über „QR-Etiketten“ druckst du die aktuell gefilterten Einträge.
      </p>
      {creating || editor ? (
        <EquipmentForm
          item={editor}
          store={store}
          onClose={() => {
            setEditor(null);
            onCreated();
          }}
        />
      ) : null}
      {selected && !creating && !editor && !labels ? (
        <EquipmentDetails
          item={selected}
          mode={qrMode}
          onModeChange={setQrMode}
          onClose={onCloseItem}
          onEdit={setEditor}
          onLabels={setLabels}
        />
      ) : null}
      {selectedId && !selected && !creating && !editor && !labels ? (
        <Modal title="Equipment nicht gefunden" onClose={onCloseItem}>
          <p className="form-note">
            Dieser Eintrag ist in diesem Browser nicht vorhanden. Er wurde
            gelöscht oder die Daten wurden noch nicht per Backup in diesen
            Browser übertragen.
          </p>
          <div className="form-actions">
            <Button onClick={onCloseItem}>Inventarliste öffnen</Button>
          </div>
        </Modal>
      ) : null}
      {labels ? (
        <EquipmentLabels
          items={labels}
          mode={qrMode}
          onModeChange={setQrMode}
          onClose={() => setLabels(null)}
        />
      ) : null}
    </>
  );
}
