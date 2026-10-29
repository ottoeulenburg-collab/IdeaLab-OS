// Legacy zero values often represented an amount not yet entered. Explicit
// flags distinguish a recorded 0 € from an amount that is still unknown.
export function amountRecorded(expense, field) {
  return expense[`${field}Recorded`] ?? expense[field] > 0;
}

export function saveBudgetAmount(expense, field, amount) {
  return {
    ...expense,
    plannedRecorded: amountRecorded(expense, "planned"),
    actualRecorded: amountRecorded(expense, "actual"),
    [field]: amount,
    [`${field}Recorded`]: true,
  };
}

export function clearBudgetAmount(expense, field) {
  const other = field === "planned" ? "actual" : "planned";
  if (!amountRecorded(expense, other)) return null;
  return { ...expense, [field]: 0, [`${field}Recorded`]: false };
}
