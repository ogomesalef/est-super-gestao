export function resolveGroupOrder(
  defaultKeys: readonly string[],
  customOrder: string[] | undefined,
  extraKeys: string[] = []
): string[] {
  const base = customOrder?.length ? [...customOrder] : [...defaultKeys];
  const seen = new Set(base);
  for (const k of defaultKeys) {
    if (!seen.has(k)) {
      base.push(k);
      seen.add(k);
    }
  }
  for (const k of extraKeys) {
    if (!seen.has(k)) {
      base.push(k);
      seen.add(k);
    }
  }
  return base;
}

export function reorderGroupKeys(order: string[], draggedKey: string, targetKey: string): string[] {
  if (draggedKey === targetKey) return order;
  const from = order.indexOf(draggedKey);
  const to = order.indexOf(targetKey);
  if (from < 0 || to < 0) return order;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, draggedKey);
  return next;
}
