"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { useVertical } from "@/components/vertical-context";
import { VERTICALS } from "@/lib/constants";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { boardColumnOptionsFor } from "@/lib/view-system/board-columns";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  CampanhasBoardView,
  CampanhasGalleryView,
  CampanhasTableView,
} from "@/components/campanhas/campanhas-views";
import { CAMPAIGN_STATUSES, type CampaignItem } from "@/components/campanhas/types";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Status" },
  { key: "program", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "start", label: "Início" },
  { key: "program", label: "Vertical" },
];

const FILTER_OPTIONS: FilterOption[] = CAMPAIGN_STATUSES.map((s) => ({ value: s, label: s }));

type FormState = {
  name: string;
  program: string;
  startDate: string;
  endDate: string;
  pageUrl: string;
  description: string;
};

const emptyForm = (program: string): FormState => ({
  name: "",
  program,
  startDate: "",
  endDate: "",
  pageUrl: "",
  description: "",
});

export function CampanhasClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("campanhas");

  const [list, setList] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CampaignItem | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(vertical));
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/campanhas", { cache: "no-store" });
      const text = await res.text();
      if (!res.ok || !text.trim()) {
        let message = "Erro ao carregar campanhas";
        try {
          message = JSON.parse(text).error || message;
        } catch {
          /* ignore */
        }
        console.error(message);
        return;
      }
      setList(JSON.parse(text));
    } catch (e) {
      console.error("Erro ao carregar campanhas", e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(vertical));
    setShowForm(true);
  }

  function openEdit(c: CampaignItem) {
    setEditing(c);
    setForm({
      name: c.name,
      program: c.program || vertical,
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      endDate: c.endDate ? c.endDate.slice(0, 10) : "",
      pageUrl: c.pageUrl || "",
      description: c.description || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      program: form.program || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      pageUrl: form.pageUrl || null,
      description: form.description || null,
      formLabel: form.name.trim(),
    };

    if (editing) {
      await fetch(`/api/campanhas/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/campanhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    closeForm();
    load();
  }

  async function generateFolder(id: string) {
    setLoading(id + "folder");
    const res = await fetch(`/api/campanhas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generateFolder" }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      alert(data.error || "Erro ao gerar pasta");
      return;
    }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta campanha?")) return;
    setLoading(id + "delete");
    await fetch(`/api/campanhas/${id}`, { method: "DELETE" });
    setLoading(null);
    load();
  }

  const filtered = useMemo(
    () =>
      applyViewPipeline(list, activeView, {
        searchText: (c) =>
          [c.name, c.description, c.program, c.effectiveStatus].filter(Boolean).join(" "),
        getFilterStatus: (c) => c.effectiveStatus,
        defaultSortKey: "start",
        sorters: {
          name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
          status: (a, b) => a.effectiveStatus.localeCompare(b.effectiveStatus, "pt-BR"),
          start: (a, b) => (a.startDate || "").localeCompare(b.startDate || ""),
          program: (a, b) => (a.program || "").localeCompare(b.program || "", "pt-BR"),
        },
      }),
    [list, activeView]
  );

  const activeCount = list.filter((c) => c.effectiveStatus === "Ativa").length;
  const scheduledCount = list.filter((c) => c.effectiveStatus === "Agendada").length;
  const boardColumns = useMemo(
    () => boardColumnOptionsFor("campanhas", activeView.groupBy),
    [activeView.groupBy]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            <strong className="text-ink">{activeCount}</strong> ativas
          </span>
          <span>·</span>
          <span>
            <strong className="text-ink">{scheduledCount}</strong> agendadas
          </span>
          <span>·</span>
          <span>{list.length} total</span>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova campanha
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Com datas de início e fim, a campanha fica <strong>Ativa</strong> ou{" "}
        <strong>Encerrada</strong> automaticamente. Ao ativar, a pasta Drive é criada em{" "}
        <code className="text-[0.65rem]">_CAMPANHAS</code> e o Form de entregas é sincronizado via
        Apps Script (<code className="text-[0.65rem]">CAM_SYNC_FORM_CHOICES</code>).
      </p>

      {showForm && (
        <div
          className={cn(
            "rounded-xl border-2 bg-card p-4 shadow-soft",
            form.program === "ECJ" ? "border-ecj/30" : "border-oab/25"
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg text-ink">
                {editing ? "Editar campanha" : "Nova campanha"}
              </h2>
              <div className="mt-1">
                <VerticalBadge vertical={form.program} />
              </div>
            </div>
            <button type="button" onClick={closeForm} className="rounded-md p-1.5 hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Nome</span>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Semana Nacional dos Concursos Jurídicos"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Vertical</span>
              <Select
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
              >
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Página (opcional)
              </span>
              <Input
                value={form.pageUrl}
                onChange={(e) => setForm({ ...form, pageUrl: e.target.value })}
                placeholder="https://..."
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Início do período
              </span>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Fim do período
              </span>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Descrição (opcional)
              </span>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      )}

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

      {activeView.type === "table" && (
        <CampanhasTableView
          items={filtered}
          groupBy={activeView.groupBy}
          loading={loading}
          onEdit={openEdit}
          onGenerateFolder={generateFolder}
          onDelete={remove}
        />
      )}
      {activeView.type === "gallery" && (
        <CampanhasGalleryView
          items={filtered}
          groupBy={activeView.groupBy}
          loading={loading}
          onEdit={openEdit}
          onGenerateFolder={generateFolder}
          onDelete={remove}
        />
      )}
      {activeView.type === "board" && (
        <CampanhasBoardView
          items={filtered}
          groupBy={activeView.groupBy}
          columnOrder={activeView.groupOrder}
          hiddenColumnKeys={activeView.hiddenGroups}
          onColumnOrderChange={(order) => updateView(activeView.id, { groupOrder: order })}
          loading={loading}
          onEdit={openEdit}
          onGenerateFolder={generateFolder}
          onDelete={remove}
        />
      )}
    </div>
  );
}
