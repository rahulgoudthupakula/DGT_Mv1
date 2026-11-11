import { useState, useSyncExternalStore } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRecentFilters, groupRecentFilterOptions, rememberFilter, subscribeRecentFilters } from "@/lib/recentFilters";
import { searchFilterOptions, toggleFilter } from "@/lib/filterSelection";

export interface FilterChoice { value: string; label: string; disabled?: boolean; }
interface Props {
  storeId?: string;
  filterType: "department" | "vendor";
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: FilterChoice[];
  allLabel: string;
  className?: string;
  id?: string;
  loading?: boolean;
}
const EMPTY: readonly string[] = Object.freeze([]);

/** Searchable filter with OR selection, local selection state and shared recent suggestions. */
export function SearchMultiFilter({ storeId = "", filterType, values, onValuesChange, options, allLabel, className, id, loading }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const recent = useSyncExternalStore(subscribeRecentFilters, () => getRecentFilters(storeId, filterType), () => EMPTY);
  const uniqueOptions = [...new Map(options.filter(option => option.value).map(option => [option.value, option])).values()];
  // Preserve a selected historical value so it can still be removed after options refresh.
  for (const value of values) if (!uniqueOptions.some(option => option.value === value)) uniqueOptions.push({value,label:value});
  const visible = searchFilterOptions(uniqueOptions,search);
  const groups = groupRecentFilterOptions(visible, recent, false);
  const labels = values.map(value => uniqueOptions.find(option => option.value === value)?.label ?? value);
  const summary = values.length === 0 ? allLabel : values.length === 1 ? labels[0] : `${values.length} ${filterType === "department" ? "departments" : "vendors"}`;
  function choose(option: FilterChoice) {
    if (!values.includes(option.value)) rememberFilter(storeId, filterType, option.label);
    onValuesChange(toggleFilter(values, option.value));
  }
  const item = (option: FilterChoice) => <CommandItem key={option.value} value={option.value} disabled={option.disabled} onSelect={() => choose(option)} className="data-[selected=true]:!bg-primary data-[selected=true]:!text-primary-foreground" aria-label={`${option.label}${values.includes(option.value) ? ", selected" : ""}`}>
    <span aria-hidden="true" className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border", values.includes(option.value) ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
      {values.includes(option.value) && <Check className="h-3 w-3" />}
    </span>{option.label}
  </CommandItem>;
  return <Popover open={open} onOpenChange={next => {setOpen(next);if (!next) setSearch("");}}>
    <PopoverTrigger asChild><Button type="button" id={id} variant="outline" role="combobox" aria-expanded={open} aria-label={filterType === "department" ? "Departments" : "Vendors"} title={labels.join(", ") || allLabel} className={cn("w-full justify-between font-normal", open && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground", className)}>
      <span className="truncate">{summary}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button></PopoverTrigger>
    <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
      <Command shouldFilter={false}>
        <CommandInput placeholder={`Search ${filterType === "department" ? "departments" : "vendors"}…`} value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandGroup><CommandItem value="__clear_filter" onSelect={() => onValuesChange([])}><Check className={cn("mr-2 h-4 w-4", values.length ? "opacity-0" : "opacity-100")} />{allLabel}</CommandItem></CommandGroup>
          {loading && <p className="px-3 py-2 text-xs text-muted-foreground">Loading options…</p>}
          {!loading && visible.length === 0 && <p role="status" className="px-3 py-4 text-sm text-muted-foreground">No matching options.</p>}
          {groups.recent.length > 0 && <><CommandGroup heading="Recently selected">{groups.recent.map(item)}</CommandGroup><CommandSeparator /></>}
          <CommandGroup heading={groups.recent.length ? "Other options" : undefined}>{groups.remaining.map(item)}</CommandGroup>
        </CommandList>
      </Command>
      <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground"><span>{values.length ? `${values.length} selected` : allLabel}</span><Button type="button" size="sm" variant="ghost" onClick={() => {setOpen(false);setSearch("");}}>Done</Button></div>
    </PopoverContent>
  </Popover>;
}
