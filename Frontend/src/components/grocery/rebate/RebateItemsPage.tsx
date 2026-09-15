import {useRebates, type RebateLink} from './useRebates';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";



type RebateItem=RebateLink;

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Active: "default", Expired: "secondary",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

const getRebateAmountLabel = (type: string) => {
  switch (type) {
    case "Per unit": return "Amount per Unit";
    case "Percentage": return "Percentage (%)";
    case "Volume-based": return "Volume-based Amount";
    default: return "Rebate Amount";
  }
};

const getRebateAmountPlaceholder = (type: string) => {
  switch (type) {
    case "Per unit": return "e.g., 0.15";
    case "Percentage": return "e.g., 3";
    case "Volume-based": return "e.g., 2% over 500 units";
    default: return "Enter rebate amount";
  }
};

const getRebateAmountPrefix = (type: string) => {
  switch (type) {
    case "Per unit": return "$";
    case "Percentage": return "";
    default: return "";
  }
};

const getRebateAmountSuffix = (type: string) => {
  switch (type) {
    case "Per unit": return "/unit";
    case "Percentage": return "%";
    default: return "";
  }
};

const formatRebateDisplay = (types: string[], amounts: Record<string, string>) => {
  return types
    .filter((t) => amounts[t])
    .map((t) => `${getRebateAmountPrefix(t)}${amounts[t]}${getRebateAmountSuffix(t)}`)
    .join(", ");
};

const parseRebateTypes = (rebateType: string): string[] =>
  rebateType.split(",").map((t) => t.trim()).filter(Boolean);

interface NewFormState {
  selectedBarcode: string;
  programId: string;
  startDate: string;
  endDate: string;
  rebateAmounts: Record<string, string>;
}

const emptyForm: NewFormState = { selectedBarcode: "", programId: "", startDate: "", endDate: "", rebateAmounts: {} };

