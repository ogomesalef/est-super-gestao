"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal, Pin, PinOff, StickyNote, Trash2, X } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import type { AmbassadorQuickNote } from "@/lib/ambassador-quick-notes";
import { pinnedCardNotes } from "@/lib/ambassador-quick-notes";
import { cn } from "@/lib/utils";

type QuickNoteActions = {
  onCreate: (text: string, pinned?: boolean) => Promise<void>;
  onUpdate: (noteId: string, patch: Partial<Pick<AmbassadorQuickNote, "text" | "pinned" | "completed">>) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
};

export function useQuickNoteActions(
  ambassadorId: string,
  onChanged?: () => void
): QuickNoteActions {
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const onCreate = useCallback(
    async (text: string, pinned = false) => {
      await fetch(`/api/ambassadors/${ambassadorId}/quick-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, pinned }),
      });
      onChangedRef.current?.();
    },
    [ambassadorId]
  );

  const onUpdate = useCallback(
    async (noteId: string, patch: Partial<Pick<AmbassadorQuickNote, "text" | "pinned" | "completed">>) => {
      await fetch(`/api/ambassadors/${ambassadorId}/quick-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      onChangedRef.current?.();
    },
    [ambassadorId]
  );

  const onDelete = useCallback(
    async (noteId: string) => {
      await fetch(`/api/ambassadors/${ambassadorId}/quick-notes/${noteId}`, { method: "DELETE" });
      onChangedRef.current?.();
    },
    [ambassadorId]
  );

  return { onCreate, onUpdate, onDelete };
}

function QuickNoteAddPopover({
  x,
  y,
  ambassadorName,
  onClose,
  onSubmit,
}: {
  x: number;
  y: number;
  ambassadorName: string;
  onClose: () => void;
  onSubmit: (text: string, pinned: boolean) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit(trimmed, pinned);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const style: React.CSSProperties = {
    left: Math.min(x, window.innerWidth - 320),
    top: Math.min(y, window.innerHeight - 280),
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <form
        onSubmit={handleSubmit}
        className="fixed z-50 w-72 rounded-xl border border-hairline bg-card p-3 shadow-elev"
        style={style}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink">Nota — {ambassadorName}</p>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-surface">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: falta cupom e curso liberado"
          rows={3}
          className="text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="rounded border-hairline"
          />
          Fixar no card do board
        </label>
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={!text.trim() || saving}>
            Salvar
          </Button>
        </div>
      </form>
    </>
  );
}

export function QuickNoteContextTarget({
  ambassadorId,
  ambassadorName,
  children,
  className,
  onChanged,
}: {
  ambassadorId: string;
  ambassadorName: string;
  children: React.ReactNode;
  className?: string;
  onChanged?: () => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [addOpen, setAddOpen] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actions = useQuickNoteActions(ambassadorId, onChanged);

  function openMenuAt(x: number, y: number) {
    setMenu({
      x: Math.min(x, window.innerWidth - 200),
      y: Math.min(y, window.innerHeight - 120),
    });
  }

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    openMenuAt(e.clientX, e.clientY);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      openMenuAt(touch.clientX, touch.clientY);
    }, 500);
  }

  return (
    <div
      className={cn("relative", className)}
      onContextMenu={openMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPress}
      onTouchMove={clearLongPress}
      onTouchCancel={clearLongPress}
    >
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openMenuAt(rect.right - 8, rect.bottom);
        }}
        className="absolute right-2 top-2 flex min-h-9 min-w-9 items-center justify-center rounded-md bg-white/90 text-muted-foreground shadow-hairline hover:bg-surface hover:text-ink lg:hidden"
        aria-label="Ações de nota rápida"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu(null);
            }}
          />
          <div
            className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-hairline bg-card py-1 shadow-elev"
            style={{ left: menu.x, top: menu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
              onClick={() => {
                setAddOpen(menu);
                setMenu(null);
              }}
            >
              <StickyNote className="h-4 w-4 text-primary" />
              Nova nota rápida
            </button>
          </div>
        </>
      )}
      {addOpen && (
        <QuickNoteAddPopover
          x={addOpen.x}
          y={addOpen.y}
          ambassadorName={ambassadorName}
          onClose={() => setAddOpen(null)}
          onSubmit={actions.onCreate}
        />
      )}
    </div>
  );
}

export function QuickNoteCardBadges({ notes }: { notes?: AmbassadorQuickNote[] }) {
  const pinned = pinnedCardNotes(notes || []);
  if (!pinned.length) return null;

  return (
    <div className="space-y-1">
      {pinned.map((note) => (
        <div
          key={note.id}
          className="flex items-start gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-950"
        >
          <Pin className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
          <span className="line-clamp-3">{note.text}</span>
        </div>
      ))}
    </div>
  );
}

