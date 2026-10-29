import React from "react";
import { Field } from "./UI.jsx";
import { ASSIGNMENTS } from "../assignment.js";

export function AssignmentSelect({
  value,
  onChange,
  label = "Intern zuständig",
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Noch nicht zugewiesen</option>
        {ASSIGNMENTS.map((value) => (
          <option key={value}>{value}</option>
        ))}
        {value && !ASSIGNMENTS.includes(value) ? (
          <option value={value}>{value} (bisherige Angabe)</option>
        ) : null}
      </select>
    </Field>
  );
}

export default function AssignmentFields({ value, onChange }) {
  const team =
    value === "Tech" ? "Tech" : value.startsWith("Orga") ? "Orga" : "";
  return (
    <>
      <Field label="Zuständiges Team">
        <select
          value={team}
          onChange={(e) =>
            onChange(
              e.target.value === "Tech"
                ? "Tech"
                : e.target.value === "Orga"
                  ? "Orga"
                  : "",
            )
          }
        >
          <option value="">Noch nicht zugewiesen</option>
          <option>Orga</option>
          <option>Tech</option>
        </select>
      </Field>
      {team === "Orga" ? (
        <Field label="Verantwortliche Person">
          <select
            required
            value={value === "Orga" ? "" : value}
            onChange={(e) => onChange(e.target.value || "Orga")}
          >
            <option value="">Bitte wählen</option>
            <option value="Orga – Otto">Otto</option>
            <option value="Orga – Anton">Anton</option>
          </select>
        </Field>
      ) : null}
    </>
  );
}
