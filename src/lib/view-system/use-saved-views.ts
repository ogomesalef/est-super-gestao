"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeView } from "./apply-view";
import type { GroupByKey, SavedView, ViewsState, ViewType } from "./types";

function uid() {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createView(
  name: string,
  type: ViewType,
  groupBy: GroupByKey = "status",
  extras?: Partial<Pick<SavedView, "search" | "sortKey" | "sortDir" | "filterStatus" | "groupOrder" | "hiddenGroups">>
): SavedView {
  return normalizeView(
    { id: uid(), name, type, groupBy, ...extras },
    extras?.sortKey || "name"
  );
}

export function defaultViewsFor(databaseId: string): SavedView[] {
  if (databaseId === "parcerias") {
    return [
      createView("Pipeline", "board", "status"),
      createView("Analisar candidatos", "table", "status", {
        filterStatus: "__needsReview__",
        sortKey: "applicationReceivedAt",
        sortDir: "desc",
      }),
      createView("Cobrar proposta", "table", "status", {
        filterStatus: "__proposalStale__",
        sortKey: "name",
      }),
      createView("Tabela", "table", "status"),
      createView("Cards", "gallery", "modality"),
    ];
  }
  if (databaseId === "contatos") {
    return [
      createView("Pipeline", "board", "status"),
      createView("Refazer contato", "table", "status", {
        filterStatus: "__contactStale__",
        sortKey: "name",
      }),
      createView("Tabela", "table", "status"),
      createView("Cards", "gallery", "vertical"),
    ];
  }
  if (databaseId === "entregas-posts" || databaseId === "entregas-posts-v2") {
    return [
      createView("Recentes", "table", "none", {
        sortKey: "syncedAt",
        sortDir: "desc",
      }),
      createView("Sem atribuição", "table", "status", {
        filterStatus: "Sem atribuição",
        sortKey: "date",
        sortDir: "desc",
      }),
      createView("Quadro", "board", "status"),
      createView("Tabela", "table", "none", { sortKey: "date", sortDir: "desc" }),
      createView("Cards", "gallery", "program"),
    ];
  }
  if (databaseId === "entregas") {
    return [
      createView("Pendências", "table", "status", {
        filterStatus: "Pendente",
        sortKey: "pct",
        sortDir: "asc",
      }),
      createView("Pipeline", "board", "status"),
      createView("Tabela", "table", "none"),
      createView("Cards", "gallery", "program"),
    ];
  }
  if (databaseId === "financeiro") {
    return [
      createView("Pipeline", "board", "status"),
      createView("A pagar", "table", "status", {
        filterStatus: "Pronto para enviar ao Financeiro",
      }),
      createView("Tabela", "table", "status"),
      createView("Cards", "gallery", "program"),
    ];
  }
  if (databaseId === "campanhas") {
    return [
      createView("Cards", "gallery", "status"),
      createView("Pipeline", "board", "status"),
      createView("Tabela", "table", "program"),
    ];
  }
  if (databaseId === "relatorios") {
    return [
      createView("Tabela", "table", "none"),
      createView("Cards", "gallery", "modality"),
      createView("Quadro", "board", "modality"),
    ];
  }
  return [createView("Tabela", "table", "none")];
}

function pickMobileDefaultViewId(views: SavedView[]): string {
  const gallery = views.find((v) => v.type === "gallery");
  if (gallery) return gallery.id;
  const board = views.find((v) => v.type === "board");
  if (board) return board.id;
  return views[0].id;
}

function normalizeState(parsed: ViewsState, databaseId: string): ViewsState {
  const fallbackSort = databaseId === "entregas" || databaseId === "financeiro" ? "name" : "name";
  const views = parsed.views.map((v) => normalizeView(v, fallbackSort));
  const activeViewId = views.some((v) => v.id === parsed.activeViewId)
    ? parsed.activeViewId
    : views[0].id;
  return { views, activeViewId };
}

function loadViewsState(databaseId: string): ViewsState {
  const defaults = defaultViewsFor(databaseId);
  if (typeof window === "undefined") {
    return { views: defaults, activeViewId: defaults[0].id };
  }
  try {
    const raw = localStorage.getItem(`super-views:${databaseId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as ViewsState;
      if (parsed.views?.length && parsed.activeViewId) {
        return normalizeState(parsed, databaseId);
      }
    }
    if (window.matchMedia("(max-width: 639px)").matches) {
      return { views: defaults, activeViewId: pickMobileDefaultViewId(defaults) };
    }
  } catch {
    /* ignore */
  }
  return { views: defaults, activeViewId: defaults[0].id };
}

export function useSavedViews(databaseId: string) {
  const storageKey = `super-views:${databaseId}`;
  const defaults = useMemo(() => defaultViewsFor(databaseId), [databaseId]);

  const [state, setState] = useState<ViewsState>(() => loadViewsState(databaseId));

  useEffect(() => {
    setState(loadViewsState(databaseId));
  }, [storageKey, databaseId]);

  function persist(next: ViewsState) {
    setState(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const activeView =
    state.views.find((v) => v.id === state.activeViewId) || state.views[0];

  function setActiveViewId(id: string) {
    persist({ ...state, activeViewId: id });
  }

  function addView() {
    const base = activeView || defaults[0];
    const copy = createView(`${base.name} (cópia)`, base.type, base.groupBy, {
      search: base.search,
      sortKey: base.sortKey,
      sortDir: base.sortDir,
      filterStatus: base.filterStatus,
      groupOrder: base.groupOrder,
      hiddenGroups: base.hiddenGroups,
    });
    persist({
      views: [...state.views, copy],
      activeViewId: copy.id,
    });
  }

  function updateView(id: string, patch: Partial<SavedView>) {
    persist({
      ...state,
      views: state.views.map((v) => (v.id === id ? normalizeView({ ...v, ...patch }, v.sortKey) : v)),
    });
  }

  function removeView(id: string) {
    if (state.views.length <= 1) return;
    const views = state.views.filter((v) => v.id !== id);
    persist({
      views,
      activeViewId: state.activeViewId === id ? views[0].id : state.activeViewId,
    });
  }

  return {
    views: state.views,
    activeView,
    setActiveViewId,
    addView,
    updateView,
    removeView,
  };
}
