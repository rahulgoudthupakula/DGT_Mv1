import { Children, Fragment, createContext, isValidElement, useContext, useSyncExternalStore, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { getRecentFilters, groupRecentFilterOptions, isResetFilterValue, rememberFilter, subscribeRecentFilters } from "@/lib/recentFilters";

const RecentContext = createContext<readonly string[]>([]);
const noRecents: readonly string[] = Object.freeze([]);
type Option = ReactElement<ComponentProps<typeof SelectItem>>;

function optionsIn(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return child.type === SelectItem ? [child as Option] : optionsIn(child.props.children);
  });
}

function textOf(children: ReactNode): string {
  return Children.toArray(children).map(child => typeof child === "string" || typeof child === "number"
    ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : "").join("");
}

/** Recent suggestions reorder options only; the page still owns its selected filter. */
export function RecentFilterSelect({ storeId, filterType, children, onValueChange, ...props }: ComponentProps<typeof Select> & { storeId: string; filterType: string }) {
  const recent = useSyncExternalStore(subscribeRecentFilters, () => getRecentFilters(storeId, filterType), () => noRecents);
  return <RecentContext.Provider value={recent}>
    <Select {...props} onValueChange={value => {
      const option = optionsIn(children).find(option => option.props.value === value);
      if (option && !option.props.disabled && !isResetFilterValue(option.props.value)) rememberFilter(storeId, filterType, textOf(option.props.children));
      onValueChange?.(value);
    }}>{children}</Select>
  </RecentContext.Provider>;
}

export function RecentFilterContent({ children, ...props }: ComponentProps<typeof SelectContent>) {
  const history = useContext(RecentContext);
  const options = optionsIn(children).map(element => ({element,value:element.props.value,label:textOf(element.props.children),disabled:element.props.disabled}));
  const { pinned, recent, remaining } = groupRecentFilterOptions(options, history);
  // Keep each option in exactly one group so keyboard navigation and selection remain unambiguous.
  return <SelectContent {...props}>
    {pinned.map(option => <Fragment key={option.value}>{option.element}</Fragment>)}
    {recent.length > 0 && <><SelectGroup><SelectLabel>Recently selected</SelectLabel>{recent.map(option => <Fragment key={option.value}>{option.element}</Fragment>)}</SelectGroup><SelectSeparator /></>}
    <SelectGroup>{recent.length > 0 && <SelectLabel>Other options</SelectLabel>}{remaining.map(option => <Fragment key={option.value}>{option.element}</Fragment>)}</SelectGroup>
  </SelectContent>;
}
