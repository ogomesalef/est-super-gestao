"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { normalizeHandle } from "@/lib/utils";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import type { PostDelivery } from "./types";
import { displayName } from "@/lib/ambassador-name";

type AmbassadorOption = {
  id: string;
  fullName: string;
  socialName?: string | null;
  instagram: string;
  program: string;
};

export function AssignDeliveryModal({
  open,
  post,
  saving,
  onClose,
  onAssign,
}: {
  open: boolean;
  post: PostDelivery | null;
  saving: boolean;
  onClose: () => void;
  onAssign: (ambassadorId: string) => void;
}) {
  const [ambassadors, setAmbassadors] = useState<AmbassadorOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !post) return;
    setQuery(post.instagram?.replace("@", "") || post.fullName || "");
    setLoading(true);
    fetch("/api/parcerias")
      .then((r) => r.json())
      .then((data) => setAmbassadors(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [open, post]);

  const postIg = normalizeHandle(post?.instagram || "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ambassadors;
    if (q) {
      list = ambassadors.filter(
        (a) =>
          displayName(a).toLowerCase().includes(q) ||
          a.fullName.toLowerCase().includes(q) ||
          a.instagram.toLowerCase().includes(q) ||
          a.program.toLowerCase().includes(q)
      );
    }
    return [...list]
      .sort((a, b) => {
        const aMatch = normalizeHandle(a.instagram) === postIg && postIg !== "@";
        const bMatch = normalizeHandle(b.instagram) === postIg && postIg !== "@";
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return displayName(a).localeCompare(displayName(b), "pt-BR");
      })
      .slice(0, 40);
  }, [ambassadors, query, postIg]);

  if (!open || !post) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-hairline bg-card p-5 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-ink">Atribuir post</h2>
            <p className="text-sm text-muted-foreground">
              {post.fullName || "Sem nome"} · {post.instagram || "sem @"} · {post.deliveryType || "tipo?"}
            </p>
            {post.program && (
              <p className="mt-1 text-xs text-amber-800">
                Form marcou <strong>{post.program}</strong> — escolha o embaixador correto (OAB ou ECJ).
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, @ ou vertical (OAB/ECJ)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-auto">
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onAssign(a.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2 text-left text-sm hover:bg-surface disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <strong>{displayName(a)}</strong>
                    <span className="ml-2 text-muted-foreground">{a.instagram}</span>
                    {normalizeHandle(a.instagram) === postIg && postIg !== "@" && (
                      <span className="ml-2 text-xs font-medium text-primary">@ bate</span>
                    )}
                  </span>
                  <VerticalBadge vertical={a.program} />
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum embaixador encontrado</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AssignButton({
  post,
  onClick,
  compact,
}: {
  post: PostDelivery;
  onClick: () => void;
  compact?: boolean;
}) {
  const unassigned = post.needsReview || !post.ambassador;
  if (!unassigned) return null;

  return (
    <Button
      variant={compact ? "secondary" : "primary"}
      size="sm"
      onClick={onClick}
      className={compact ? "h-7 text-xs" : ""}
    >
      <UserPlus className="mr-1 h-3.5 w-3.5" />
      Atribuir
    </Button>
  );
}
