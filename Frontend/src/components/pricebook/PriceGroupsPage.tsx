import { Fragment, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layers, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { request,isPendingChange } from '@/lib/backend';

interface GroupItem {
  id: number;
  groupId?: number;
  sku: string;
  name: string;
  cost: number | null;
  retail: number;
}

interface PriceGroup {
  id: number;
  version: string;
  active: boolean;
  name: string;
  description: string;
  groupPrice: number;
  items: GroupItem[];
}

const formatCurrency = (value: number | null) => value == null ? "" : `$${value.toFixed(2)}`;

export const PriceGroupsPage = ({storeId}:{storeId:string}) => {
  const path=`/access/stores/${storeId}/price-groups`,client=useQueryClient();
  const query=useQuery({queryKey:['price-groups',storeId],queryFn:()=>request<{groups:PriceGroup[];items:GroupItem[]}>(path),enabled:!!storeId});
  const groups=query.data?.groups??[],pricebookItems=query.data?.items??[];
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const attempt=useRef({payload:'',key:''});
  async function refresh(){await Promise.all([client.invalidateQueries({queryKey:['price-groups',storeId]}),client.invalidateQueries({queryKey:['pricebook-items']}),client.invalidateQueries({queryKey:['bulk-item-options',storeId]})]);}
  async function persist(edit:boolean){
    const f=edit?{...editForm,groupPrice:editForm.newGroupPrice}:newForm;
    if(!f.name.trim()||f.groupPrice.trim()===''||!Number.isFinite(Number(f.groupPrice))||Number(f.groupPrice)<0){setError('Enter a name and valid group price.');return;}
    const payload=JSON.stringify({name:f.name.trim(),description:f.description,groupPrice:Number(f.groupPrice),products:(edit?editItems:newItems).map(i=>i.id)});
    if(attempt.current.payload!==payload)attempt.current={payload,key:crypto.randomUUID()};
    setBusy(true);setError('');try{const result=await request(edit?`${path}/${editGroup!.id}`:path,{method:edit?'PUT':'POST',headers:{'Idempotency-Key':attempt.current.key,...(edit?{'If-Match':editGroup!.version}:{})},body:payload});await refresh();toast.success(isPendingChange(result)?'Submitted for approval.':'Price group saved; regular retail prices unchanged.');setOpen(false);setEditGroup(null);setNewForm({name:'',description:'',groupPrice:''});setNewItems([]);attempt.current={payload:'',key:''};}catch(e){setError(e instanceof Error?e.message:'Could not save');}finally{setBusy(false);}
  }

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editGroup, setEditGroup] = useState<PriceGroup | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<PriceGroup | null>(null);

  const [newForm, setNewForm] = useState({ name: "", description: "", groupPrice: "" });
  const [newItems, setNewItems] = useState<GroupItem[]>([]);
  const [newItemSku, setNewItemSku] = useState("");

  const [editForm, setEditForm] = useState({ name: "", description: "", newGroupPrice: "" });
  const [editItems, setEditItems] = useState<GroupItem[]>([]);
  const [editItemSku, setEditItemSku] = useState("");

  const availableItems = (selectedSkus: string[]) =>
    pricebookItems.filter((i) => !selectedSkus.includes(String(i.id)) && (!i.groupId || i.groupId === editGroup?.id));

  const updateItemPrices = (items: GroupItem[], price: number) =>
    items.map((it) => ({ ...it, retail: price }));

  const openEdit = (g: PriceGroup) => {
    setEditForm({ name: g.name, description: g.description, newGroupPrice: String(g.groupPrice) });
    setEditItems(g.items.map((it) => ({ ...it, retail: g.groupPrice })));
    setEditItemSku("");
    setEditGroup(g);
  };

  const createGroup = () => persist(false);
  const saveEdit = () => persist(true);

  const addItem = (sku: string, target: "new" | "edit") => {
    if (!sku) return;
    const source = target === "new" ? newItems : editItems;
    if (source.some((it) => String(it.id) === sku)) {
      toast.error("Item already added");
      return;
    }
    const item = pricebookItems.find((i) => String(i.id) === sku);
    if (!item) return;
    const price = target === "new" ? parseFloat(newForm.groupPrice) : parseFloat(editForm.newGroupPrice);
    const retail = isNaN(price) ? item.retail : price;
    const newItem = { id:item.id, sku: item.sku, name: item.name, cost: item.cost, retail };
    if (target === "new") {
      setNewItems((prev) => [...prev, newItem]);
      setNewItemSku("");
    } else {
      setEditItems((prev) => [...prev, newItem]);
      setEditItemSku("");
    }
  };

  const removeItem = (sku: string, target: "new" | "edit") => {
    if (target === "new") {
      setNewItems((prev) => prev.filter((it) => String(it.id) !== sku));
    } else {
      setEditItems((prev) => prev.filter((it) => String(it.id) !== sku));
    }
  };

  const confirmDelete = async () => {
    if(!deleteGroup)return;setBusy(true);setError('');try{const result=await request(`${path}/${deleteGroup.id}/deactivate`,{method:'POST',headers:{'If-Match':deleteGroup.version,'Idempotency-Key':crypto.randomUUID()},body:'{}'});await refresh();toast.success(isPendingChange(result)?'Submitted for approval.':'Group deactivated; regular retail prices now apply.');setDeleteGroup(null);}catch(e){setError(e instanceof Error?e.message:'Could not deactivate');}finally{setBusy(false);}
  };

  const totalItems = groups.filter(g=>g.active).reduce((s, g) => s + g.items.length, 0);
  const avgGroupPrice = groups.length
    ? Math.round((groups.reduce((s, g) => s + g.groupPrice, 0) / groups.length) * 100) / 100
    : 0;

  const AddedItemsTable = ({ items, target }: { items: GroupItem[];target?: "new" | "edit" }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Cost</TableHead>
          <TableHead className="text-right">Selling Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
              No items added yet
            </TableCell>
          </TableRow>
        ) : (
          items.map((it) => (
            <TableRow key={it.id}>
              <TableCell className="text-xs font-medium">{it.sku}</TableCell>
              <TableCell>{it.name}</TableCell>
              <TableCell className="text-right">{formatCurrency(it.cost)}</TableCell>
              <TableCell className="text-right font-medium text-primary">{formatCurrency(it.retail)}{target&&<Button variant="ghost" size="sm" onClick={()=>removeItem(String(it.id),target)}>Remove</Button>}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {query.isPending&&<p>Loading price groups…</p>}{query.error&&<p role="alert">{query.error.message}</p>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Price Groups</h1>
          <p className="text-sm text-muted-foreground">Open a group to see its items and update their selling price together</p>
        </div>
        <Dialog open={open} onOpenChange={v=>{if(busy)return;setOpen(v);setError('');if(v){setEditGroup(null);}}}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!query.data}><Plus className="h-4 w-4 mr-1" /> New Price Group</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>{error&&<p role="alert">{error}</p>}<DialogTitle>Create Price Group</DialogTitle></DialogHeader>
            <fieldset disabled={busy} className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                <Label>Group Name</Label>
                <Input
                  placeholder="e.g. Premium Beverages"
                  value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of this group"
                  value={newForm.description}
                  onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Group Price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 1.99"
                  value={newForm.groupPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewForm((f) => ({ ...f, groupPrice: value }));
                    const price = parseFloat(value);
                    if (!isNaN(price) && price >= 0) {
                      setNewItems((prev) => updateItemPrices(prev, price));
                    }
                  }}
                />
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Add Items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="grid gap-1.5 flex-1">
                      <Label className="text-xs">Select Item</Label>
                      <Select value={newItemSku} onValueChange={(value) => setNewItemSku(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableItems(newItems.map((i) => String(i.id))).map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.name} ({item.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" onClick={() => addItem(newItemSku, "new")} disabled={!newItemSku}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Added Items ({newItems.length})</CardTitle></CardHeader>
                <CardContent>
                  <AddedItemsTable items={newItems} target="new" />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createGroup}>Create Group</Button>
              </div>
            </fieldset>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Groups", value: groups.length.toString() },
          { label: "Total Items Assigned", value: totalItems.toLocaleString() },
          { label: "Avg. Group Price", value: formatCurrency(avgGroupPrice) },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <Layers className="h-8 w-8 text-primary opacity-70" />
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Price Group List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-right">#</TableHead>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">No. of Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g, idx) => {
                const isOpen = expanded === g.id;
                return (
                  <Fragment key={g.id}>
                    <TableRow>
                      <TableCell className="text-right text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{g.name}{!g.active&&<span className="ml-2 text-muted-foreground">Inactive</span>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.description}</TableCell>
                      <TableCell className="text-right font-medium">{g.items.length}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(isOpen ? null : g.id)} aria-label={isOpen ? "Hide Items" : "View Items"}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!g.active} onClick={() => {setError('');openEdit(g);}} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!g.active} onClick={() => {setError('');setDeleteGroup(g);}} aria-label="Deactivate">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          <AddedItemsTable items={g.items} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>{error&&<p role="alert">{error}</p>}<DialogTitle>Edit Price Group</DialogTitle></DialogHeader>
          <fieldset disabled={busy} className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label>Group Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Old Group Price</Label>
                <Input value={editGroup ? formatCurrency(editGroup.groupPrice) : ""} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label>New Group Price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm.newGroupPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditForm((f) => ({ ...f, newGroupPrice: value }));
                    const price = parseFloat(value);
                    if (!isNaN(price) && price >= 0) {
                      setEditItems((prev) => updateItemPrices(prev, price));
                    }
                  }}
                />
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Add Items</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="grid gap-1.5 flex-1">
                    <Label className="text-xs">Select Item</Label>
                    <Select value={editItemSku} onValueChange={(value) => setEditItemSku(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems(editItems.map((i) => String(i.id))).map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name} ({item.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={() => addItem(editItemSku, "edit")} disabled={!editItemSku}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Added Items ({editItems.length})</CardTitle></CardHeader>
              <CardContent>
                <AddedItemsTable items={editItems} target="edit" />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditGroup(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save Changes</Button>
            </div>
          </fieldset>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteGroup} onOpenChange={(o) => !o && setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>{error&&<p role="alert">{error}</p>}
            <AlertDialogTitle>Deactivate Price Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{deleteGroup?.name}"? Its items will use their regular retail prices. Group history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button disabled={busy} onClick={confirmDelete}>Deactivate</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
