"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao entrar");
      return;
    }
    router.push(data.role === "executive" ? "/executive" : "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas bg-aurora-light p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-hairline bg-card p-6 text-ink shadow-elev"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shadow-hairline">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-ink">Super Gestão</h1>
            <p className="text-sm text-muted-foreground">Programa Super Embaixadores</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-muted-foreground">E-mail</span>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-muted-foreground">Senha</span>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
        <a
          href="/api/auth/google"
          className="mt-3 block w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-center text-sm text-body shadow-hairline transition-colors hover:bg-surface"
        >
          Entrar com Google (produção)
        </a>
      </form>
    </div>
  );
}
