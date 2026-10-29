import React, { useState } from "react";
import { Badge, Button, Modal } from "../../components/UI.jsx";
import { QrCode, QrMode, qrPayload } from "../../components/EquipmentQr.jsx";
import { equipmentDelivery, equipmentLink } from "../../equipment.js";
import { downloadEquipmentQr } from "../../equipment-qr.js";

export default function EquipmentDetails({
  item,
  mode,
  onModeChange,
  onClose,
  onEdit,
  onLabels,
}) {
  const [message, setMessage] = useState("");
  return (
    <Modal title={item.name} onClose={onClose} wide>
      <div className="equipment-detail">
        <div className="equipment-detail-copy">
          <code className="inventory-code">{item.inventoryCode}</code>
          <Badge tone="neutral">{item.category}</Badge>
          <dl>
            <div>
              <dt>Menge</dt>
              <dd>
                {item.quantity} {item.unit}
              </dd>
            </div>
            <div>
              <dt>Lagerort</dt>
              <dd>{item.storageLocation || "Noch nicht hinterlegt"}</dd>
            </div>
            <div>
              <dt>Liefertermin</dt>
              <dd>{equipmentDelivery(item)}</dd>
            </div>
            <div>
              <dt>Zuständig</dt>
              <dd>{item.owner || "Noch nicht zugewiesen"}</dd>
            </div>
            <div>
              <dt>Logistikstatus</dt>
              <dd>{item.status}</dd>
            </div>
          </dl>
        </div>
        <div className="equipment-qr-preview">
          <QrCode
            payload={qrPayload(item, mode)}
            label={`QR-Code für ${item.name}`}
          />
          <span>{item.inventoryCode}</span>
        </div>
      </div>
      {item.notes ? (
        <div className="equipment-notes">
          <h3>Notizen</h3>
          <p className="preserve-lines">{item.notes}</p>
        </div>
      ) : null}
      <QrMode mode={mode} onChange={onModeChange} />
      <div className="equipment-detail-actions">
        <Button
          variant="secondary"
          icon="download"
          onClick={() => downloadEquipmentQr(item, qrPayload(item, mode))}
        >
          QR-Code herunterladen
        </Button>
        <Button
          variant="secondary"
          icon="print"
          onClick={() => onLabels([item])}
        >
          Etikett drucken
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(equipmentLink(item.id));
              setMessage("Direktlink kopiert.");
            } catch {
              setMessage(
                "Kopieren ist in diesem Browser nicht verfügbar. Wähle den Direktlink unten zum manuellen Kopieren aus.",
              );
            }
          }}
        >
          Direktlink kopieren
        </Button>
      </div>
      {message ? (
        <div role="status" className="equipment-copy-message">
          <p>{message}</p>
          <input
            aria-label="Direktlink zum Equipment"
            readOnly
            value={equipmentLink(item.id)}
            onFocus={(event) => event.target.select()}
          />
        </div>
      ) : null}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          Schließen
        </Button>
        <Button icon="edit" onClick={() => onEdit(item)}>
          Bearbeiten
        </Button>
      </div>
    </Modal>
  );
}
