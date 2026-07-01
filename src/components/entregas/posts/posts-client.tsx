"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { MonthPicker } from "@/components/month-picker";
import { POST_ASSIGNMENT_STATUSES } from "@/lib/constants";
import { currentMonthRef } from "@/lib/utils";
import { useVertical } from "@/components/vertical-context";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { AssignDeliveryModal } from "./assign-delivery-modal";
import { PostsBoardView, PostsGalleryView, PostsTableView } from "./posts-views";
import { postAssignmentStatus, postTypeGroup, type PostDelivery } from "./types";

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Atribuição" },
  { key: "program", label: "Vertical" },
  { key: "modality", label: "Tipo de entrega" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "date", label: "Data" },
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
];

const FILTER_OPTIONS: FilterOption[] = POST_ASSIGNMENT_STATUSES.map((s) => ({ value: s, label: s }));

export function PostsClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("entregas-posts");

  const [monthRef, setMonthRef] = useState(currentMonthRef());
  const [allMonths, setAllMonths] = useState(false);
  const [posts, setPosts] = useState<PostDelivery[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [syncMeta, setSyncMeta] = useState<{ lastRow: number; lastSyncedAt: string | null } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [assignPost, setAssignPost] = useState<PostDelivery | null>(null);
  const [savingAssign, setSavingAssign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ program: vertical, limit: "500" });
    if (!allMonths && monthRef) params.set("monthRef", monthRef);
    try {
      const [deliveriesRes, syncRes] = await Promise.all([
        fetch(`/api/entregas/deliveries?${params}`, { cache: "no-store" }),
        fetch("/api/entregas/sync", { cache: "no-store" }),
      ]);
      const deliveriesRaw = await deliveriesRes.text();
      const data = deliveriesRaw ? JSON.parse(deliveriesRaw) : { deliveries: [], unassignedCount: 0 };
      if (!deliveriesRes.ok) {
        console.error(data.error || "Erro ao carregar posts");
        setPosts([]);
        setUnassignedCount(0);
      } else {
        setPosts(data.deliveries || []);
        setUnassignedCount(data.unassignedCount ?? 0);
      }
      if (syncRes.ok) {
        const syncRaw = await syncRes.text();
        if (syncRaw) setSyncMeta(JSON.parse(syncRaw));
      }
    } catch (e) {
      console.error(e);
      setPosts([]);
      setUnassignedCount(0);
    }
    setLoading(false);
  }, [monthRef, vertical, allMonths]);

  useEffect(() => {
    load();
  }, [load]);

  async function syncFromSheet(full = false) {
    setSyncing(true);
    const res = await fetch("/api/entregas/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full }),
    });
    const data = await res.json();
    setSyncing(false);
    if (!res.ok) {
      alert(data.error || "Erro ao sincronizar");
      return;
    }
    if (data.mode === "noop") {
      alert("Nenhuma linha nova na planilha desde o último sync.");
    } else {
      const parts = [
        `${data.created} novos`,
        data.updated ? `${data.updated} atualizados` : null,
        data.filteredOut ? `${data.filteredOut} fora de hoje (ignorados)` : null,
        `${data.unassigned} sem atribuição no total`,
      ].filter(Boolean);
      alert(`Sync (${data.mode}): ${parts.join(" · ")}`);
    }
    load();
  }

  async function assignAmbassador(ambassadorId: string) {
    if (!assignPost) return;
    setSavingAssign(true);
    const res = await fetch(`/api/entregas/deliveries/${assignPost.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ambassadorId }),
    });
    setSavingAssign(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao atribuir");
      return;
    }
    setAssignPost(null);
    load();
  }

  const filtered = useMemo(
    () =>
      applyViewPipeline(posts, activeView, {
        searchText: (p) =>
          [
            p.fullName,
            p.instagram,
            p.email,
            p.deliveryType,
            p.campaignName,
            p.ambassador?.fullName,
            p.ambassador?.instagram,
            postAssignmentStatus(p),
          ]
            .filter(Boolean)
            .join(" "),
        getFilterStatus: postAssignmentStatus,
        defaultSortKey: "date",
        sorters: {
          date: (a, b) =>
            new Date(b.postedAt || b.submittedAt).getTime() -
            new Date(a.postedAt || a.submittedAt).getTime(),
          name: (a, b) =>
            (a.ambassador?.fullName || a.fullName || "").localeCompare(
              b.ambassador?.fullName || b.fullName || "",
              "pt-BR"
            ),
          status: (a, b) => postAssignmentStatus(a).localeCompare(postAssignmentStatus(b), "pt-BR"),
          type: (a, b) => postTypeGroup(a).localeCompare(postTypeGroup(b), "pt-BR"),
        },
      }),
    [posts, activeView]
  );

  const unassignedInView = filtered.filter((p) => postAssignmentStatus(p) === "Sem atribuição").length;

  return (
    <div className="space-y-4">
      {unassignedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">
                {unassignedCount} post{unassignedCount !== 1 ? "s" : ""} sem embaixador atribuído
              </p>
              <p className="text-sm text-amber-900/80">
                Revise e atribua manualmente. Use a view &quot;Sem atribuição&quot; ou o quadro por
                atribuição.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const view = views.find((v) => v.filterStatus === "Sem atribuição");
              if (view) setActiveViewId(view.id);
            }}
          >
            Ver pendentes
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={monthRef} onChange={setMonthRef} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={allMonths}
            onChange={(e) => setAllMonths(e.target.checked)}
          />
          Todos os meses
        </label>
        <Button variant="secondary" onClick={() => syncFromSheet(false)} disabled={syncing}>
          {syncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sincronizar novos
        </Button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Importar a planilha inteira? Pode demorar vários minutos.")) {
              syncFromSheet(true);
            }
          }}
          className="text-xs text-muted-foreground underline hover:text-ink"
          disabled={syncing}
        >
          sync completo
        </button>
        {syncMeta?.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Último sync:{" "}
            {new Date(syncMeta.lastSyncedAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}{" "}
            · linha {syncMeta.lastRow}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando…" : `${posts.length} posts`}
          {!loading && unassignedInView > 0 && ` · ${unassignedInView} sem atribuição na view`}
        </p>
      </div>

      <ViewToolbar
        views={views}
        activeView={activeView}
        groupOptions={GROUP_OPTIONS}
        sortOptions={SORT_OPTIONS}
        filterOptions={FILTER_OPTIONS}
        onSelectView={setActiveViewId}
        onAddView={addView}
        onUpdateView={updateView}
        onRemoveView={removeView}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeView.type === "table" && (
            <PostsTableView items={filtered} groupBy={activeView.groupBy} onAssign={setAssignPost} />
          )}
          {activeView.type === "gallery" && (
            <PostsGalleryView items={filtered} groupBy={activeView.groupBy} onAssign={setAssignPost} />
          )}
          {activeView.type === "board" && (
            <PostsBoardView items={filtered} groupBy={activeView.groupBy} onAssign={setAssignPost} />
          )}
        </>
      )}

      <AssignDeliveryModal
        open={!!assignPost}
        post={assignPost}
        saving={savingAssign}
        onClose={() => setAssignPost(null)}
        onAssign={assignAmbassador}
      />
    </div>
  );
}
