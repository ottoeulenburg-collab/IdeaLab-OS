export const ASSIGNMENTS = ["Orga – Otto", "Orga – Anton", "Tech"];
export function normalizeAssignment(owner) {
  if (owner === "Otto" || owner === "Anton") return `Orga – ${owner}`;
  return ASSIGNMENTS.includes(owner) ? owner : "";
}
export function migrateTask(task) {
  const owner = normalizeAssignment(task.owner);
  return {
    ...task,
    owner,
    ...(task.owner && !owner ? { legacyOwner: task.owner } : {}),
  };
}
