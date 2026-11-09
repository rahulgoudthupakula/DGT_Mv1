import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Download, Eye, FileText, PackageCheck, Plus, Search, Send, ShoppingCart, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { pricebookItems, type PricebookItem } from "@/data/pricebookItems";
import { useItemStock } from "@/hooks/useItemStock";
import { useAppNavigation } from "@/contexts/NavigationContext";
import { addLinesToPurchaseOrder, createPurchaseOrder, loadPurchaseOrders, updatePurchaseOrderStatus, type PurchaseOrder, type PurchaseOrderLineInput, type PurchaseOrderSource, type PurchaseOrderStatus } from "@/lib/purchaseOrders";

const TARGET_DAYS = 14;
const casePackFor = (item: PricebookItem) => item.dept === "Beverage" ? 24 : item.dept === "Grocery" ? 12 : 6;
const dailySalesFor = (item: PricebookItem) => Math.max(1, Math.round(item.retail * 2.4));
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const vendors = [...new Set(pricebookItems.map((item) => item.vendor))].sort();

const statusVariant = (status: PurchaseOrderStatus) => {
  if (status === "Received") return "default";
  if (status === "Cancelled") return "destructive";
  return "secondary";
};

interface ProductOrderRow {
  item: PricebookItem;
  stock: number;
  dailySales: number;
  daysLeft: number;
  casePack: number;
  suggested: number;
}

