import { useStoreDepartments } from "@/hooks/use-store-departments";
import { SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecentFilterSelect, RecentFilterContent } from "./RecentFilterSelect";

interface Props {
  storeId: string;
  value: string;
  onValueChange: (value: string) => void;
  allValue?: string;
  className?: string;
  id?: string;
  extraNames?: string[];
  lowercaseValues?: boolean;
}

/** Keep selection local to each page; only the store catalog is shared. */
export function DepartmentFilter({ storeId, value, onValueChange, allValue = "all", className, id, extraNames = [], lowercaseValues = false }: Props) {
  const query = useStoreDepartments(storeId);
  const names = [...new Set([...(query.data ?? []).map(d => d.name), ...extraNames].filter(Boolean))];
  // Historical rows may refer to a department which has since been disabled or renamed.
  if (value && value !== allValue && !names.some(name => (lowercaseValues ? name.toLowerCase() : name) === value)) names.push(value);
  const options = [...new Map(names.map(name => [lowercaseValues ? name.toLowerCase() : name, name])).entries()];
  return <div>
    <RecentFilterSelect storeId={storeId} filterType="department" value={value || allValue} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className} aria-label="Department">
        <SelectValue placeholder="All Departments" />
      </SelectTrigger>
      <RecentFilterContent>
        <SelectItem value={allValue}>All Departments</SelectItem>
        {options.filter(([option]) => option !== allValue).map(([option, name]) => <SelectItem key={option} value={option}>{name}</SelectItem>)}
        {query.isPending && <SelectItem disabled value="__departments_loading">Loading departments…</SelectItem>}
      </RecentFilterContent>
    </RecentFilterSelect>
    {query.isError && <p role="alert" className="mt-1 text-xs text-destructive">Couldn’t load departments. <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
  </div>;
}
