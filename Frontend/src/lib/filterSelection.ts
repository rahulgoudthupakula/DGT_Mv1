/** No selections means all; values within one filter are alternatives. */
export function matchesFilter(selected: readonly string[], value: string | readonly string[] | null | undefined): boolean {
  if (selected.length === 0) return true;
  const candidates = Array.isArray(value) ? value : value == null ? [] : [value];
  return candidates.some(candidate => selected.includes(candidate));
}

export function toggleFilter(selected: readonly string[], value: string): string[] {
  return selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
}

export function searchFilterOptions<T extends {label:string}>(options:T[], search:string):T[] {
  const query=search.trim().normalize("NFKC").toLowerCase();
  return options.filter(option=>option.label.normalize("NFKC").toLowerCase().includes(query));
}

/** Repeated parameters preserve complete vendor names, including names containing commas. */
export function filterParams(filters: Record<string, string | readonly string[]>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "string") params.set(key, value);
    else [...new Set(value)].sort().forEach(option => params.append(key, option));
  }
  return params;
}