function ProductOrderTable({ rows, quantities, onQuantityChange, suggested, onRemove }: {
  rows: ProductOrderRow[];
  quantities: Record<string, number>;
  onQuantityChange: (sku: string, quantity: number) => void;
  suggested: boolean;
  onRemove?: (sku: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader><TableRow className="bg-muted/50">
          <TableHead>Product</TableHead><TableHead>SKU / Barcode</TableHead><TableHead>Department</TableHead>
          <TableHead className="text-center">Current Stock</TableHead>{suggested && <TableHead className="text-center">Days Left</TableHead>}
          <TableHead className="text-center">Case Pack</TableHead>{suggested && <TableHead className="text-center">Suggested</TableHead>}
          <TableHead className="w-28 text-center">Order Qty</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead className="text-right">Line Total</TableHead>{onRemove && <TableHead className="w-12"><span className="sr-only">Remove</span></TableHead>}
        </TableRow></TableHeader>
        <TableBody>{rows.map((row) => {
          const quantity = quantities[row.item.sku] ?? 0;
          return <TableRow key={row.item.sku} className={row.stock === 0 ? "bg-destructive/5" : undefined}>
            <TableCell><div className="font-medium">{row.item.name}</div>{row.stock === 0 && <Badge variant="destructive" className="mt-1">Out of stock</Badge>}</TableCell>
            <TableCell><div className="font-mono text-xs">{row.item.sku}</div><div className="text-xs text-muted-foreground">{row.item.barcode}</div></TableCell>
            <TableCell>{row.item.dept}<div className="text-xs text-muted-foreground">{row.item.category}</div></TableCell>
            <TableCell className="text-center font-medium">{row.stock}</TableCell>
            {suggested && <TableCell className="text-center">{row.daysLeft.toFixed(1)}</TableCell>}
            <TableCell className="text-center">{row.casePack}</TableCell>
            {suggested && <TableCell className="text-center font-semibold text-primary">{row.suggested}</TableCell>}
            <TableCell><Input type="number" min={0} step={row.casePack} value={quantity} onChange={(event) => onQuantityChange(row.item.sku, Math.max(0, Number(event.target.value)))} className="h-8 text-center" /></TableCell>
            <TableCell className="text-right">{money(row.item.cost)}</TableCell><TableCell className="text-right font-medium">{money(quantity * row.item.cost)}</TableCell>{onRemove && <TableCell><Button variant="ghost" size="icon" title="Remove item" onClick={() => onRemove(row.item.sku)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>}
          </TableRow>;
        })}</TableBody>
      </Table>
    </div>
  );
}

export const PurchaseOrdersPage = () => {
  const { stock } = useItemStock();
  const { navigateTo } = useAppNavigation();
  const [tab, setTab] = useState("suggested");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [suggestedQty, setSuggestedQty] = useState<Record<string, number>>({});
  const [guideAddVendor, setGuideAddVendor] = useState<string | null>(null);
  const [guideAddSearch, setGuideAddSearch] = useState("");
  const [guideAddQty, setGuideAddQty] = useState<Record<string, number>>({});
  const [addedGuideItems, setAddedGuideItems] = useState<Record<string, string[]>>({});
  const [removedGuideItems, setRemovedGuideItems] = useState<string[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [addItemsOrder, setAddItemsOrder] = useState<PurchaseOrder | null>(null);
  const [addItemsSearch, setAddItemsSearch] = useState("");
  const [addItemsQty, setAddItemsQty] = useState<Record<string, number>>({});
  const [createContext, setCreateContext] = useState<{ vendor: string; source: PurchaseOrderSource; rows: ProductOrderRow[]; quantities: Record<string, number> } | null>(null);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");

  const productRows = useMemo<ProductOrderRow[]>(() => pricebookItems.map((item) => {
    const currentStock = stock[item.sku] ?? 0;
    const dailySales = dailySalesFor(item);
    const pack = casePackFor(item);
    const needed = Math.max(0, TARGET_DAYS * dailySales - currentStock);
    return { item, stock: currentStock, dailySales, daysLeft: currentStock / dailySales, casePack: pack, suggested: needed ? Math.ceil(needed / pack) * pack : 0 };
  }), [stock]);

  useEffect(() => {
    setSuggestedQty((current) => {
      if (Object.keys(current).length) return current;
      return Object.fromEntries(productRows.map((row) => [row.item.sku, row.suggested]));
    });
  }, [productRows]);

  const refreshOrders = useCallback(async () => {
    setLoadingOrders(true);
    try { setOrders(await loadPurchaseOrders()); } catch { toast.error("Purchase orders could not be loaded."); }
    finally { setLoadingOrders(false); }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const vendorGroups = useMemo(() => vendors.map((vendor) => {
    const added = addedGuideItems[vendor] ?? [];
    const rows = productRows.filter((row) => row.item.vendor === vendor && !removedGuideItems.includes(row.item.sku) && (row.suggested > 0 || added.includes(row.item.sku)));
    const totalQuantity = rows.reduce((sum, row) => sum + (suggestedQty[row.item.sku] ?? row.suggested), 0);
    const totalValue = rows.reduce((sum, row) => sum + (suggestedQty[row.item.sku] ?? row.suggested) * row.item.cost, 0);
    return { vendor, rows, totalQuantity, totalValue };
  }).filter((group) => group.rows.length), [addedGuideItems, productRows, removedGuideItems, suggestedQty]);

  const addProductsToGuide = () => {
    if (!guideAddVendor) return;
    const selected = Object.entries(guideAddQty).filter(([, quantity]) => quantity > 0);
    if (!selected.length) { toast.error("Enter a quantity for at least one product."); return; }
    setAddedGuideItems((current) => ({ ...current, [guideAddVendor]: [...new Set([...(current[guideAddVendor] ?? []), ...selected.map(([sku]) => sku)])] }));
    setRemovedGuideItems((current) => current.filter((sku) => !selected.some(([selectedSku]) => selectedSku === sku)));
    setSuggestedQty((current) => ({ ...current, ...Object.fromEntries(selected) }));
    setExpandedVendor(guideAddVendor);
    setGuideAddVendor(null);
    setGuideAddQty({});
  };

  const openCreate = (vendor: string, source: PurchaseOrderSource, rows: ProductOrderRow[], quantities: Record<string, number>) => {
    if (!rows.some((row) => (quantities[row.item.sku] ?? 0) > 0)) { toast.error("Enter a quantity for at least one product."); return; }
    setCreateContext({ vendor, source, rows, quantities }); setExpectedDate(""); setNotes("");
  };

  const confirmCreate = async () => {
    if (!createContext) return;
    const lines: PurchaseOrderLineInput[] = createContext.rows.map((row) => ({ sku: row.item.sku, barcode: row.item.barcode, itemName: row.item.name, department: row.item.dept, orderedQuantity: createContext.quantities[row.item.sku] ?? 0, casePackSize: row.casePack, unitCost: row.item.cost }));
    try {
      const order = await createPurchaseOrder({ vendor: createContext.vendor, source: createContext.source, expectedDeliveryDate: expectedDate, notes, lines });
      toast.success(`${order.po_number} created as a draft.`); setCreateContext(null); await refreshOrders(); setTab("history");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Purchase order could not be created."); }
  };

  const changeStatus = async (order: PurchaseOrder, status: PurchaseOrderStatus) => {
    try { await updatePurchaseOrderStatus(order.id, status); toast.success(`${order.poNumber} updated to ${status}.`); setSelectedOrder(null); await refreshOrders(); }
    catch { toast.error("Purchase order status could not be updated."); }
  };

  const saveAddedItems = async () => {
    if (!addItemsOrder) return;
    const vendorRows = productRows.filter((row) => row.item.vendor === addItemsOrder.vendor);
    const lines = vendorRows.map((row) => ({
      sku: row.item.sku,
      barcode: row.item.barcode,
      itemName: row.item.name,
      department: row.item.dept,
      orderedQuantity: addItemsQty[row.item.sku] ?? 0,
      casePackSize: row.casePack,
      unitCost: row.item.cost,
    }));
    try {
      await addLinesToPurchaseOrder(addItemsOrder, lines);
      toast.success("Items added and purchase order totals updated.");
      setAddItemsOrder(null);
      setAddItemsQty({});
      await refreshOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Items could not be added.");
    }
  };

  const filteredOrders = orders.filter((order) => (statusFilter === "all" || order.status === statusFilter) && (vendorFilter === "all" || order.vendor === vendorFilter) && (!historySearch || `${order.poNumber} ${order.vendor}`.toLowerCase().includes(historySearch.toLowerCase())));

  const downloadOrder = (order: PurchaseOrder) => {
    const rows = [["PO", order.poNumber], ["Vendor", order.vendor], ["Status", order.status], [], ["SKU", "Product", "Ordered", "Received", "Unit Cost", "Total"], ...order.lines.map((line) => [line.sku, line.itemName, line.orderedQuantity, line.receivedQuantity, line.unitCost, line.lineTotal])];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.href = url; link.download = `${order.poNumber}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1><p className="mt-1 text-sm text-muted-foreground">Plan vendor orders, create purchase orders, and track receiving.</p></div>
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList><TabsTrigger value="suggested">Suggested Order Guide</TabsTrigger><TabsTrigger value="history">PO History</TabsTrigger></TabsList>
      <TabsContent value="suggested" className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Vendors to Order</p><p className="text-2xl font-bold">{vendorGroups.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Products Needing Order</p><p className="text-2xl font-bold">{vendorGroups.reduce((sum, group) => sum + group.rows.length, 0)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Estimated Order Value</p><p className="text-2xl font-bold">{money(vendorGroups.reduce((sum, group) => sum + group.totalValue, 0))}</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="text-base">Recommended orders by vendor</CardTitle></CardHeader><CardContent className="p-0">
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead className="text-center">Items to Reorder</TableHead><TableHead className="text-center">Suggested Units</TableHead><TableHead className="text-right">Estimated Value</TableHead><TableHead>Minimum Status</TableHead><TableHead>Next Order</TableHead></TableRow></TableHeader>
          <TableBody>{vendorGroups.map((group) => <Fragment key={group.vendor}><TableRow className="cursor-pointer" onClick={() => setExpandedVendor(expandedVendor === group.vendor ? null : group.vendor)}><TableCell className="font-semibold"><span className="flex items-center gap-2">{expandedVendor === group.vendor ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{group.vendor}</span></TableCell><TableCell className="text-center">{group.rows.length}</TableCell><TableCell className="text-center">{group.totalQuantity}</TableCell><TableCell className="text-right font-medium">{money(group.totalValue)}</TableCell><TableCell><Badge variant={group.totalValue >= 100 ? "default" : "secondary"}>{group.totalValue >= 100 ? "Minimum met" : `${money(100 - group.totalValue)} remaining`}</Badge></TableCell><TableCell>{format(new Date(Date.now() + 2 * 86400000), "MMM d, yyyy")}</TableCell></TableRow>
          {expandedVendor === group.vendor && <TableRow><TableCell colSpan={6} className="bg-muted/20 p-4"><ProductOrderTable rows={group.rows} quantities={suggestedQty} onQuantityChange={(sku, quantity) => setSuggestedQty((current) => ({ ...current, [sku]: quantity }))} suggested onRemove={(sku) => setRemovedGuideItems((current) => [...new Set([...current, sku])])} /><div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => { setGuideAddVendor(group.vendor); setGuideAddSearch(""); setGuideAddQty({}); }}><Plus className="mr-2 h-4 w-4" />Add Item</Button><Button onClick={() => openCreate(group.vendor, "Suggested Order Guide", group.rows, suggestedQty)}><ShoppingCart className="mr-2 h-4 w-4" />Create Purchase Order</Button></div></TableCell></TableRow>}</Fragment>)}</TableBody></Table></div>
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="history" className="mt-5 space-y-4">
        <Card><CardContent className="grid gap-4 p-4 md:grid-cols-3"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search PO or vendor" className="pl-9" /></div><Select value={vendorFilter} onValueChange={setVendorFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Vendors</SelectItem>{vendors.map((vendor) => <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{["Draft", "Submitted", "Partially Received", "Received", "Cancelled"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></CardContent></Card>
        <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>PO Number</TableHead><TableHead>Vendor</TableHead><TableHead>Order Date</TableHead><TableHead>Expected Delivery</TableHead><TableHead className="text-center">Items</TableHead><TableHead className="text-center">Quantity</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {loadingOrders ? <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Loading purchase orders…</TableCell></TableRow> : filteredOrders.length === 0 ? <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No purchase orders found.</TableCell></TableRow> : filteredOrders.map((order) => <TableRow key={order.id}><TableCell className="font-mono font-medium">{order.poNumber}</TableCell><TableCell>{order.vendor}</TableCell><TableCell>{format(new Date(`${order.orderDate}T12:00:00`), "MMM d, yyyy")}</TableCell><TableCell>{order.expectedDeliveryDate ? format(new Date(`${order.expectedDeliveryDate}T12:00:00`), "MMM d, yyyy") : "—"}</TableCell><TableCell className="text-center">{order.totalItems}</TableCell><TableCell className="text-center">{order.totalQuantity}</TableCell><TableCell className="text-right font-medium">{money(order.totalValue)}</TableCell><TableCell><Badge variant={statusVariant(order.status)}>{order.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="View" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4" /></Button>{order.status === "Draft" && <><Button variant="ghost" size="icon" title="Add Items" onClick={() => { setAddItemsOrder(order); setAddItemsQty({}); setAddItemsSearch(""); }}><Plus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Submit" onClick={() => changeStatus(order, "Submitted")}><Send className="h-4 w-4" /></Button></>}<Button variant="ghost" size="icon" title="Download" onClick={() => downloadOrder(order)}><Download className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
        </TableBody></Table></div></CardContent></Card>
      </TabsContent>
    </Tabs>

    <Dialog open={!!createContext} onOpenChange={(open) => !open && setCreateContext(null)}><DialogContent><DialogHeader><DialogTitle>Create purchase order</DialogTitle><DialogDescription>{createContext?.vendor} · {createContext?.source}</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Expected delivery date</Label><Input type="date" value={expectedDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExpectedDate(event.target.value)} className="mt-2" /></div><div><Label>Notes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Vendor instructions or internal notes" className="mt-2" /></div></div><DialogFooter><Button variant="outline" onClick={() => setCreateContext(null)}>Cancel</Button><Button onClick={confirmCreate}>Create Draft PO</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!guideAddVendor} onOpenChange={(open) => !open && setGuideAddVendor(null)}><DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">{guideAddVendor && <><DialogHeader><DialogTitle>Add item for {guideAddVendor}</DialogTitle><DialogDescription>Search all products from this vendor and enter the quantity to add.</DialogDescription></DialogHeader><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={guideAddSearch} onChange={(event) => setGuideAddSearch(event.target.value)} placeholder="Search product, SKU, or barcode" className="pl-9" /></div><ProductOrderTable rows={productRows.filter((row) => row.item.vendor === guideAddVendor && (!guideAddSearch || `${row.item.name} ${row.item.sku} ${row.item.barcode}`.toLowerCase().includes(guideAddSearch.toLowerCase())))} quantities={guideAddQty} onQuantityChange={(sku, quantity) => setGuideAddQty((current) => ({ ...current, [sku]: quantity }))} suggested={false} /><DialogFooter><Button variant="outline" onClick={() => setGuideAddVendor(null)}>Cancel</Button><Button onClick={addProductsToGuide}><Plus className="mr-2 h-4 w-4" />Add Selected Items</Button></DialogFooter></>}</DialogContent></Dialog>

    <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">{selectedOrder && <><DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{selectedOrder.poNumber}</DialogTitle><DialogDescription>{selectedOrder.vendor} · Created from {selectedOrder.source}</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Status</p><Badge variant={statusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge></div><div><p className="text-xs text-muted-foreground">Order Date</p><p className="font-medium">{selectedOrder.orderDate}</p></div><div><p className="text-xs text-muted-foreground">Expected</p><p className="font-medium">{selectedOrder.expectedDeliveryDate ?? "Not set"}</p></div><div><p className="text-xs text-muted-foreground">Total</p><p className="font-medium">{money(selectedOrder.totalValue)}</p></div></div><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead className="text-center">Ordered</TableHead><TableHead className="text-center">Received</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{selectedOrder.lines.map((line) => <TableRow key={line.id}><TableCell>{line.itemName}</TableCell><TableCell className="font-mono text-xs">{line.sku}</TableCell><TableCell className="text-center">{line.orderedQuantity}</TableCell><TableCell className="text-center">{line.receivedQuantity}</TableCell><TableCell className="text-right">{money(line.unitCost)}</TableCell><TableCell className="text-right">{money(line.lineTotal)}</TableCell></TableRow>)}</TableBody></Table></div>{selectedOrder.notes && <div className="rounded-md bg-muted p-3 text-sm"><span className="font-medium">Notes: </span>{selectedOrder.notes}</div>}<DialogFooter className="flex-wrap gap-2">{selectedOrder.status === "Draft" && <><Button variant="outline" onClick={() => { setSelectedOrder(null); setAddItemsOrder(selectedOrder); setAddItemsQty({}); setAddItemsSearch(""); }}><Plus className="mr-2 h-4 w-4" />Add Items</Button><Button onClick={() => changeStatus(selectedOrder, "Submitted")}><Send className="mr-2 h-4 w-4" />Submit</Button></>}{["Submitted", "Partially Received"].includes(selectedOrder.status) && <Button onClick={() => navigateTo("Grocery", "Edit & view invoices")}><PackageCheck className="mr-2 h-4 w-4" />Receive Items</Button>}{!["Received", "Cancelled"].includes(selectedOrder.status) && <Button variant="destructive" onClick={() => changeStatus(selectedOrder, "Cancelled")}><XCircle className="mr-2 h-4 w-4" />Cancel PO</Button>}<Button variant="outline" onClick={() => downloadOrder(selectedOrder)}><Download className="mr-2 h-4 w-4" />Download</Button></DialogFooter></>}</DialogContent></Dialog>

    <Dialog open={!!addItemsOrder} onOpenChange={(open) => !open && setAddItemsOrder(null)}><DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">{addItemsOrder && <><DialogHeader><DialogTitle>Add items to {addItemsOrder.poNumber}</DialogTitle><DialogDescription>Only products supplied by {addItemsOrder.vendor} are available. Quantities for products already on the PO will be added to their current quantities.</DialogDescription></DialogHeader><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={addItemsSearch} onChange={(event) => setAddItemsSearch(event.target.value)} placeholder="Search product, SKU, or barcode" className="pl-9" /></div><ProductOrderTable rows={productRows.filter((row) => row.item.vendor === addItemsOrder.vendor && (!addItemsSearch || `${row.item.name} ${row.item.sku} ${row.item.barcode}`.toLowerCase().includes(addItemsSearch.toLowerCase())))} quantities={addItemsQty} onQuantityChange={(sku, quantity) => setAddItemsQty((current) => ({ ...current, [sku]: quantity }))} suggested={false} /><DialogFooter><Button variant="outline" onClick={() => setAddItemsOrder(null)}>Cancel</Button><Button onClick={saveAddedItems}><Plus className="mr-2 h-4 w-4" />Add Selected Items</Button></DialogFooter></>}</DialogContent></Dialog>
  </div>;
};