export const RebateItemsPage = ({storeId,selectedProgramId}:{storeId:string;selectedProgramId?:string}) => {
  const {query,save}=useRebates(storeId);const items=query.data?.items??[],availablePrograms=query.data?.programs??[],pricebookItems=query.data?.products??[];
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newForm, setNewForm] = useState<NewFormState>(emptyForm);
  const [editItem, setEditItem] = useState<RebateItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RebateItem | null>(null);

  const [programFilter, setProgramFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(()=>{if(selectedProgramId){setNewForm(f=>({...f,programId:selectedProgramId}));const p=query.data?.programs.find(p=>p.id===selectedProgramId);if(p)setProgramFilter(p.name);}},[selectedProgramId,query.data]);

  const selectedProgram = availablePrograms.find((p) => p.id === newForm.programId);
  const selectedPricebookItem = pricebookItems.find((p) => p.id === newForm.selectedBarcode);
  const selectedRebateTypes = selectedProgram ? parseRebateTypes(selectedProgram.rebateType) : [];

  const programOptions = Array.from(new Set(items.map((i) => i.programName))).filter(Boolean);
  const providerOptions = Array.from(new Set(items.map((i) => i.rebateProvider))).filter(Boolean);
  const statusOptions = Array.from(new Set(items.map((i) => i.status))).filter(Boolean);

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.itemName.toLowerCase().includes(q) ||
      item.upc.includes(searchQuery) ||
      item.rebateProvider.toLowerCase().includes(q) ||
      item.programName.toLowerCase().includes(q);
    return (
      matchesSearch &&
      (programFilter === "all" || item.programName === programFilter) &&
      (providerFilter === "all" || item.rebateProvider === providerFilter) &&
      (statusFilter === "all" || item.status === statusFilter)
    );
  });


  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage, goToPage } =
    usePagination(filtered, 10);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    goToPage(1);
  };

  async function persist(payload:object,existing?:RebateItem){setBusy(true);setError('');try{await save('items',payload,existing);toast.success('Rebate item saved');return true;}catch(e){setError(e instanceof Error?e.message:'Could not save link');return false;}finally{setBusy(false);}}
  const handleAddItem=async()=>{
   if(!selectedPricebookItem||!selectedProgram){setError('Choose a store item and rebate program');return;}
   if(await persist({productId:Number(selectedPricebookItem.id),programId:Number(selectedProgram.id),startDate:newForm.startDate,endDate:newForm.endDate,rebateAmount:formatRebateDisplay(selectedRebateTypes,newForm.rebateAmounts),active:true})){setShowAddDialog(false);setNewForm(emptyForm);}
  };
  const handleDeleteItem=async()=>{if(deleteItem&&await persist({...deleteItem,productId:Number(deleteItem.productId),programId:Number(deleteItem.programId),active:false},deleteItem))setDeleteItem(null);};
  const handleCloneItem=(item:RebateItem)=>{setNewForm({...emptyForm,programId:item.programId,startDate:item.startDate,endDate:item.endDate});setShowAddDialog(true);};
  const handleSaveEdit=async()=>{if(editItem&&await persist({...editItem,productId:Number(editItem.productId),programId:Number(editItem.programId),active:true},editItem))setEditItem(null);};

  return (
    <div className="space-y-4">
      {(error||query.error)&&<p role="alert" className="text-destructive">{error||String(query.error)}</p>}
      {query.isPending&&<p>Loading rebate items…</p>}
      <p className="text-sm text-muted-foreground">This table lists explicit item links. Provider/department/brand scopes also resolve matching products in Program Details. Item rebate terms are saved here. Earnings and claims are not calculated yet. Blank dates inherit the program dates.</p>
      <Card>
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Rebate Items</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Programs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Providers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providerOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by UPC, item or provider..." className="pl-9 w-72" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
            </div>
            <Dialog open={showAddDialog} onOpenChange={v=>!busy&&setShowAddDialog(v)}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add Rebate Item</DialogTitle></DialogHeader>{error&&<p role="alert" className="text-destructive">{error}</p>}
                <div className="grid gap-4 py-4">
                  {/* Choose Item from Pricebook */}
                  <div className="grid gap-2">
                    <Label>Choose Item</Label>
                    <Select value={newForm.selectedBarcode} onValueChange={(v) => setNewForm((f) => ({ ...f, selectedBarcode: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select item from pricebook" /></SelectTrigger>
                      <SelectContent>
                        {pricebookItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} — {item.barcode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPricebookItem && (
                      <p className="text-xs text-muted-foreground">
                        UPC: {selectedPricebookItem.barcode}
                      </p>
                    )}
                  </div>

                  {/* Rebate Program */}
                  <div className="grid gap-2">
                    <Label>Rebate Program</Label>
                    <Select value={newForm.programId} onValueChange={(v) => setNewForm((f) => ({ ...f, programId: v, rebateAmounts: {} }))}>
                      <SelectTrigger><SelectValue placeholder="Select rebate program" /></SelectTrigger>
                      <SelectContent>
                        {availablePrograms.filter((p) => p.status !== "Inactive" && p.status !== "Expired").map((prog) => (
                          <SelectItem key={prog.id} value={prog.id}>
                            {prog.name} ({prog.rebateType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProgram && (
                      <p className="text-xs text-muted-foreground">
                        Vendor: {selectedProgram.vendor} · Type: {selectedProgram.rebateType}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={newForm.startDate} onChange={(e) => setNewForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
                    <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={newForm.endDate} onChange={(e) => setNewForm((f) => ({ ...f, endDate: e.target.value }))} /></div>
                  </div>

                  {/* Rebate Amount - Dynamic per type */}
                  <div className="grid gap-3">
                    <Label>Rebate Amount{selectedRebateTypes.length > 1 ? "s" : ""}{selectedProgram ? ` (${selectedProgram.rebateType})` : ""}</Label>
                    {!selectedProgram ? (
                      <p className="text-xs text-muted-foreground italic">Select a rebate program to enter amounts</p>
                    ) : (
                      selectedRebateTypes.map((type) => (
                        <div key={type} className="grid gap-1">
                          <span className="text-xs text-muted-foreground font-medium">{getRebateAmountLabel(type)}</span>
                          <div className="flex items-center gap-1">
                            {getRebateAmountPrefix(type) && (
                              <span className="text-sm font-medium text-muted-foreground">{getRebateAmountPrefix(type)}</span>
                            )}
                            <Input
                              placeholder={getRebateAmountPlaceholder(type)}
                              value={newForm.rebateAmounts[type] || ""}
                              onChange={(e) => setNewForm((f) => ({
                                ...f,
                                rebateAmounts: { ...f.rebateAmounts, [type]: e.target.value },
                              }))}
                              className="flex-1"
                            />
                            {getRebateAmountSuffix(type) && (
                              <span className="text-sm font-medium text-muted-foreground">{getRebateAmountSuffix(type)}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button disabled={busy||query.isPending} onClick={handleAddItem}>Add Item</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UPC</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Rebate Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Rebate Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.upc}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-xs">{item.programName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.rebateType}</Badge></TableCell>
                  <TableCell className="text-xs">{item.startDate}</TableCell>
                  <TableCell className="text-xs">{item.endDate}</TableCell>
                  <TableCell className="font-medium">{item.rebateAmount}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditItem({ ...item })}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCloneItem(item)}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteItem(item)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage} />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Rebate Item</DialogTitle></DialogHeader>{error&&<p role="alert" className="text-destructive">{error}</p>}
          {editItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Item</Label>
                <Input value={`${editItem.itemName} (${editItem.upc})`} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label>Rebate Program</Label>
                <Select
                  disabled value={editItem.programId}
                  onValueChange={(v) => {
                    const prog = availablePrograms.find((p) => p.id === v);
                    if (prog) {
                      setEditItem({ ...editItem, programId: prog.id, programName: prog.name, rebateType: prog.rebateType, rebateProvider: prog.vendor, rebateAmount: "" });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availablePrograms.filter((p) => p.status !== "Inactive" && p.status !== "Expired").map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>{prog.name} ({prog.rebateType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={editItem.startDate} onChange={(e) => setEditItem({ ...editItem, startDate: e.target.value })} /></div>
                <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={editItem.endDate} onChange={(e) => setEditItem({ ...editItem, endDate: e.target.value })} /></div>
              </div>
              <div className="grid gap-2">
                <Label>Rebate Amount ({editItem.rebateType})</Label>
                <Input
                  placeholder={getRebateAmountPlaceholder(editItem.rebateType)}
                  value={editItem.rebateAmount}
                  onChange={(e) => setEditItem({ ...editItem, rebateAmount: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
                <Button disabled={busy} onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Rebate Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <span className="font-semibold text-foreground">"{deleteItem?.itemName}"</span>? The link history is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy} onClick={e=>{e.preventDefault();void handleDeleteItem();}}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
