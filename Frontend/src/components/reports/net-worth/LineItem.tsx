const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const LineItem = ({ label, value, source }: { label: string; value: number; source?: string }) => (
  <div className="flex justify-between py-1.5 text-sm group">
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      {source && <span className="text-[10px] text-muted-foreground/60 italic">{source}</span>}
    </div>
    <span className="font-medium tabular-nums">{fmt(value)}</span>
  </div>
);

export const SubtotalRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between py-2 border-t border-dashed border-border mt-1">
    <span className="text-sm font-semibold">{label}</span>
    <span className="text-sm font-bold tabular-nums">{fmt(value)}</span>
  </div>
);

export const ModuleHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
    <p className="text-xs font-bold text-primary uppercase tracking-wider">{label}</p>
  </div>
);

export const SectionHeader = ({ label }: { label: string }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-3 first:mt-0">{label}</p>
);
