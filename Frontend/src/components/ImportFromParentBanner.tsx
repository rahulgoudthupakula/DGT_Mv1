import { Download, Building2, Check, Filter, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ImportCategory {
  id: string;
  label: string;
  count: number;
}

interface LinkedItem {
  upc: string;
  name: string;
  rebateAmount: string;
}

const programLinkedItems: Record<string, LinkedItem[]> = {
  "prg-coca-cola": [
    { upc: "049000028911", name: "Coca-Cola 12oz Can", rebateAmount: "$0.15/unit" },
    { upc: "049000042566", name: "Coca-Cola 20oz Bottle", rebateAmount: "$0.12/unit" },
    { upc: "049000006582", name: "Diet Coke 12oz Can", rebateAmount: "$0.15/unit" },
    { upc: "049000078961", name: "Coca-Cola Zero 12oz", rebateAmount: "$0.15/unit" },
    { upc: "049000050103", name: "Sprite 12oz Can", rebateAmount: "$0.10/unit" },
  ],
  "prg-frito-lay": [
    { upc: "028400064057", name: "Lay's Classic 9.5oz", rebateAmount: "2% of sale" },
    { upc: "028400083102", name: "Doritos Nacho 9.25oz", rebateAmount: "2% of sale" },
    { upc: "028400055475", name: "Cheetos Crunchy 8.5oz", rebateAmount: "2% of sale" },
    { upc: "028400039338", name: "Tostitos Scoops 10oz", rebateAmount: "1.5% of sale" },
    { upc: "028400064064", name: "Ruffles Original 9oz", rebateAmount: "2% of sale" },
  ],
  "prg-pepsi": [
    { upc: "012000001765", name: "Pepsi 20oz Bottle", rebateAmount: "$0.10/unit" },
    { upc: "012000161155", name: "Mountain Dew 20oz", rebateAmount: "$0.10/unit" },
    { upc: "012000001680", name: "Pepsi 12oz Can", rebateAmount: "$0.12/unit" },
  ],
  "prg-nestle": [
    { upc: "011111765391", name: "Pure Life Water 16.9oz", rebateAmount: "1.5% over 1000" },
    { upc: "011111765408", name: "Pure Life Water 1 Gal", rebateAmount: "1% of sale" },
  ],
  "prg-kelloggs": [
    { upc: "038000039300", name: "Frosted Flakes 13.5oz", rebateAmount: "2.5% of sale" },
    { upc: "038000199561", name: "Froot Loops 10.1oz", rebateAmount: "2.5% of sale" },
    { upc: "038000596759", name: "Rice Krispies 12oz", rebateAmount: "2% of sale" },
  ],
  "prg-unilever": [
    { upc: "079400407703", name: "Dove Body Wash 22oz", rebateAmount: "4% of sale" },
    { upc: "079400456779", name: "Dove Shampoo 12oz", rebateAmount: "3% of sale" },
  ],
  "prg-mondelez": [
    { upc: "044000032976", name: "Oreo 14.3oz", rebateAmount: "3% over 300u" },
    { upc: "044000032204", name: "Chips Ahoy 13oz", rebateAmount: "3% over 300u" },
    { upc: "044000018511", name: "Ritz Crackers 13.7oz", rebateAmount: "2.5% of sale" },
    { upc: "044000001360", name: "Triscuit 8.5oz", rebateAmount: "2% of sale" },
  ],
  "prg-tyson": [
    { upc: "023700030217", name: "Tyson Chicken Breast 2lb", rebateAmount: "2% of sale" },
    { upc: "023700030460", name: "Tyson Nuggets 32oz", rebateAmount: "2% of sale" },
  ],
  "prg-general-mills": [
    { upc: "016000275287", name: "Gold Medal Flour 5lb", rebateAmount: "1.8% over 200u" },
    { upc: "016000487703", name: "Cheerios 8.9oz", rebateAmount: "2% of sale" },
  ],
};

const categoryMap: Record<string, ImportCategory[]> = {
  "rebate programs": [
    { id: "programs-active", label: "Active Programs", count: 8 },
    { id: "programs-pending", label: "Pending Programs", count: 3 },
    { id: "prg-coca-cola", label: "Coca-Cola Q1 Rebate", count: 12 },
    { id: "prg-frito-lay", label: "Frito-Lay Volume Bonus", count: 18 },
    { id: "prg-pepsi", label: "Pepsi Summer Boost", count: 8 },
    { id: "prg-nestle", label: "Nestle Waters Deal", count: 5 },
    { id: "prg-kelloggs", label: "Kellogg's Cereal Rebate", count: 9 },
    { id: "prg-unilever", label: "Unilever Personal Care", count: 7 },
    { id: "prg-mondelez", label: "Mondelez Snack Deal", count: 14 },
    { id: "prg-tyson", label: "Tyson Protein Plus", count: 6 },
    { id: "prg-general-mills", label: "General Mills Volume", count: 4 },
  ],
  "rebate items": [
    { id: "items-beverages", label: "Rebate Items – Beverages", count: 42 },
    { id: "items-snacks", label: "Rebate Items – Snacks", count: 31 },
    { id: "items-tobacco", label: "Rebate Items – Tobacco", count: 18 },
    { id: "items-candy", label: "Rebate Items – Candy", count: 24 },
    { id: "items-dairy", label: "Rebate Items – Dairy", count: 15 },
  ],
  "vendor data": [
    { id: "vendors-active", label: "Active Vendors", count: 24 },
    { id: "vendors-inactive", label: "Inactive Vendors", count: 6 },
    { id: "item-mappings", label: "Item–Vendor Mappings", count: 312 },
    { id: "contracts", label: "Vendor Contracts", count: 18 },
    { id: "preferred-vendors", label: "Preferred Vendor Rules", count: 12 },
    { id: "pricing-terms", label: "Pricing & Cost Terms", count: 24 },
  ],
  items: [
    { id: "dept-beverages", label: "Beverages", count: 156 },
    { id: "dept-snacks", label: "Snacks & Chips", count: 203 },
    { id: "dept-tobacco", label: "Tobacco", count: 87 },
    { id: "dept-candy", label: "Candy & Gum", count: 98 },
    { id: "dept-dairy", label: "Dairy & Frozen", count: 64 },
    { id: "dept-grocery", label: "General Grocery", count: 245 },
    { id: "dept-hba", label: "Health & Beauty", count: 72 },
    { id: "dept-auto", label: "Auto & Hardware", count: 38 },
  ],
  promotions: [
    { id: "promo-active", label: "Active Promotions", count: 5 },
    { id: "promo-upcoming", label: "Upcoming Promotions", count: 3 },
    { id: "promo-bundle", label: "Bundle Deals", count: 4 },
    { id: "promo-bogo", label: "BOGO Offers", count: 2 },
    { id: "promo-discount", label: "% Discount Promos", count: 6 },
  ],
  "price groups": [
    { id: "pg-standard", label: "Standard Retail", count: 1245 },
    { id: "pg-tobacco", label: "Tobacco Premium", count: 87 },
    { id: "pg-beverages", label: "High Velocity Beverages", count: 312 },
    { id: "pg-seasonal", label: "Seasonal Items", count: 64 },
    { id: "pg-lottery", label: "Lottery Accessories", count: 15 },
  ],
};

const fallbackCategories: ImportCategory[] = [
  { id: "all-data", label: "All Data", count: 0 },
];

interface ImportFromParentBannerProps {
  parentStoreName: string;
  dataLabel?: string;
}

export const ImportFromParentBanner = ({ parentStoreName, dataLabel = "data" }: ImportFromParentBannerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const categories = categoryMap[dataLabel] || fallbackCategories;
  const isRebatePrograms = dataLabel === "rebate programs";

  const filtered = categories.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const handleOpenDialog = () => {
    setSelectedIds(new Set());
    setSearch("");
    setExpandedProgram(null);
    setDialogOpen(true);
  };

  const handleImportSelected = () => {
    setImporting(true);
    const count = selectedIds.size;
    setTimeout(() => {
      setImporting(false);
      setDialogOpen(false);
      setSelectedIds(new Set());
      toast.success(
        `${count} ${count === 1 ? "category" : "categories"} imported from ${parentStoreName}${isRebatePrograms ? " (linked rebate items synced)" : ""}`
      );
    }, 1500);
  };

  const handleImportAll = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      toast.success(
        `All ${dataLabel} imported successfully from ${parentStoreName}${isRebatePrograms ? " (linked rebate items synced)" : ""}`
      );
    }, 1500);
  };

  const totalSelectedItems = categories
    .filter((c) => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.count, 0);

  const hasLinkedItems = (id: string) => isRebatePrograms && id.startsWith("prg-") && !!programLinkedItems[id];

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Import from Parent Store
            </p>
            <p className="text-xs text-muted-foreground">
              Replicate {dataLabel} from <span className="font-medium text-foreground">{parentStoreName}</span> to this child store
              {isRebatePrograms && (
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Importing programs will also sync their linked rebate items</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenDialog} className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Select & Import
          </Button>
          <Button size="sm" onClick={handleImportAll} disabled={importing} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            {importing ? "Importing…" : "Import All"}
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4.5 w-4.5 text-primary" />
              Select {dataLabel} to import
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Choose specific categories from <span className="font-medium text-foreground">{parentStoreName}</span>
              {isRebatePrograms && (
                <span className="block mt-0.5">Click a program name to preview linked rebate items</span>
              )}
            </p>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Check className="h-3 w-3" />
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {selectedIds.size} selected · {totalSelectedItems.toLocaleString()} items
                </Badge>
              )}
            </div>

            <Separator />

            <ScrollArea className="h-[320px] pr-3">
              <div className="space-y-1">
                {filtered.map((cat) => {
                  const isChecked = selectedIds.has(cat.id);
                  const linked = hasLinkedItems(cat.id) ? programLinkedItems[cat.id] : null;
                  const isExpanded = expandedProgram === cat.id;

                  if (linked) {
                    return (
                      <div key={cat.id} className="space-y-0">
                        <div
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                            isChecked ? "bg-primary/5" : "hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleItem(cat.id)}
                          />
                          <button
                            type="button"
                            onClick={() => setExpandedProgram(isExpanded ? null : cat.id)}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            <span className="flex-1 text-sm text-foreground">{cat.label}</span>
                            <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                              <Package className="h-2.5 w-2.5" />
                              {linked.length} items
                            </Badge>
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="ml-10 mr-2 mb-2 rounded-md border border-border/50 bg-muted/30 p-2.5 space-y-1.5">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Linked Rebate Items — will sync with this program
                            </p>
                            {linked.map((item) => (
                              <div key={item.upc} className="flex items-center justify-between gap-2 py-1 border-b border-border/30 last:border-0">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{item.upc}</p>
                                </div>
                                <span className="text-[10px] font-medium text-primary whitespace-nowrap">{item.rebateAmount}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <label
                      key={cat.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                        isChecked ? "bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(cat.id)}
                      />
                      <span className="flex-1 text-sm text-foreground">{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{cat.count.toLocaleString()} items</span>
                    </label>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No categories match your search</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImportSelected}
              disabled={importing || selectedIds.size === 0}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              {importing
                ? "Importing…"
                : `Import ${selectedIds.size} ${selectedIds.size === 1 ? "category" : "categories"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
