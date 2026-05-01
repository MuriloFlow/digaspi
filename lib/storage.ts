type Timestamped = {
  createdAt: number;
};

export function isBrowser() {
  return typeof window !== "undefined";
}

export function readExpiringList<T extends Timestamped>(key: string, ttlMs: number): T[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as T[]) : [];
    const fresh = parsed.filter((item) => Date.now() - item.createdAt <= ttlMs);

    if (fresh.length !== parsed.length) {
      window.localStorage.setItem(key, JSON.stringify(fresh));
    }

    return fresh;
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

export function writeList<T>(key: string, value: T[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    window.alert("Nao foi possivel salvar no aparelho. Limpe dados antigos e tente novamente.");
  }
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

export function normalizeCode(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\w.\-\/]/g, "")
    .trim()
    .toUpperCase();
}

export function normalizeName(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}
