import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Modal } from "../../components/UI.jsx";
import { EquipmentLabel, QrMode } from "../../components/EquipmentQr.jsx";

export default function EquipmentLabels({
  items,
  mode,
  onModeChange,
  onClose,
}) {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(items.map((item) => item.id)),
  );
  const selected = items.filter((item) => selectedIds.has(item.id));
  useEffect(() => {
    document.body.classList.add("printing-equipment");
    return () => document.body.classList.remove("printing-equipment");
  }, []);
  return (
    <>
      <Modal title="QR-Etiketten vorbereiten" onClose={onClose} wide>
        <QrMode mode={mode} onChange={onModeChange} />
        <div className="equipment-labels-toolbar">
          <span>
            {selected.length} von {items.length} Etiketten ausgewählt
          </span>
          <button
            className="text-button small"
            onClick={() =>
              setSelectedIds(
                selected.length === items.length
                  ? new Set()
                  : new Set(items.map((item) => item.id)),
              )
            }
          >
            {selected.length === items.length
              ? "Auswahl aufheben"
              : "Alle auswählen"}
          </button>
        </div>
        <div className="equipment-labels-preview">
          {items.map((item) => (
            <div
              className={`equipment-label-choice ${selectedIds.has(item.id) ? "is-selected" : ""}`}
              key={item.id}
            >
              <label>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  aria-label={`Etikett auswählen: ${item.name}`}
                  onChange={(event) =>
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    })
                  }
                />
                <span>Etikett auswählen</span>
              </label>
              <EquipmentLabel item={item} mode={mode} />
            </div>
          ))}
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={onClose}>
            Schließen
          </Button>
          <Button
            icon="print"
            disabled={!selected.length}
            onClick={() => window.print()}
          >
            Drucken / als PDF speichern
          </Button>
        </div>
      </Modal>
      {createPortal(
        <div className="equipment-print-sheet" aria-hidden="true">
          {selected.map((item) => (
            <EquipmentLabel key={item.id} item={item} mode={mode} />
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
