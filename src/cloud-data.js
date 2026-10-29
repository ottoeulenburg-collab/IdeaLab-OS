import { createInitialData } from "./data.js";

export const COLLECTIONS = ["tasks", "contacts", "expenses", "equipment"];
export function operationsBetween(before, after) {
  const operations = [];
  for (const key of COLLECTIONS) {
    const old = new Map(before[key].map((item) => [item.id, item]));
    const next = new Map(after[key].map((item) => [item.id, item]));
    for (const item of after[key])
      if (JSON.stringify(old.get(item.id)) !== JSON.stringify(item))
        operations.push({ collection: key, item });
    for (const item of before[key])
      if (!next.has(item.id)) operations.push({ collection: key, id: item.id });
  }
  const metadata = ({ event, checklist, people, shifts }) => ({
    event,
    checklist,
    people,
    shifts,
  });
  if (JSON.stringify(metadata(before)) !== JSON.stringify(metadata(after)))
    operations.push({ collection: "metadata", item: metadata(after) });
  return operations;
}
export function hasLocalContent(data) {
  return JSON.stringify(data) !== JSON.stringify(createInitialData());
}
