import { useState, useRef } from "react";
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { request,isPendingChange } from '@/lib/backend';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Calendar, X, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";



type ProductRule={productId:number;name:string;sku:string;quantity:number};
type SavedPromotion={id:number;version:string;name:string;type:string;products:ProductRule[];discountValue:number|null;buyQty:number|null;freeQty:number|null;start:string;end:string;status:string;active:boolean;expiredWithin30Days:boolean};
type Promotion=Omit<SavedPromotion,'products'> & {products:string[];rules:ProductRule[];discount:string};
const statusColors:Record<string,"default"|"outline"|"secondary"|"destructive">={Active:'default',Upcoming:'outline',Expired:'secondary',Inactive:'secondary'};
const emptyForm={name:'',type:'',products:[] as string[],quantities:{} as Record<string,string>,discountValue:'',buyQty:'',freeQty:'',bundlePrice:'',start:'',end:''};
export const PromotionsPage=({storeId}:{storeId:string})=>{
 const path=`/access/stores/${encodeURIComponent(storeId)}/promotions`,client=useQueryClient();
 const query=useQuery({queryKey:['promotions',storeId],queryFn:()=>request<{discountTypes:{value:string;label:string}[];promotions:SavedPromotion[];items:{id:number;name:string;sku:string;active:boolean}[];timezone:string}>(path),enabled:!!storeId,refetchInterval:60000});
 const pricebookItems=query.data?.items??[];
 const promotions:Promotion[]=(query.data?.promotions??[]).map(p=>({...p,rules:p.products,products:p.products.map(i=>p.type==='Bundle'?`${i.name} × ${i.quantity}`:i.name),discount:p.type==='Buy X Get Y'?`Buy ${p.buyQty} Get ${p.freeQty} — Mix & Match`:p.type==='% Discount'?`${p.discountValue}%`:p.type==='Bundle'?`Bundle $${p.discountValue?.toFixed(2)}`:`$${p.discountValue?.toFixed(2)}`}));
 const [open,setOpen]=useState(false),[form,setForm]=useState(emptyForm),[itemToAdd,setItemToAdd]=useState(''),[viewPromo,setViewPromo]=useState<Promotion|null>(null),[editPromo,setEditPromo]=useState<Promotion|null>(null),[deletePromo,setDeletePromo]=useState<Promotion|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const attempt=useRef({payload:'',key:''});
 const set=(patch:Partial<typeof emptyForm>)=>setForm(f=>({...f,...patch}));
 const availableItems=pricebookItems.filter(i=>i.active&&!form.products.includes(String(i.id)));
 const addProduct=()=>{if(!itemToAdd)return;setForm(f=>({...f,products:[...f.products,itemToAdd],quantities:{...f.quantities,[itemToAdd]:'1'}}));setItemToAdd('');};
 const removeProduct=(id:string)=>setForm(f=>({...f,products:f.products.filter(p=>p!==id)}));
 const openEdit=(p:Promotion)=>{setError('');setForm({name:p.name,type:p.type,products:p.rules.map(i=>String(i.productId)),quantities:Object.fromEntries(p.rules.map(i=>[String(i.productId),String(i.quantity)])),start:p.start,end:p.end,discountValue:p.discountValue==null?'':String(p.discountValue),bundlePrice:p.discountValue==null?'':String(p.discountValue),buyQty:p.buyQty==null?'':String(p.buyQty),freeQty:p.freeQty==null?'':String(p.freeQty)});setItemToAdd('');setEditPromo(p);};
 async function save(edit:boolean){
  setError('');if(!form.name.trim()||!form.type||!form.products.length||!form.start||!form.end){setError('Complete the name, type, products and dates.');return;}
  const raw=form.type==='Bundle'?form.bundlePrice:form.discountValue;
  if(form.type==='Buy X Get Y'?(!form.buyQty||!form.freeQty):raw===''){setError('Complete the discount details.');return;}
  const payload=JSON.stringify({name:form.name.trim(),type:form.type,products:form.products.map(id=>({productId:Number(id),quantity:form.type==='Bundle'?Number(form.quantities[id]):1})),discountValue:form.type==='Buy X Get Y'?null:Number(raw),buyQty:form.type==='Buy X Get Y'?Number(form.buyQty):null,freeQty:form.type==='Buy X Get Y'?Number(form.freeQty):null,start:form.start,end:form.end});
  if(attempt.current.payload!==payload)attempt.current={payload,key:crypto.randomUUID()};
  setBusy(true);try{const result=await request(edit?`${path}/${editPromo?.id}`:path,{method:edit?'PUT':'POST',headers:{'Idempotency-Key':attempt.current.key,...(edit?{'If-Match':editPromo!.version}:{})},body:payload});await client.invalidateQueries({queryKey:['promotions',storeId]});toast.success(isPendingChange(result)?'Submitted for approval.':'Promotion saved.');setOpen(false);setEditPromo(null);setForm(emptyForm);attempt.current={payload:'',key:''};}catch(e){setError(e instanceof Error?e.message:'Could not save promotion');}finally{setBusy(false);}
 }
 const handleCreate=()=>save(false),handleUpdate=()=>save(true);
 async function confirmDelete(){if(!deletePromo)return;setBusy(true);setError('');try{const result=await request(`${path}/${deletePromo.id}/deactivate`,{method:'POST',headers:{'If-Match':deletePromo.version,'Idempotency-Key':crypto.randomUUID()},body:'{}'});await client.invalidateQueries({queryKey:['promotions',storeId]});toast.success(isPendingChange(result)?'Submitted for approval.':'Promotion deactivated.');setDeletePromo(null);}catch(e){setError(e instanceof Error?e.message:'Could not deactivate promotion');}finally{setBusy(false);}}
 const activeCount=promotions.filter(p=>p.status==='Active').length,upcomingCount=promotions.filter(p=>p.status==='Upcoming').length,expiredCount=promotions.filter(p=>p.status==='Expired'&&p.expiredWithin30Days).length;
  return (
    <div className="space-y-6">
      {query.isPending&&<p>Loading promotions…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
      <p className="text-sm text-muted-foreground">Dates use {query.data?.timezone??'the store timezone'}; the end date is included. Checkout application will be connected with POS.</p>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promotions</h1>
          <p className="text-sm text-muted-foreground">Create and manage product-level promotions</p>
        </div>
        <Dialog open={open} onOpenChange={v=>{if(busy)return;setOpen(v);if(v){setForm(emptyForm);setItemToAdd('');setError('');attempt.current={payload:'',key:''};}}}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!query.data}><Plus className="h-4 w-4 mr-1" /> New Promotion</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Promotion</DialogTitle></DialogHeader>
            <fieldset disabled={busy} className="grid gap-4 py-4">
              {/* Promotion Name */}
              <div className="grid gap-1.5">
                <Label>Promotion Name</Label>
                <Input placeholder="e.g. Summer Drink Deal" value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </div>

              {/* Type */}
              <div className="grid gap-1.5">
                <Label>Discount Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => set({ type: v, discountValue: "", buyQty: "", freeQty: "", bundlePrice: "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Select discount type" /></SelectTrigger>
                  <SelectContent>
                    {(query.data?.discountTypes??[]).map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Products */}
              <div className="grid gap-1.5">
                <Label>Products</Label>{form.type==='Buy X Get Y'&&<p className="text-xs text-muted-foreground">Mix and match across the selected products.</p>}{form.type==='Bundle'&&<p className="text-xs text-muted-foreground">Use 1 of each, or change each product’s quantity below.</p>}
                <div className="flex gap-2">
                  <Select value={itemToAdd} onValueChange={setItemToAdd}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select product to add" /></SelectTrigger>
                    <SelectContent>
                      {availableItems.map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>{i.name} — {i.sku}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addProduct} disabled={!itemToAdd}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Added Items */}
                <div className="border rounded-md overflow-hidden mt-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">SKU</TableHead>
                        <TableHead>Item</TableHead>{form.type==='Bundle'&&<TableHead>Quantity</TableHead>}
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={form.type==='Bundle'?4:3} className="text-center text-muted-foreground py-4">
                            No items added yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        form.products.map((p) => {
                          const item = pricebookItems.find((i) => String(i.id) === p);
                          return (
                            <TableRow key={p}>
                              <TableCell className="text-xs font-medium">{item?.sku || "—"}</TableCell>
                              <TableCell>{item?.name??p}</TableCell>{form.type==='Bundle'&&<TableCell><Input aria-label={`Quantity for ${item?.name??p}`} type="number" min="1" step="1" value={form.quantities[p]??'1'} onChange={e=>set({quantities:{...form.quantities,[p]:e.target.value}})}/></TableCell>}
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => removeProduct(p)}
                                  className="rounded-sm hover:bg-muted p-1"
                                  aria-label={`Remove ${p}`}
                                >
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Dynamic Discount by type */}
              {form.type === "% Discount" && (
                <div className="grid gap-1.5">
                  <Label>Discount Percent (0–100)</Label>
                  <Input
                    type="number" min={0} max={100} placeholder="e.g. 10"
                    value={form.discountValue}
                    onChange={(e) => set({ discountValue: e.target.value })}
                  />
                </div>
              )}
              {form.type === "Fixed Price" && (
                <div className="grid gap-1.5">
                  <Label>Promotional Price per Item ($)</Label>
                  <Input
                    type="number" min={0} step="0.01" placeholder="e.g. 0.99"
                    value={form.discountValue}
                    onChange={(e) => set({ discountValue: e.target.value })}
                  />
                </div>
              )}
              {form.type === "Buy X Get Y" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Buy Quantity (X)</Label>
                    <Input type="number" min={1} placeholder="e.g. 2" value={form.buyQty} onChange={(e) => set({ buyQty: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Free Quantity (Y)</Label>
                    <Input type="number" min={1} placeholder="e.g. 1" value={form.freeQty} onChange={(e) => set({ freeQty: e.target.value })} />
                  </div>
                </div>
              )}
              {form.type === "Bundle" && (
                <div className="grid gap-1.5">
                  <Label>Bundle Price ($)</Label>
                  <Input
                    type="number" min={0} step="0.01" placeholder="e.g. 4.99"
                    value={form.bundlePrice}
                    onChange={(e) => set({ bundlePrice: e.target.value })}
                  />
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Start Date</Label><Input type="date" value={form.start} onChange={(e) => set({ start: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>End Date</Label><Input type="date" value={form.end} onChange={(e) => set({ end: e.target.value })} /></div>
              </div>

              {error&&<p role="alert">{error}</p>}<div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create Promotion</Button>
              </div>
            </fieldset>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Promotions", value: String(activeCount), icon: Tag },
          { label: "Upcoming", value: String(upcomingCount), icon: Calendar },
          { label: "Expired (30d)", value: String(expiredCount), icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <Icon className="h-8 w-8 text-primary opacity-70" />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Promotion List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Discount Type</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.length===0&&<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No promotions for this store yet.</TableCell></TableRow>}
              {promotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {p.products.map((prod,index) => (
                        <Badge key={index} variant="secondary" className="text-[11px]">{prod}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-primary">{p.discount}</TableCell>
                  <TableCell className="text-sm">{p.start}</TableCell>
                  <TableCell className="text-sm">{p.end}</TableCell>
                  <TableCell><Badge variant={statusColors[p.status] || "outline"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewPromo(p)} aria-label="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!p.active} onClick={() => {attempt.current={payload:'',key:''};openEdit(p);}} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!p.active} onClick={() => {setError('');setDeletePromo(p);}} aria-label="Deactivate">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
           </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewPromo} onOpenChange={(v) => !v && setViewPromo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Promotion Details</DialogTitle></DialogHeader>
          {viewPromo && (
            <div className="grid gap-3 py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-medium">{viewPromo.id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{viewPromo.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount Type</span><Badge variant="outline">{viewPromo.type}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium text-primary">{viewPromo.discount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{viewPromo.start}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">End</span><span>{viewPromo.end}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={statusColors[viewPromo.status] || "outline"}>{viewPromo.status}</Badge></div>
              <div>
                <p className="text-muted-foreground mb-1">Products</p>
                <div className="flex flex-wrap gap-1">
                  {viewPromo.products.map((prod,index) => (
                    <Badge key={index} variant="secondary" className="text-[11px]">{prod}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPromo} onOpenChange={(v) => { if (!v&&!busy) { setEditPromo(null); setForm(emptyForm); setItemToAdd(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Promotion</DialogTitle></DialogHeader>
          <fieldset disabled={busy} className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label>Promotion Name</Label>
              <Input placeholder="e.g. Summer Drink Deal" value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </div>

            <div className="grid gap-1.5">
              <Label>Discount Type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v, discountValue: "", buyQty: "", freeQty: "", bundlePrice: "" })}>
                <SelectTrigger><SelectValue placeholder="Select discount type" /></SelectTrigger>
                <SelectContent>
                  {(query.data?.discountTypes??[]).map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Products</Label>{form.type==='Buy X Get Y'&&<p className="text-xs text-muted-foreground">Mix and match across the selected products.</p>}{form.type==='Bundle'&&<p className="text-xs text-muted-foreground">Use 1 of each, or change each product’s quantity below.</p>}
              <div className="flex gap-2">
                <Select value={itemToAdd} onValueChange={setItemToAdd}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select product to add" /></SelectTrigger>
                  <SelectContent>
                    {availableItems.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.name} — {i.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addProduct} disabled={!itemToAdd}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="border rounded-md overflow-hidden mt-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">SKU</TableHead>
                      <TableHead>Item</TableHead>{form.type==='Bundle'&&<TableHead>Quantity</TableHead>}
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={form.type==='Bundle'?4:3} className="text-center text-muted-foreground py-4">No items added yet</TableCell>
                      </TableRow>
                    ) : (
                      form.products.map((p) => {
                        const item = pricebookItems.find((i) => String(i.id) === p);
                        return (
                          <TableRow key={p}>
                            <TableCell className="text-xs font-medium">{item?.sku || "—"}</TableCell>
                            <TableCell>{item?.name??p}</TableCell>{form.type==='Bundle'&&<TableCell><Input aria-label={`Quantity for ${item?.name??p}`} type="number" min="1" step="1" value={form.quantities[p]??'1'} onChange={e=>set({quantities:{...form.quantities,[p]:e.target.value}})}/></TableCell>}
                            <TableCell>
                              <button type="button" onClick={() => removeProduct(p)} className="rounded-sm hover:bg-muted p-1" aria-label={`Remove ${p}`}>
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {form.type === "% Discount" && (
              <div className="grid gap-1.5">
                <Label>Discount Percent (0–100)</Label>
                <Input type="number" min={0} max={100} placeholder="e.g. 10" value={form.discountValue} onChange={(e) => set({ discountValue: e.target.value })} />
              </div>
            )}
            {form.type === "Fixed Price" && (
              <div className="grid gap-1.5">
                <Label>Promotional Price per Item ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="e.g. 0.99" value={form.discountValue} onChange={(e) => set({ discountValue: e.target.value })} />
              </div>
            )}
            {form.type === "Buy X Get Y" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Buy Quantity (X)</Label>
                  <Input type="number" min={1} placeholder="e.g. 2" value={form.buyQty} onChange={(e) => set({ buyQty: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Free Quantity (Y)</Label>
                  <Input type="number" min={1} placeholder="e.g. 1" value={form.freeQty} onChange={(e) => set({ freeQty: e.target.value })} />
                </div>
              </div>
            )}
            {form.type === "Bundle" && (
              <div className="grid gap-1.5">
                <Label>Bundle Price ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="e.g. 4.99" value={form.bundlePrice} onChange={(e) => set({ bundlePrice: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Start Date</Label><Input type="date" value={form.start} onChange={(e) => set({ start: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>End Date</Label><Input type="date" value={form.end} onChange={(e) => set({ end: e.target.value })} /></div>
            </div>

            {error&&<p role="alert">{error}</p>}<div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setEditPromo(null); setForm(emptyForm); setItemToAdd(""); }}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </fieldset>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePromo} onOpenChange={(v) => !v && !busy && setDeletePromo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deletePromo?.name}</strong>. Its details and linked products will remain available for history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error&&<p role="alert">{error}</p>}<AlertDialogFooter>
            <AlertDialogCancel disabled={busy} onClick={() => setDeletePromo(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={e=>{e.preventDefault();void confirmDelete();}} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
