import React, { useState } from "react";
import { money, sumMoney, uid } from "../utils.js";
import {
  Button,
  Empty,
  Field,
  FormActions,
  Icon,
  IconButton,
  Modal,
  useConfirm,
} from "../components/UI.jsx";

function ExpenseForm({ expense, store, onClose }) {
  const [form, setForm] = useState(
    expense || { id: uid(), category: "", planned: "", actual: "", note: "" },
  );
  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <Modal
      title={
        expense?.category ? "Budgetposten bearbeiten" : "Budgetposten erstellen"
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            store.upsert("expenses", {
              ...form,
              category: form.category.trim(),
              note: form.note.trim(),
              planned: Number(form.planned),
              actual: Number(form.actual),
            })
          )
            onClose();
        }}
      >
        <Field label="Kategorie">
          <input
            data-autofocus
            required
            pattern=".*\S.*"
            maxLength={100}
            value={form.category}
            onChange={change("category")}
            placeholder="z. B. Catering"
          />
        </Field>
        <div className="form-grid">
          <Field label="Geplant (€)">
            <input
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              required
              value={form.planned}
              onChange={change("planned")}
            />
          </Field>
          <Field label="Tatsächlich (€)">
            <input
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              required
              value={form.actual}
              onChange={change("actual")}
            />
          </Field>
        </div>
        <Field label="Notizen">
          <textarea
            rows="3"
            maxLength={1000}
            value={form.note}
            onChange={change("note")}
          />
        </Field>
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

export default function Budget({ store, creating, onCreated }) {
  const confirm = useConfirm();
  const [editor, setEditor] = useState(null),
    [budgetOpen, setBudgetOpen] = useState(false),
    [totalInput, setTotalInput] = useState(store.data.event.budget);
  const { expenses, event } = store.data,
    planned = sumMoney(expenses, "planned"),
    actual = sumMoney(expenses, "actual");
  const remaining = Math.round((event.budget - actual) * 100) / 100,
    buffer = Math.round((event.budget - planned) * 100) / 100;
  const percent = event.budget
    ? Math.round((actual / event.budget) * 100)
    : actual
      ? 100
      : 0;
  return (
    <>
      <div className="budget-summary">
        {[
          ["Gesamtbudget", event.budget, ""],
          ["Geplante Ausgaben", planned, ""],
          ["Tatsächliche Ausgaben", actual, ""],
          ["Restbudget", remaining, remaining < 0 ? "orange" : "green"],
        ].map(([label, value, color]) => (
          <div key={label}>
            <span>{label}</span>
            <strong className={color}>{money(value)}</strong>
          </div>
        ))}
      </div>
      <div className="budget-health">
        <div>
          <strong>{percent} % des Budgets verwendet</strong>
          <span className={buffer < 0 ? "overdue-text" : "muted"}>
            {buffer < 0
              ? `Planung überschreitet das Budget um ${money(-buffer)}.`
              : `${money(buffer)} Planungspuffer verbleiben.`}
          </span>
        </div>
        <Button
          variant="secondary"
          icon="edit"
          onClick={() => {
            setTotalInput(event.budget);
            setBudgetOpen(true);
          }}
        >
          Gesamtbudget ändern
        </Button>
        <progress
          className={`progress ${remaining < 0 ? "over-budget" : ""}`}
          max="100"
          value={Math.min(100, percent)}
          aria-label="Budgetverbrauch"
        />
      </div>
      {remaining < 0 ? (
        <div className="notice warning">
          <Icon name="alert" />
          Die tatsächlichen Ausgaben liegen {money(-remaining)} über dem
          Gesamtbudget.
        </div>
      ) : null}
      <div className="table-panel budget-table">
        <table>
          <thead>
            <tr>
              <th>Kategorie</th>
              <th className="numeric">Geplant</th>
              <th className="numeric">Tatsächlich</th>
              <th className="numeric">Abweichung</th>
              <th>Notizen</th>
              <th>
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td data-label="Kategorie">
                  <strong>{e.category}</strong>
                </td>
                <td data-label="Geplant" className="numeric">
                  {money(e.planned)}
                </td>
                <td data-label="Tatsächlich" className="numeric">
                  <strong>{money(e.actual)}</strong>
                </td>
                <td
                  data-label="Abweichung"
                  className={`numeric ${e.actual > e.planned ? "orange" : "green"}`}
                >
                  {e.actual > e.planned ? "+" : ""}
                  {money(Math.round((e.actual - e.planned) * 100) / 100)}
                </td>
                <td data-label="Notizen" className="muted budget-note">
                  {e.note || "–"}
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton
                      icon="edit"
                      label={`Budgetposten bearbeiten: ${e.category}`}
                      onClick={() => setEditor(e)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Budgetposten löschen: ${e.category}`}
                      onClick={async () => {
                        if (
                          await confirm(`Budgetposten „${e.category}“ löschen?`)
                        )
                          store.remove("expenses", e.id);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Gesamt</td>
              <td className="numeric">{money(planned)}</td>
              <td className="numeric">{money(actual)}</td>
              <td
                className={`numeric ${actual > planned ? "orange" : "green"}`}
              >
                {actual > planned ? "+" : ""}
                {money(Math.round((actual - planned) * 100) / 100)}
              </td>
              <td colSpan="2" />
            </tr>
          </tfoot>
        </table>
        {!expenses.length ? (
          <Empty title="Dein Budget beginnt hier">
            Lege den ersten Budgetposten an.
            <Button
              onClick={() =>
                setEditor({
                  id: uid(),
                  category: "",
                  planned: "",
                  actual: "",
                  note: "",
                })
              }
            >
              Budgetposten hinzufügen
            </Button>
          </Empty>
        ) : null}
      </div>
      <p className="page-footnote">
        Abweichung = tatsächliche minus geplante Ausgaben. Negative Werte liegen
        unter der Planung. Restbudget = Gesamtbudget minus tatsächliche
        Ausgaben.
      </p>
      {creating || editor ? (
        <ExpenseForm
          expense={editor}
          store={store}
          onClose={() => {
            setEditor(null);
            onCreated();
          }}
        />
      ) : null}
      {budgetOpen ? (
        <Modal title="Gesamtbudget ändern" onClose={() => setBudgetOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                store.commit({
                  ...store.data,
                  event: { ...event, budget: Number(totalInput) },
                })
              )
                setBudgetOpen(false);
            }}
          >
            <Field label="Gesamtbudget (€)">
              <input
                data-autofocus
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                required
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
              />
            </Field>
            <FormActions onClose={() => setBudgetOpen(false)} />
          </form>
        </Modal>
      ) : null}
    </>
  );
}
