import React, { useState } from "react";
import { money, sumMoney, uid } from "../utils.js";
import {
  amountRecorded,
  saveBudgetAmount,
  clearBudgetAmount,
} from "../budget.js";
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

function ExpenseForm({ expense, store, onClose, mode }) {
  const [baseline] = useState(
    () => store.data.expenses.find((x) => x.id === expense?.id) || null,
  );
  const [form, setForm] = useState(
    expense || {
      id: uid(),
      category: "",
      planned: 0,
      actual: 0,
      plannedRecorded: false,
      actualRecorded: false,
      note: "",
    },
  );
  const [amount, setAmount] = useState(() =>
    expense && amountRecorded(expense, mode) ? expense[mode] : "",
  );
  const label = mode === "planned" ? "Planbetrag" : "Tatsächliche Ausgabe";
  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <Modal
      title={`${label} ${expense?.category ? "bearbeiten" : "erfassen"}`}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await store.upsert(
              "expenses",
              saveBudgetAmount(
                {
                  ...form,
                  category: form.category.trim(),
                  note: form.note.trim(),
                },
                mode,
                Number(amount),
              ),
              baseline,
            )
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
        <Field label={`${label} (€)`}>
          <input
            type="number"
            min="0"
            max="1000000000"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <p className="form-note">
          {mode === "planned"
            ? "Hier planst du die Kosten. Tatsächliche Ausgaben kannst du später separat erfassen."
            : "Hier erfasst du nur die tatsächlich angefallenen Kosten. Der Planbetrag bleibt unverändert."}
        </p>
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
  const [mode, setMode] = useState("planned");
  const [editor, setEditor] = useState(null),
    [budgetOpen, setBudgetOpen] = useState(false),
    [budgetRevision, setBudgetRevision] = useState(store.revision),
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
            setBudgetRevision(store.revision);
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
      <div className="budget-toolbar">
        <div className="view-switch" role="group" aria-label="Budgetansicht">
          <button
            type="button"
            className={mode === "planned" ? "selected" : ""}
            aria-pressed={mode === "planned"}
            onClick={() => setMode("planned")}
          >
            Planung
          </button>
          <button
            type="button"
            className={mode === "actual" ? "selected" : ""}
            aria-pressed={mode === "actual"}
            onClick={() => setMode("actual")}
          >
            Tatsächliche Ausgaben
          </button>
        </div>
        <Button
          icon="plus"
          onClick={() =>
            setEditor({
              id: uid(),
              category: "",
              planned: 0,
              actual: 0,
              plannedRecorded: false,
              actualRecorded: false,
              note: "",
            })
          }
        >
          {mode === "planned" ? "Planbetrag hinzufügen" : "Ausgabe hinzufügen"}
        </Button>
      </div>
      <p className="page-footnote">
        {mode === "planned"
          ? "Plane eure Kosten unabhängig von den tatsächlichen Ausgaben."
          : "Trage Ausgaben unabhängig ein. Bei einem geplanten Posten kannst du über den Stift die tatsächlichen Kosten ergänzen."}
      </p>
      <div className="table-panel budget-table">
        <table>
          <thead>
            <tr>
              <th>Kategorie</th>
              <th className="numeric">
                {mode === "planned" ? "Planbetrag" : "Tatsächliche Ausgabe"}
              </th>
              {mode === "actual" ? (
                <>
                  <th className="numeric">Planbetrag</th>
                  <th className="numeric">Abweichung</th>
                </>
              ) : null}
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
                <td
                  data-label={
                    mode === "planned" ? "Planbetrag" : "Tatsächliche Ausgabe"
                  }
                  className="numeric"
                >
                  {amountRecorded(e, mode) ? (
                    <strong>{money(e[mode])}</strong>
                  ) : (
                    <span className="muted">Noch nicht erfasst</span>
                  )}
                </td>
                {mode === "actual" ? (
                  <>
                    <td data-label="Planbetrag" className="numeric">
                      {amountRecorded(e, "planned") ? money(e.planned) : "–"}
                    </td>
                    <td
                      data-label="Abweichung"
                      className={`numeric ${e.actual > e.planned ? "orange" : "green"}`}
                    >
                      {amountRecorded(e, "planned") &&
                      amountRecorded(e, "actual")
                        ? `${e.actual > e.planned ? "+" : ""}${money(Math.round((e.actual - e.planned) * 100) / 100)}`
                        : "–"}
                    </td>
                  </>
                ) : null}
                <td data-label="Notizen" className="muted budget-note">
                  {e.note || "–"}
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton
                      icon="edit"
                      label={`${mode === "planned" ? "Planbetrag" : "Ausgabe"} bearbeiten: ${e.category}`}
                      onClick={() => setEditor(e)}
                    />
                    {amountRecorded(e, mode) ||
                    (!amountRecorded(e, "planned") &&
                      !amountRecorded(e, "actual")) ? (
                      <IconButton
                        icon="trash"
                        label={`${mode === "planned" ? "Planbetrag" : "Ausgabe"} löschen: ${e.category}`}
                        onClick={async () => {
                          if (
                            await confirm(
                              `${mode === "planned" ? "Planbetrag" : "Tatsächliche Ausgabe"} für „${e.category}“ löschen? Ein Betrag in der anderen Ansicht bleibt erhalten.`,
                            )
                          ) {
                            const next = clearBudgetAmount(e, mode);
                            if (next) await store.upsert("expenses", next, e);
                            else await store.remove("expenses", e.id);
                          }
                        }}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Gesamt</td>
              <td
                className="numeric"
                data-summary={
                  mode === "planned" ? "Planbetrag" : "Tatsächliche Ausgabe"
                }
              >
                {money(mode === "planned" ? planned : actual)}
              </td>
              {mode === "actual" ? (
                <>
                  <td className="numeric" data-summary="Planbetrag">
                    {money(planned)}
                  </td>
                  <td
                    className={`numeric ${actual > planned ? "orange" : "green"}`}
                    data-summary="Abweichung"
                  >
                    {expenses.length &&
                    expenses.every(
                      (e) =>
                        amountRecorded(e, "planned") &&
                        amountRecorded(e, "actual"),
                    )
                      ? `${actual > planned ? "+" : ""}${money(Math.round((actual - planned) * 100) / 100)}`
                      : "–"}
                  </td>
                </>
              ) : null}
              <td colSpan="2" />
            </tr>
          </tfoot>
        </table>
        {!expenses.length ? (
          <Empty
            title={
              mode === "planned"
                ? "Deine Budgetplanung beginnt hier"
                : "Noch keine Ausgaben erfasst"
            }
          >
            {mode === "planned"
              ? "Lege deinen ersten Planbetrag an."
              : "Erfasse eine Ausgabe – auch ohne vorherige Planung."}
            <Button
              onClick={() =>
                setEditor({
                  id: uid(),
                  category: "",
                  planned: 0,
                  actual: 0,
                  plannedRecorded: false,
                  actualRecorded: false,
                  note: "",
                })
              }
            >
              {mode === "planned"
                ? "Ersten Planbetrag hinzufügen"
                : "Erste Ausgabe hinzufügen"}
            </Button>
          </Empty>
        ) : null}
      </div>
      <p className="page-footnote">
        Nicht erfasste Beträge sind mit „Noch nicht erfasst“ markiert und zählen
        nicht als Ausgabe. Abweichungen werden erst gezeigt, wenn beide Beträge
        erfasst sind. Restbudget = Gesamtbudget minus tatsächliche Ausgaben.
      </p>
      {creating || editor ? (
        <ExpenseForm
          mode={mode}
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
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await store.commit(
                  {
                    ...store.data,
                    event: { ...event, budget: Number(totalInput) },
                  },
                  false,
                  budgetRevision,
                )
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
