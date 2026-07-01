"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { MODALITIES, PARTNERSHIP_STATUSES } from "@/lib/constants";
import { useVertical } from "@/components/vertical-context";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  ParceriasBoardView,
  ParceriasGalleryView,
  ParceriasTableView,
} from "@/components/parcerias/parcerias-views";
import type { ParceriaItem, ParceriaPartnership } from "@/components/parcerias/types";

const emptyPartnership = (): ParceriaPartnership => ({
  modality: null,
  agreedValue: null,
  valueLocked: false,
  courseName: null,
  courseReleased: false,
  couponCode: null,
  metaFeed: 0,
  metaStories: 0,
  metaTiktok: 0,
  metaYoutube: 0,
  startDate: null,
  legalCpf: null,
  legalAddress: null,
  bankDetails: null,
});

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Status" },
  { key: "program", label: "Vertical" },
  { key: "modality", label: "Modalidade" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "modality", label: "Modalidade" },
  { key: "program", label: "Vertical" },
];

const FILTER_OPTIONS: FilterOption[] = PARTNERSHIP_STATUSES.map((s) => ({ value: s, label: s }));

export function ParceriasClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("parcerias");

  const [list, setList] = useState<ParceriaItem[]>([]);
  const [editing, setEditing] = useState<ParceriaItem | null>(null);
  const [form, setForm] = useState<ParceriaItem | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    params.set("program", vertical);
    const res = await fetch(`/api/parcerias?${params}`);
    setList(await res.json());
  }

  useEffect(() => {
    load();
  }, [vertical]);

  function openEdit(a: ParceriaItem) {
    setEditing(a);
    setForm({
      ...a,
      partnership: a.partnership ? { ...a.partnership } : emptyPartnership(),
    });
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
  }

  async function saveEdit() {
    if (!form) return;
    setSaving(true);
    const p = form.partnership;
    await fetch(`/api/parcerias/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        whatsapp: form.whatsapp,
        status: form.status,
        alerts: form.alerts,
        modality: p?.modality,
        agreedValue: p?.agreedValue != null ? Number(p.agreedValue) : null,
        valueLocked: p?.valueLocked,
        courseName: p?.courseName,
        courseReleased: p?.courseReleased,
        couponCode: p?.couponCode,
        metaFeed: p?.metaFeed ?? 0,
        metaStories: p?.metaStories ?? 0,
        metaTiktok: p?.metaTiktok ?? 0,
        metaYoutube: p?.metaYoutube ?? 0,
        startDate: p?.startDate || null,
        legalCpf: p?.legalCpf || null,
        legalAddress: p?.legalAddress || null,
        bankDetails: p?.bankDetails || null,
      }),
    });
    setSaving(false);
    closeEdit();
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/parcerias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function encerrar(id: string) {
    if (!confirm("Encerrar parceria?")) return;
    await fetch(`/api/parcerias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "encerrar" }),
    });
    load();
  }

  async function handleBoardMove(id: string, newGroupKey: string) {
    const item = list.find((i) => i.id === id);
    if (!item) return;

    const gb = activeView.groupBy === "none" ? "status" : activeView.groupBy;

    if (gb === "status" && item.status !== newGroupKey) {
      await updateStatus(id, newGroupKey);
      return;
    }
    if (gb === "modality" && item.partnership?.modality !== newGroupKey && newGroupKey !== "—") {
      await fetch(`/api/parcerias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modality: newGroupKey }),
      });
      load();
    }
  }

  const filtered = useMemo(
    () =>
      applyViewPipeline(list, activeView, {
        searchText: (a) =>
          [a.fullName, a.instagram, a.email, a.whatsapp, a.alerts, a.partnership?.courseName]
            .filter(Boolean)
            .join(" "),
        getFilterStatus: (a) => a.status,
        defaultSortKey: "name",
        sorters: {
          name: (a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"),
          status: (a, b) => a.status.localeCompare(b.status, "pt-BR"),
          modality: (a, b) =>
            (a.partnership?.modality || "").localeCompare(b.partnership?.modality || "", "pt-BR"),
          program: (a, b) => a.program.localeCompare(b.program, "pt-BR"),
        },
      }),
    [list, activeView]
  );

  const p = form?.partnership;

  return (
    <div className="space-y-2">
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

      {activeView.type === "table" && (
        <ParceriasTableView
          items={filtered}
          groupBy={activeView.groupBy}
          onEdit={openEdit}
          onActivate={(id) => updateStatus(id, "Ativo")}
          onEncerrar={encerrar}
        />
      )}
      {activeView.type === "gallery" && (
        <ParceriasGalleryView
          items={filtered}
          groupBy={activeView.groupBy}
          onEdit={openEdit}
        />
      )}
      {activeView.type === "board" && (
        <ParceriasBoardView
          items={filtered}
          groupBy={activeView.groupBy}
          onEdit={openEdit}
          onMove={handleBoardMove}
        />
      )}

      {editing && form && p && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-hairline bg-card p-6 shadow-elev">
            <h2 className="mb-4 font-serif text-lg text-ink">Editar parceria — {form.fullName}</h2>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {PARTNERSHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>

              <label className="block text-xs font-medium text-muted-foreground">Modalidade</label>
              <Select
                value={p.modality || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partnership: { ...p, modality: e.target.value || null },
                  })
                }
              >
                <option value="">—</option>
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>

              {p.modality === "Remuneração" && (
                <>
                  <label className="block text-xs font-medium text-muted-foreground">Valor acordado (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={p.agreedValue ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, agreedValue: e.target.value ? Number(e.target.value) : null },
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      checked={p.valueLocked}
                      onChange={(e) =>
                        setForm({ ...form, partnership: { ...p, valueLocked: e.target.checked } })
                      }
                    />
                    Valor travado
                  </label>

                  <p className="pt-2 text-xs font-semibold uppercase text-muted-foreground">
                    Dados para termo (RPA)
                  </p>
                  <label className="block text-xs font-medium text-muted-foreground">CPF</label>
                  <Input
                    value={p.legalCpf || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, legalCpf: e.target.value || null },
                      })
                    }
                    placeholder="000.000.000-00"
                  />
                  <label className="block text-xs font-medium text-muted-foreground">
                    Endereço completo
                  </label>
                  <Textarea
                    rows={2}
                    value={p.legalAddress || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, legalAddress: e.target.value || null },
                      })
                    }
                  />
                  <label className="block text-xs font-medium text-muted-foreground">
                    Dados bancários
                  </label>
                  <Textarea
                    rows={3}
                    value={p.bankDetails || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, bankDetails: e.target.value || null },
                      })
                    }
                    placeholder={"Banco do Brasil: 001\nAgência: 322-0\nConta: 83061-5"}
                  />
                </>
              )}

              {p.modality === "Assinatura + Cupom" && (
                <>
                  <label className="block text-xs font-medium text-muted-foreground">Curso</label>
                  <Input
                    value={p.courseName || ""}
                    onChange={(e) =>
                      setForm({ ...form, partnership: { ...p, courseName: e.target.value || null } })
                    }
                  />
                  <label className="block text-xs font-medium text-muted-foreground">Cupom</label>
                  <Input
                    value={p.couponCode || ""}
                    onChange={(e) =>
                      setForm({ ...form, partnership: { ...p, couponCode: e.target.value || null } })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      checked={p.courseReleased}
                      onChange={(e) =>
                        setForm({ ...form, partnership: { ...p, courseReleased: e.target.checked } })
                      }
                    />
                    Curso liberado
                  </label>
                </>
              )}

              <p className="text-xs font-semibold uppercase text-muted-foreground">Metas mensais</p>
              <div className="grid grid-cols-2 gap-2">
                {(["metaFeed", "metaStories", "metaTiktok", "metaYoutube"] as const).map((field, i) => (
                  <div key={field}>
                    <label className="text-xs text-muted-foreground">
                      {["Feed", "Stories", "TikTok", "YouTube"][i]}
                    </label>
                    <Input
                      type="number"
                      value={p[field]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          partnership: { ...p, [field]: Number(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <label className="block text-xs font-medium text-muted-foreground">Início da parceria</label>
              <Input
                type="date"
                value={p.startDate ? p.startDate.slice(0, 10) : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partnership: {
                      ...p,
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    },
                  })
                }
              />

              <label className="block text-xs font-medium text-muted-foreground">Observações / alertas</label>
              <Textarea
                rows={3}
                value={form.alerts || ""}
                onChange={(e) => setForm({ ...form, alerts: e.target.value || null })}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeEdit}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
