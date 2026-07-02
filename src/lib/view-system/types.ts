export type ViewType = "table" | "gallery" | "board";

export type GroupByKey = "none" | "status" | "program" | "modality" | "vertical";

export type SortDir = "asc" | "desc";

export type SavedView = {
  id: string;
  name: string;
  type: ViewType;
  groupBy: GroupByKey;
  search: string;
  sortKey: string;
  sortDir: SortDir;
  filterStatus: string;
  /** Ordem das colunas no quadro (arrastar cabeçalho). */
  groupOrder?: string[];
  /** Colunas ocultas no quadro (estilo Notion). */
  hiddenGroups?: string[];
};

export type ViewsState = {
  views: SavedView[];
  activeViewId: string;
};

export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
  table: "Tabela",
  gallery: "Cards",
  board: "Quadro",
};

export type SortOption = { key: string; label: string };
export type FilterOption = { value: string; label: string };
