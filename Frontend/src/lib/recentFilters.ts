const STORAGE_KEY = "dgt_recent_filters_v1";
const EMPTY: readonly string[] = Object.freeze([]);
const listeners = new Set<() => void>();

function loadHistory(): Record<string, string[]> {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored)
      .filter(([, values]) => Array.isArray(values) && values.every(value => typeof value === "string"))
      .map(([key, values]) => [key, [...new Set(values as string[])].slice(0, 5)]));
  } catch { return {}; }
}

let history = loadHistory();
const scope = (storeId: string, filterType: string) => JSON.stringify([storeId, filterType]);
export const filterOptionIdentity = (label: string) => label.trim().normalize("NFKC").toLowerCase();
export const isResetFilterValue = (value: string) => ["all", "All", "All Departments", "All Vendors", "All Tax Types", "All Reasons", "All Statuses", "All Categories"].includes(value);

export function groupRecentFilterOptions<T extends { value: string; label: string; disabled?: boolean }>(options: T[], recent: readonly string[], pinResetOptions = true) {
  const isPinned = (option: T) => pinResetOptions && isResetFilterValue(option.value);
  const pinned = options.filter(isPinned);
  const suggested = recent.flatMap(identity => options.filter(option => !option.disabled && !isPinned(option) && filterOptionIdentity(option.label) === identity));
  const selected = new Set(suggested);
  return { pinned, recent: suggested, remaining: options.filter(option => !isPinned(option) && !selected.has(option)) };
}

function notify() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* Memory still works when storage is unavailable. */ }
  listeners.forEach(listener => listener());
}

export function getRecentFilters(storeId: string, filterType: string): readonly string[] {
  return history[scope(storeId, filterType)] ?? EMPTY;
}

export function rememberFilter(storeId: string, filterType: string, label: string) {
  const identity = filterOptionIdentity(label);
  if (!storeId || !identity) return;
  const key = scope(storeId, filterType);
  history = { ...history, [key]: [identity, ...(history[key] ?? []).filter(value => value !== identity)].slice(0, 5) };
  notify();
}

export function clearRecentFilters() {
  history = {};
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Memory reset is sufficient. */ }
  listeners.forEach(listener => listener());
}

export function subscribeRecentFilters(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
