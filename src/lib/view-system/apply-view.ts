import type { SavedView } from "./types";

export type ViewPipelineConfig<T> = {
  searchText: (item: T) => string;
  getFilterStatus: (item: T) => string;
  sorters: Record<string, (a: T, b: T) => number>;
  defaultSortKey: string;
};

export function applyViewPipeline<T>(
  items: T[],
  view: SavedView,
  config: ViewPipelineConfig<T>
): T[] {
  let result = [...items];

  if (view.filterStatus) {
    result = result.filter((i) => config.getFilterStatus(i) === view.filterStatus);
  }

  const q = (view.search || "").trim().toLowerCase();
  if (q) {
    result = result.filter((i) => config.searchText(i).toLowerCase().includes(q));
  }

  const sortKey = view.sortKey || config.defaultSortKey;
  const sorter = config.sorters[sortKey];
  if (sorter) {
    const dir = view.sortDir === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => sorter(a, b) * dir);
  }

  return result;
}

export function normalizeView(v: Partial<SavedView>, fallbackSort = "name"): SavedView {
  return {
    id: v.id || `v_${Date.now()}`,
    name: v.name || "View",
    type: v.type || "table",
    groupBy: v.groupBy || "none",
    search: v.search ?? "",
    sortKey: v.sortKey || fallbackSort,
    sortDir: v.sortDir || "asc",
    filterStatus: v.filterStatus ?? "",
    groupOrder: Array.isArray(v.groupOrder) ? v.groupOrder : undefined,
    hiddenGroups: Array.isArray(v.hiddenGroups) ? v.hiddenGroups : undefined,
  };
}