function QuickNoteItem({
  note,
  actions,
  compact,
}: {
  note: AmbassadorQuickNote;
  actions: QuickNoteActions;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "group rounded-lg border border-hairline bg-white/90 px-3 py-2 shadow-soft backdrop-blur-sm",
        note.completed && "opacity-60",
        compact && "text-xs"
      )}
    >
      <p className={cn("text-sm text-ink", note.completed && "line-through text-muted-foreground")}>
        {note.text}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {!note.completed && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => actions.onUpdate(note.id, { completed: true }))}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-success hover:bg-success/10"
          >
            <Check className="h-3 w-3" />
            Concluir
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => actions.onUpdate(note.id, { pinned: !note.pinned }))}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-surface hover:text-ink"
        >
          {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          {note.pinned ? "Desfixar" : "Fixar no card"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => actions.onDelete(note.id))}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          Excluir
        </button>
      </div>
    </div>
  );
}

export function QuickNotesFloatingPanel({
  ambassadorId,
  ambassadorName,
  notes,
  onChanged,
  onReload,
}: {
  ambassadorId: string;
  ambassadorName: string;
  notes: AmbassadorQuickNote[];
  onChanged?: () => void;
  onReload: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const actions = useQuickNoteActions(ambassadorId, () => {
    onChanged?.();
    onReload();
  });

  const openNotes = notes.filter((n) => !n.completed);
  const completedNotes = notes.filter((n) => n.completed);

  if (!openNotes.length && !completedNotes.length && !addOpen) {
    return (
      <div className="safe-bottom fixed bottom-6 right-6 z-30 max-w-[calc(100vw-2rem)]">
        <Button size="sm" onClick={() => setAddOpen(true)} className="shadow-elev">
          <StickyNote className="h-4 w-4" />
          Nota rápida
        </Button>
        {addOpen && (
          <div className="absolute bottom-full right-0 mb-2">
            <QuickNoteInlineAdd
              ambassadorName={ambassadorName}
              onClose={() => setAddOpen(false)}
              onSubmit={actions.onCreate}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="safe-bottom fixed bottom-6 right-6 z-30 w-80 max-w-[calc(100vw-2rem)]">
      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas/95 shadow-elev backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b border-hairline bg-card/80 px-3 py-2">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-ink">Notas rápidas</span>
            {openNotes.length > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {openNotes.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              + Nova
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded p-1 text-muted-foreground hover:bg-surface"
              aria-label={collapsed ? "Expandir" : "Recolher"}
            >
              {collapsed ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto p-3">
            {addOpen && (
              <QuickNoteInlineAdd
                ambassadorName={ambassadorName}
                onClose={() => setAddOpen(false)}
                onSubmit={async (text, pinned) => {
                  await actions.onCreate(text, pinned);
                  setAddOpen(false);
                }}
              />
            )}
            {openNotes.length === 0 && !addOpen && (
              <p className="text-xs text-muted-foreground">Nenhuma nota pendente.</p>
            )}
            {openNotes.map((note) => (
              <QuickNoteItem key={note.id} note={note} actions={actions} />
            ))}
            {completedNotes.length > 0 && (
              <div className="border-t border-hairline pt-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Concluídas
                </p>
                {completedNotes.map((note) => (
                  <QuickNoteItem key={note.id} note={note} actions={actions} compact />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickNotesInlinePanel({
  ambassadorId,
  ambassadorName,
  onChanged,
}: {
  ambassadorId: string;
  ambassadorName: string;
  onChanged?: () => void;
}) {
  const [notes, setNotes] = useState<AmbassadorQuickNote[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/ambassadors/${ambassadorId}/quick-notes`, { cache: "no-store" });
    if (res.ok) setNotes(await res.json());
  }, [ambassadorId]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useQuickNoteActions(ambassadorId, () => {
    load();
    onChanged?.();
  });

  const openNotes = notes.filter((n) => !n.completed);
  const completedNotes = notes.filter((n) => n.completed);

  return (
    <div className="rounded-lg border border-hairline bg-canvas/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notas rápidas
        </p>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {addOpen ? "Cancelar" : "+ Nova nota"}
        </button>
      </div>
      {addOpen && (
        <div className="mb-2">
          <QuickNoteInlineAdd
            ambassadorName={ambassadorName}
            onClose={() => setAddOpen(false)}
            onSubmit={async (text, pinned) => {
              await actions.onCreate(text, pinned);
              setAddOpen(false);
            }}
          />
        </div>
      )}
      <div className="space-y-2">
        {openNotes.length === 0 && !addOpen && (
          <p className="text-xs text-muted-foreground">Nenhuma nota pendente.</p>
        )}
        {openNotes.map((note) => (
          <QuickNoteItem key={note.id} note={note} actions={actions} compact />
        ))}
        {completedNotes.length > 0 && (
          <div className="border-t border-hairline pt-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Concluídas
            </p>
            {completedNotes.map((note) => (
              <QuickNoteItem key={note.id} note={note} actions={actions} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickNoteInlineAdd({
  ambassadorName,
  onClose,
  onSubmit,
}: {
  ambassadorName: string;
  onClose: () => void;
  onSubmit: (text: string, pinned: boolean) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit(trimmed, pinned);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-primary/20 bg-primary/5 p-2">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">{ambassadorName}</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="O que falta?"
        rows={2}
        className="text-sm"
        autoFocus
      />
      <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Fixar no card
      </label>
      <div className="mt-2 flex justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!text.trim() || saving}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
