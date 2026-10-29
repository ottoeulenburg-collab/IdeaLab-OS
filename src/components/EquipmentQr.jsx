import React, { useMemo } from "react";
import { equipmentLink, equipmentQrText } from "../equipment.js";
import { qrGeometry } from "../equipment-qr.js";
import { Field } from "./UI.jsx";

export function QrCode({ payload, label }) {
  const { size, path } = useMemo(() => qrGeometry(payload), [payload]);
  return (
    <svg
      className="equipment-qr"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      width="224"
      height="224"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#FFFFFF" />
      <path d={path} fill="#1e1e1e" />
    </svg>
  );
}

export function qrPayload(item, mode) {
  return mode === "link" ? equipmentLink(item.id) : equipmentQrText(item);
}

export function EquipmentLabel({ item, mode }) {
  return (
    <article className="equipment-label">
      <span className="label-brand">IdeaLab!</span>
      <QrCode
        payload={qrPayload(item, mode)}
        label={`QR-Code für ${item.name}`}
      />
      <strong>{item.name}</strong>
      <code>{item.inventoryCode}</code>
      <small>{item.storageLocation || "Lagerort offen"}</small>
    </article>
  );
}

export function QrMode({ mode, onChange }) {
  return (
    <div className="qr-mode">
      <Field label="QR-Inhalt">
        <select value={mode} onChange={(event) => onChange(event.target.value)}>
          <option value="info">Inventarinfos · ohne App lesbar</option>
          <option value="link">Direktlink zum Eintrag</option>
        </select>
      </Field>
      <p>
        {mode === "info"
          ? "Enthält Inventarnummer, Lagerort, Liefertermin und Zuständigkeit. Gedruckte Codes zeigen den Stand beim Erstellen; nach Änderungen bitte neu drucken."
          : "Öffnet den Eintrag in dieser App. Die Daten müssen im öffnenden Browser vorhanden sein. Bei 127.0.0.1 erreicht ein Smartphone deinen Rechner nicht; es gibt noch keine geräteübergreifende Synchronisierung."}
      </p>
    </div>
  );
}
