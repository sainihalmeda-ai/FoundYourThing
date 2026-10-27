import type { Item } from "../types";

/** Feed search — matches title, details, place, category, reporter or status. */
export function matchesQuery(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    item.title,
    item.description,
    item.location,
    item.category_label,
    item.reporter_vtu_id,
    item.status,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

/** Open reports first; returned ones sink to the bottom (order otherwise kept). */
export function returnedLast(items: Item[]): Item[] {
  return [...items].sort(
    (a, b) => (a.status === "recovered" ? 1 : 0) - (b.status === "recovered" ? 1 : 0),
  );
}

/** Counts per key, most common first — for the desktop filter lists. */
export function countBy(items: Item[], key: (item: Item) => string): [string, number][] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(key(item), (counts.get(key(item)) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
