import type { CandidaturasSyncStatus } from "@/lib/candidaturas-sync";

const TTL_MS = 120_000;

let candidaturasCache: { at: number; data: CandidaturasSyncStatus } | null = null;

export function invalidateCandidaturasSyncCache() {
  candidaturasCache = null;
}

export async function getCachedCandidaturasSyncStatus(
  loader: () => Promise<CandidaturasSyncStatus>
): Promise<CandidaturasSyncStatus> {
  const now = Date.now();
  if (candidaturasCache && now - candidaturasCache.at < TTL_MS) {
    return candidaturasCache.data;
  }
  const data = await loader();
  candidaturasCache = { at: now, data };
  return data;
}
