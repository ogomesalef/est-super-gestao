"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addSavedRecipient,
  loadSavedRecipients,
  removeSavedRecipient,
} from "@/lib/saved-recipients";

type SavedEmailInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  refreshKey?: number;
};

export function SavedEmailInput({
  value,
  onChange,
  onSelect,
  placeholder = "seu@email.com",
  disabled,
  className,
  refreshKey = 0,
}: SavedEmailInputProps) {
  const [saved, setSaved] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(loadSavedRecipients());
  }, [refreshKey]);

  const query = value.trim().toLowerCase();
  const suggestions = saved.filter(
    (e) => !query || e.toLowerCase().includes(query) || normalize(value) === normalize(e)
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(email: string) {
    onChange(email);
    onSelect?.(email);
    setOpen(false);
  }

  function removeChip(email: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSaved(removeSavedRecipient(email));
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "min-h-9 rounded-md border border-hairline bg-canvas px-2 py-1.5 shadow-hairline",
          "focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-2 focus-within:ring-offset-canvas",
          disabled && "opacity-50"
        )}
        onClick={() => !disabled && setOpen(true)}
      >
        {saved.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {saved.map((email) => {
              const active = normalize(value) === normalize(email);
              return (
                <button
                  key={email}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(email)}
                  className={cn(
                    "group inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-surface text-body hover:bg-surface/80"
                  )}
                >
                  <span className="truncate">{email}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remover ${email}`}
                    onClick={(e) => removeChip(email, e)}
                    className="rounded p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <input
          type="email"
          value={value}
          disabled={disabled}
          placeholder={saved.length ? "Digite ou escolha um e-mail salvo..." : placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && suggestions[0] && !value.trim()) {
              e.preventDefault();
              pick(suggestions[0]);
            }
          }}
          className="w-full bg-transparent px-1 text-sm text-ink placeholder:text-muted-foreground/70 focus:outline-none"
        />
      </div>

      {open && suggestions.length > 0 && value.trim() && (
        <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-md border border-hairline bg-card py-1 shadow-elev">
          {suggestions.map((email) => (
            <li key={email}>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-surface"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(email);
                }}
              >
                {email}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function rememberTestEmail(email: string) {
  return addSavedRecipient(email);
}

function normalize(email: string) {
  return email.trim().toLowerCase();
}
