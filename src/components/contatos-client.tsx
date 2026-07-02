"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { CONTACT_STATUSES, CONTACT_WORKING_STATUS } from "@/lib/constants";
import { useVertical } from "@/components/vertical-context";
import { VerticalBadge } from "@/components/vertical-badge";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { boardColumnOptionsFor } from "@/lib/view-system/board-columns";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import { groupItems } from "@/lib/view-system/group";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import {
  ContatoDetailModal,
  ContatoOutreachModal,
  type ContactDetail,
} from "@/components/contato-outreach-modal";
import { contactAlertLabel, isContactStale, isOutreachStatus } from "@/lib/contact-alerts";
import { DragBoard } from "@/components/views/drag-board";
import { resolveGroupOrder } from "@/lib/view-system/group-order";

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

const FILTER_OPTIONS: FilterOption[] = [
  ...CONTACT_STATUSES.map((s) => ({ value: s, label: s })),
  { value: "__contactStale__", label: "Refazer contato" },
];

function getKey(c: ContactDetail, groupBy: GroupByKey) {
  if (groupBy === "status") return c.status;
  if (groupBy === "vertical") return c.vertical || "—";
  return "Todos";
}

function contactLabel(c: ContactDetail) {
  return c.instagram || c.tiktok || "";
}

function ContactAlertBadge({ contact }: { contact: ContactDetail }) {
  const label = contactAlertLabel(contact);
  if (!label) return null;
  return (
    <span className="inline-flex rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-900">
      {label}
    </span>
  );
}

export function ContatosClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("contatos");

  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [newIg, setNewIg] = useState("");
  const [detailContact, setDetailContact] = useState<ContactDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [outreach, setOutreach] = useState<{
    contact: ContactDetail;
    kind: "first" | "followup";
    pendingStatus?: string;
  } | null>(null);

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

  async function saveContact(id: string, data: Partial<ContactDetail>) {
    setSaving(true);
    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setDetailContact(null);
    load();
  }

  async function confirmOutreach(payload: { notes?: string; nextFollowUpAt?: string | null }) {
    if (!outreach) return;
    setSaving(true);
    await fetch(`/api/contatos/${outreach.contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "outreach",
        notes: payload.notes,
        nextFollowUpAt: payload.nextFollowUpAt,
        status: outreach.pendingStatus,
      }),
    });
    setSaving(false);
    setOutreach(null);
    load();
  }

  function openOutreach(contact: ContactDetail, kind: "first" | "followup", pendingStatus?: string) {
    setOutreach({ contact, kind, pendingStatus });
    setDetailContact(null);
  }

  async function updateContactStatus(id: string, newStatus: string) {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    if (isOutreachStatus(newStatus) && contact.status !== newStatus) {
      openOutreach(
        contact,
        contact.contactAttempts > 0 || contact.status === CONTACT_WORKING_STATUS ? "followup" : "first",
        newStatus
      );
      return;
    }

    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  const filtered = useMemo(() => {
    let result = applyViewPipeline(contacts, activeView, {
      searchText: (c) => [c.instagram, c.tiktok, c.notes].filter(Boolean).join(" "),
      getFilterStatus: (c) => c.status,
      defaultSortKey: "name",
      sorters: {
        name: (a, b) => contactLabel(a).localeCompare(contactLabel(b), "pt-BR"),
        status: (a, b) => a.status.localeCompare(b.status, "pt-BR"),
        vertical: (a, b) => (a.vertical || "").localeCompare(b.vertical || "", "pt-BR"),
      },
    });

    if (activeView.filterStatus === "__contactStale__") {
      result = result.filter((c) => isContactStale(c));
    }

    return result;
  }, [contacts, activeView]);

  const groupBy = activeView.groupBy;
  const boardColumns = useMemo(
    () => boardColumnOptionsFor("contatos", groupBy),
    [groupBy]
  );
  const statusColumnOrder = resolveGroupOrder(
    CONTACT_STATUSES,
    activeView.groupOrder
  );
  const groups =
    groupBy === "none"
      ? [{ key: "Todos", items: filtered }]
      : groupItems(
          filtered,
          (c) => getKey(c, groupBy),
          groupBy === "status" ? statusColumnOrder : undefined
        );

  function renderCardActions(c: ContactDetail) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setDetailContact(c)}>
          Abrir
        </Button>
        {isContactStale(c) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openOutreach(c, "followup", CONTACT_WORKING_STATUS)}
          >
            Refazer
          </Button>
        )}
        {!c.ambassadorId && (
          <Button variant="ghost" size="sm" onClick={() => promote(c.id)}>
            Promover
          </Button>
        )}
        {c.ambassadorId && (
          <Link
            href={`/ambassadors/${c.ambassadorId}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver parceria
          </Link>
        )}
      </div>
    );
  }

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
        boardColumnOptions={activeView.type === "board" ? boardColumns : undefined}
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
        <DragBoard
          groups={groups.map((g) => ({ key: g.key, items: g.items }))}
          groupBy={groupBy === "none" ? "status" : groupBy}
          defaultColumnOrder={groupBy === "status" ? CONTACT_STATUSES : undefined}
          columnOrder={activeView.groupOrder}
          hiddenColumnKeys={activeView.hiddenGroups}
          onColumnOrderChange={(order) => updateView(activeView.id, { groupOrder: order })}
          onItemDrop={groupBy === "status" ? (id, key) => updateContactStatus(id, key) : undefined}
          getItemId={(c) => c.id}
          columnWidth="w-64"
          renderCard={(c) => (
            <div
              className={cn(
                "rounded-lg border border-hairline bg-white p-3 shadow-soft",
                isContactStale(c) && "border-orange-300 bg-orange-50/40"
              )}
            >
              <button type="button" className="w-full text-left" onClick={() => setDetailContact(c)}>
                <p className="text-sm font-medium">{contactLabel(c)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <NotionPill kind="status">{c.status}</NotionPill>
                  <ContactAlertBadge contact={c} />
                </div>
              </button>
              {renderCardActions(c)}
            </div>
          )}
        />
      )}

      {activeView.type === "gallery" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border border-hairline bg-white p-4 shadow-soft",
                isContactStale(c) && "border-orange-300 bg-orange-50/30"
              )}
            >
              <button type="button" className="w-full text-left" onClick={() => setDetailContact(c)}>
                <p className="font-medium">{contactLabel(c)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <NotionPill kind="vertical">{c.vertical}</NotionPill>
                  <NotionPill kind="status">{c.status}</NotionPill>
                  <ContactAlertBadge contact={c} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>
              </button>
              {renderCardActions(c)}
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
                      <td className="px-3 py-2 font-medium">
                        <button type="button" className="hover:underline" onClick={() => setDetailContact(c)}>
                          {contactLabel(c)}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <NotionPill kind="status">{c.status}</NotionPill>
                        <ContactAlertBadge contact={c} />
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">{c.notes}</td>
                      <td className="px-3 py-2">{renderCardActions(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <ContatoDetailModal
        contact={detailContact}
        saving={saving}
        onClose={() => setDetailContact(null)}
        onSave={(data) => (detailContact ? saveContact(detailContact.id, data) : Promise.resolve())}
        onOutreach={openOutreach}
      />

      <ContatoOutreachModal
        open={!!outreach}
        contact={outreach?.contact || null}
        kind={outreach?.kind || "first"}
        saving={saving}
        onClose={() => setOutreach(null)}
        onConfirm={confirmOutreach}
      />
    </div>
  );
}
