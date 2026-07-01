"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { CONTACT_STATUSES } from "@/lib/constants";
import { useVertical } from "@/components/vertical-context";
import { VerticalBadge } from "@/components/vertical-badge";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import { groupItems } from "@/lib/view-system/group";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type Contact = {
  id: string;
  vertical: string | null;
  status: string;
  instagram: string | null;
  tiktok: string | null;
  notes: string | null;
  ambassadorId: string | null;
};

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Status" },
  { key: "vertical", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Handle" },
  { key: "status", label: "Status" },
  { key: "vertical", label: "Vertical" },
];

const FILTER_OPTIONS: FilterOption[] = CONTACT_STATUSES.map((s) => ({ value: s, label: s }));

function getKey(c: Contact, groupBy: GroupByKey) {
  if (groupBy === "status") return c.status;
  if (groupBy === "vertical") return c.vertical || "—";
  return "Todos";
}

function contactLabel(c: Contact) {
  return c.instagram || c.tiktok || "";
}

export function ContatosClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("contatos");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newIg, setNewIg] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    params.set("vertical", vertical);
    const res = await fetch(`/api/contatos?${params}`);
    setContacts(await res.json());
  }

  useEffect(() => {
    load();
  }, [vertical]);

  async function addContact() {
    await fetch("/api/contatos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "instagram", vertical, handle: newIg }),
    });
    setNewIg("");
    load();
  }

  async function promote(id: string) {
    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promote" }),
    });
    load();
  }

  async function updateContactStatus(id: string, newStatus: string) {
    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  const filtered = useMemo(
    () =>
      applyViewPipeline(contacts, activeView, {
        searchText: (c) => [c.instagram, c.tiktok, c.notes].filter(Boolean).join(" "),
        getFilterStatus: (c) => c.status,
        defaultSortKey: "name",
        sorters: {
          name: (a, b) => contactLabel(a).localeCompare(contactLabel(b), "pt-BR"),
          status: (a, b) => a.status.localeCompare(b.status, "pt-BR"),
          vertical: (a, b) => (a.vertical || "").localeCompare(b.vertical || "", "pt-BR"),
        },
      }),
    [contacts, activeView]
  );

  const groupBy = activeView.groupBy;
  const groups =
    groupBy === "none"
      ? [{ key: "Todos", items: filtered }]
      : groupItems(
          filtered,
          (c) => getKey(c, groupBy),
          groupBy === "status" ? [...CONTACT_STATUSES] : undefined
        );

  return (
    <div className="space-y-4">
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

      <div
        className={cn(
          "flex gap-2 rounded-xl border-2 bg-card p-3 shadow-soft",
          vertical === "OAB" ? "border-oab/25" : "border-ecj/30"
        )}
      >
        <Input placeholder="@instagram" value={newIg} onChange={(e) => setNewIg(e.target.value)} />
        <VerticalBadge vertical={vertical} className="shrink-0 self-center" />
        <Button onClick={addContact} disabled={!newIg.trim()}>
          Adicionar
        </Button>
      </div>

      {filtered.length !== contacts.length && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {contacts.length} contatos na view
        </p>
      )}

      {activeView.type === "board" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {groups.map((group) => (
            <div
              key={group.key}
              className="w-64 shrink-0 rounded-xl bg-surface/60 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id && groupBy === "status") updateContactStatus(id, group.key);
                setDragId(null);
              }}
            >
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-semibold",
                    groupHeaderColor(group.key, "status")
                  )}
                >
                  {group.key}
                </span>
                <span className="text-xs text-muted-foreground">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.id);
                      setDragId(c.id);
                    }}
                    className={cn(
                      "cursor-grab rounded-lg border border-hairline bg-white p-3 shadow-soft",
                      dragId === c.id && "opacity-50"
                    )}
                  >
                    <p className="text-sm font-medium">{contactLabel(c)}</p>
                    <NotionPill kind="status">{c.status}</NotionPill>
                    {!c.ambassadorId && (
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => promote(c.id)}>
                        Promover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView.type === "gallery" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-hairline bg-white p-4 shadow-soft">
              <p className="font-medium">{contactLabel(c)}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <NotionPill kind="vertical">{c.vertical}</NotionPill>
                <NotionPill kind="status">{c.status}</NotionPill>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>
            </div>
          ))}
        </div>
      )}

      {activeView.type === "table" && (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.key} className="overflow-hidden rounded-xl border border-hairline bg-white shadow-soft">
              {groupBy !== "none" && (
                <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className={cn("rounded px-2 py-0.5 text-sm", groupHeaderColor(group.key, groupBy))}>
                    {group.key}
                  </span>
                  <span className="text-xs text-muted-foreground">{group.items.length}</span>
                </div>
              )}
              <table className="min-w-full text-sm">
                <tbody>
                  {group.items.map((c) => (
                    <tr key={c.id} className={cn("border-t border-hairline/60", verticalRowClass(c.vertical))}>
                      <td className="px-3 py-2 font-medium">{contactLabel(c)}</td>
                      <td className="px-3 py-2">
                        <NotionPill kind="status">{c.status}</NotionPill>
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">{c.notes}</td>
                      <td className="px-3 py-2">
                        {!c.ambassadorId && (
                          <Button variant="secondary" size="sm" onClick={() => promote(c.id)}>
                            Promover
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
