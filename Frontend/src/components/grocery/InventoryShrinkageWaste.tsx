import {request} from '@/lib/backend';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PackageX, AlertTriangle, Loader2, ShieldAlert, Trash2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShrinkageRow {
  id: string;
  item_name: string;
  scan_code: string;
  quantity: number;
  current_stock: number|null;
  net_cost: number|null;
  recorded_loss: number|null;
  reason: string;
  notes: string | null;
  recorded_at: string;
}

const REASON_META: Record<string, { label: string; icon: typeof PackageX; cls: string }> = {
  "vendor-recall": { label: "Vendor Recall", icon: AlertTriangle, cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  "theft": { label: "Theft / Shrinkage", icon: ShieldAlert, cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  "spoilage": { label: "Spoilage", icon: Trash2, cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" },
  "counting-error": { label: "Counting Error", icon: Calculator, cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
};

const reasonLabel = (key: string) => REASON_META[key]?.label ?? key;

export const InventoryShrinkageWaste = ({storeId}:{storeId:string}) => {
  const { toast } = useToast();
  const [records, setRecords] = useState<ShrinkageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState<"all" | keyof typeof REASON_META>("all");

  const fetchRecords = async () => {
    try{const data=await request<{requests:any[];items:any[]}>(`/access/stores/${encodeURIComponent(storeId)}/reductions`);setRecords(data.requests.filter(r=>r.status==='APPROVED'&&r.route==='shrinkage').map(r=>({id:String(r.reduction_request_id),item_name:r.product_name,scan_code:r.barcode??'',quantity:Number(r.quantity),current_stock:data.items.find(i=>Number(i.id)===Number(r.product_id))?.inventoryCount??null,net_cost:r.recorded_unit_cost==null?null:Number(r.recorded_unit_cost),recorded_loss:r.recorded_loss==null?null:Number(r.recorded_loss),reason:r.reason,notes:r.notes,recorded_at:r.updated_at,})));}catch(e){toast({title:'Could not load records',description:String(e),variant:'destructive'});}finally{setLoading(false);}
  };
  useEffect(()=>{fetchRecords();},[storeId]);


  const filtered = records.filter(r => {
    const q = query.toLowerCase();
    const matchesQ =
      !q ||
      r.item_name.toLowerCase().includes(q) ||
      r.scan_code.toLowerCase().includes(q) ||
      reasonLabel(r.reason).toLowerCase().includes(q);
    const matchesReason = reason === "all" || r.reason === reason;
    return matchesQ && matchesReason;
  });

  const totalQty = filtered.reduce((sum, r) => sum + r.quantity, 0);
  const counts = (Object.keys(REASON_META) as Array<keyof typeof REASON_META>).reduce(
    (acc, k) => ({ ...acc, [k]: records.filter(r => r.reason === k).length }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <PackageX className="h-4 w-4 text-primary" />
              Inventory Shrinkage &amp; Waste
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Items removed from stock due to vendor recall, theft, spoilage, or counting errors. Stock columns show the live balance after approval; the reduction is already applied.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Showing</p>
            <p className="text-lg font-semibold">
              {filtered.length} <span className="text-xs text-muted-foreground font-normal">/ {totalQty} units</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={reason} onValueChange={v => setReason(v as typeof reason)}>
              <TabsList className="h-8 flex-wrap">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                {(Object.keys(REASON_META) as Array<keyof typeof REASON_META>).map(k => {
                  const Icon = REASON_META[k].icon;
                  return (
                    <TabsTrigger key={k} value={k} className="text-xs px-3 flex items-center gap-1.5">
                      <Icon className="h-3 w-3" /> {REASON_META[k].label}
                      {counts[k] ? <span className="text-muted-foreground">({counts[k]})</span> : null}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search item, barcode, or reason..."
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Barcode</TableHead>
                  <TableHead className="text-xs">Item Name</TableHead>
                  <TableHead className="text-xs text-center">Current Stock</TableHead>
                  <TableHead className="text-xs text-center">Reduced Qty</TableHead>
                  <TableHead className="text-xs text-center">Remaining Stock</TableHead>
                  <TableHead className="text-xs text-right">Net Cost</TableHead>
                  <TableHead className="text-xs text-right">Recorded Loss</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading shrinkage records...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                      No shrinkage or waste records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(r => {
                    const meta = REASON_META[r.reason];
                    const Icon = meta?.icon ?? PackageX;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">
                          {new Date(r.recorded_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{r.scan_code}</TableCell>
                        <TableCell className="text-xs font-medium">{r.item_name}</TableCell>
                        <TableCell className="text-xs text-center">{r.current_stock??''}</TableCell>
                        <TableCell className="text-xs text-center">{r.quantity}</TableCell>
                        <TableCell className="text-xs text-center">{r.current_stock??''}</TableCell>
                        <TableCell className="text-xs text-right">{r.net_cost==null?'':`$${r.net_cost.toFixed(2)}`}</TableCell>
                        <TableCell className="text-xs text-right">{r.recorded_loss==null?'':`$${r.recorded_loss.toFixed(2)}`}</TableCell>
                        <TableCell className="text-xs">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta?.cls ?? "bg-muted text-muted-foreground"}`}>
                            <Icon className="h-3 w-3" /> {reasonLabel(r.reason)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.notes ?? ''}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};