import { useStoreDepartments } from "@/hooks/use-store-departments";
import { SearchMultiFilter } from "./SearchMultiFilter";

interface Props {
  storeId: string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  className?: string;
  id?: string;
  extraNames?: string[];
  lowercaseValues?: boolean;
}

/** Keep selection local to each page; only the store catalog is shared. */
export function DepartmentFilter({ storeId, values, onValuesChange, className, id, extraNames = [], lowercaseValues = false }: Props) {
  const query = useStoreDepartments(storeId);
  const names = [...new Set([...(query.data ?? []).map(d => d.name), ...extraNames].filter(Boolean))];
  // Historical rows may refer to a department which has since been disabled or renamed.
  for (const value of values) if (!names.some(name => (lowercaseValues ? name.toLowerCase() : name) === value)) names.push(value);
  const options = [...new Map(names.map(name => [lowercaseValues ? name.toLowerCase() : name, name])).entries()];
  return <div>
    <SearchMultiFilter storeId={storeId} filterType="department" values={values} onValuesChange={onValuesChange} allLabel="All Departments" options={options.map(([value,label])=>({value,label}))} className={className} id={id} loading={query.isPending} />
    {query.isError && <p role="alert" className="mt-1 text-xs text-destructive">Couldn’t load departments. <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
  </div>;
}
