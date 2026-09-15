import { Send, Store, Check, ChevronRight } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const childStores = [
  { id: "store-2", name: "Downtown Branch", address: "456 Oak Ave, Springfield" },
  { id: "store-3", name: "Highway Location", address: "789 Route 66, Shelbyville" },
];

interface SyncToChildStoresBannerProps {
  dataLabel?: string;
}

export const SyncToChildStoresBanner = ({ dataLabel = "changes" }: SyncToChildStoresBannerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = childStores.length > 0 && childStores.every((s) => selectedIds.has(s.id));

  const toggleStore = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(childStores.map((s) => s.id)));
    }
  };

  const handleOpen = () => {
    setSelectedIds(new Set());
    setDialogOpen(true);
  };

  const handleSyncSelected = () => {
    setSyncing(true);
    const count = selectedIds.size;
    const names = childStores
      .filter((s) => selectedIds.has(s.id))
      .map((s) => s.name)
      .join(", ");
    setTimeout(() => {
      setSyncing(false);
      setDialogOpen(false);
      setSelectedIds(new Set());
      toast.success(`${dataLabel} synced to ${count === childStores.length ? "all child stores" : names}`);
    }, 1500);
  };

  const handleSyncAll = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success(`${dataLabel} synced to all child stores`);
    }, 1500);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <Send className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Sync to Child Stores
            </p>
            <p className="text-xs text-muted-foreground">
              Push {dataLabel} changes to your child store locations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpen} className="gap-1.5 text-xs">
            <Store className="h-3.5 w-3.5" />
            Choose Stores
          </Button>
          <Button size="sm" onClick={handleSyncAll} disabled={syncing} className="gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" />
            {syncing ? "Syncing…" : "Sync All"}
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4 text-primary" />
              Sync {dataLabel} to child stores
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Select which child stores should receive the latest {dataLabel}
            </p>
          </DialogHeader>

          <div className="space-y-3">
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
                  {selectedIds.size} of {childStores.length} selected
                </Badge>
              )}
            </div>

            <Separator />

            <ScrollArea className="max-h-[220px] pr-3">
              <div className="space-y-1">
                {childStores.map((store) => {
                  const isChecked = selectedIds.has(store.id);
                  return (
                    <label
                      key={store.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors ${
                        isChecked ? "bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleStore(store.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{store.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{store.address}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSyncSelected}
              disabled={syncing || selectedIds.size === 0}
              className="gap-1.5 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              {syncing
                ? "Syncing…"
                : `Sync to ${selectedIds.size} ${selectedIds.size === 1 ? "store" : "stores"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
