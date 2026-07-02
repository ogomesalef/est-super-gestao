export function groupItems<T>(
  items: T[],
  getKey: (item: T) => string,
  orderedKeys?: string[]
): Array<{ key: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item) || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  if (orderedKeys?.length) {
    const result: Array<{ key: string; items: T[] }> = [];
    const seen = new Set<string>();
    for (const k of orderedKeys) {
      result.push({ key: k, items: map.get(k) || [] });
      seen.add(k);
    }
    for (const [key, group] of map) {
      if (!seen.has(key)) result.push({ key, items: group });
    }
    return result;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([key, group]) => ({ key, items: group }));
}
