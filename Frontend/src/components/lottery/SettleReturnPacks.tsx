import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileText,
  Lock,
} from "lucide-react";

interface SettlementPack {
  version:string; blockedReason:string;
  id: string;
  gameName: string;
  packNumber: string;
  ticketsSold: number;
  ticketsUnsold: number;
  grossSales: number;
  commission: number;
  netAmountDue: number;
  status: "ready" | "settling" | "settled" | "blocked";
  shiftClosed: boolean;
  hasGaps: boolean;
  settlementRef?: string;
  settledAt?: string;
  settledBy?: string;
}

interface ReturnablePack {
  version:string; blockedReason:string;
  id: string;
  gameName: string;
  packNumber: string;
  startTicket: string;
  lastSoldTicket: string;
  ticketsRemaining: number;
  packValue: number;
  status: "eligible" | "pending" | "returned" | "settled" | "blocked";
  returnType?: "full" | "partial";
  returnReason?: string;
  returnDate?: string;
  distributorRef?: string;
  approvedBy?: string;
  linkedSettlementId?: string;
}

interface DispositionData {settlementPacks:SettlementPack[];returnablePacks:ReturnablePack[];canSettle:boolean;canReturn:boolean;}
export const SettleReturnPacks = ({storeId}:{storeId:string}) => {
  const {toast}=useToast();const client=useQueryClient();
  const path=`/access/stores/${encodeURIComponent(storeId)}/lottery-dispositions`,key=['lottery-dispositions',storeId];
  const q=useQuery({queryKey:key,queryFn:()=>request<DispositionData>(path),enabled:!!storeId,retry:false});
  const settlementPacks=q.data?.settlementPacks??[],returnablePacks=q.data?.returnablePacks??[];
  const mutation=useMutation({mutationFn:(body:unknown)=>request<DispositionData>(path,{method:'POST',body:JSON.stringify(body)}),onSuccess:data=>{client.setQueryData(key,data);setSelectedSettlePacks([]);setReturnDialogOpen(false);void client.invalidateQueries({queryKey:['lottery-closing',storeId]});void client.invalidateQueries({queryKey:['lottery-verification',storeId]});toast({title:'Pack records saved'});},onError:e=>toast({title:'Not saved',description:e.message,variant:'destructive'})});
  const [selectedSettlePacks, setSelectedSettlePacks] = useState<string[]>([]);
  const [selectedReturnPacks, setSelectedReturnPacks] = useState<string[]>([]);

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [currentReturnPack, setCurrentReturnPack] = useState<ReturnablePack | null>(null);
  const [returnType, setReturnType] = useState<string>("");
  const [returnReason, setReturnReason] = useState<string>("");
  const [distributorRef, setDistributorRef] = useState<string>("");

  const selected=(ids:string[])=>ids.map(id=>{const p=settlementPacks.find(p=>p.id===id)!;return {id,version:p.version};});
  const handleSettlePack=(id:string)=>setSettleIds([id]);
  const [settleIds,setSettleIds]=useState<string[]>([]);
  const handleBulkSettle=()=>setSettleIds(selectedSettlePacks);
  const handleInitiateReturn=(pack:ReturnablePack)=>{setCurrentReturnPack(pack);setReturnType('');setReturnReason('');setDistributorRef('');setReturnDialogOpen(true);};
  const handleConfirmReturn=()=>{if(!currentReturnPack)return;mutation.mutate({action:'REQUEST_RETURN',packs:[{id:currentReturnPack.id,version:currentReturnPack.version}],returnType,reason:returnReason,reference:distributorRef});};
  const handleConfirmReturnStatus=(id:string)=>setConfirmReturnId(id);
  const [viewReturn,setViewReturn]=useState<ReturnablePack|null>(null);
  const [confirmReturnId,setConfirmReturnId]=useState<string|null>(null);
  const getSettlementStatusBadge = (pack: SettlementPack) => {
    if (pack.status === "settled") {
      return <Badge className="bg-green-100 text-green-800">Settled</Badge>;
    }
    if (pack.status === "blocked") {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Ready</Badge>;
  };

  const getReturnStatusBadge = (status: ReturnablePack["status"]) => {
    switch (status) {
      case "blocked": return <Badge variant="destructive">Blocked</Badge>;
      case "eligible":
        return <Badge className="bg-blue-100 text-blue-800">Eligible</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "returned":
        return <Badge className="bg-green-100 text-green-800">Returned</Badge>;
      case "settled":
        return <Badge className="bg-purple-100 text-purple-800">Settled</Badge>;
    }
  };

  const getBlockedReason = (pack: SettlementPack) => {
    return pack.blockedReason;
  };

  const settlementStats = {
    total: settlementPacks.length,
    ready: settlementPacks.filter(p => p.status === "ready").length,
    settled: settlementPacks.filter(p => p.status === "settled").length,
    totalAmount: settlementPacks.filter(p => p.status === "ready").reduce((sum, p) => sum + p.netAmountDue, 0),
  };

  const returnStats = {
    total: returnablePacks.length,
    eligible: returnablePacks.filter(p => p.status === "eligible").length,
    pending: returnablePacks.filter(p => p.status === "pending").length,
    returned: returnablePacks.filter(p => p.status === "returned").length,
  };

  if(q.isPending)return <p>Loading settle and return packs…</p>;
  if(q.error)return <p role="alert">{q.error.message} <Button onClick={()=>void q.refetch()}>Retry</Button></p>;
  return (
    <fieldset disabled={mutation.isPending} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settle & Return Packs</h1>
        <p className="text-muted-foreground">Finalize settlements and handle pack returns</p>
      </div>

      <Tabs defaultValue="settle" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="settle" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Settle Packs
          </TabsTrigger>
          <TabsTrigger value="return" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Return Packs
          </TabsTrigger>
        </TabsList>

        {/* Settle Packs Tab */}
        <TabsContent value="settle" className="space-y-6">
          {/* Settlement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Packs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{settlementStats.total}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Settle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{settlementStats.ready}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Settled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{settlementStats.settled}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">${settlementStats.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedSettlePacks.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedSettlePacks.length} pack(s) selected
                  </span>
                  <Button disabled={!q.data?.canSettle} onClick={handleBulkSettle} size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Bulk Settle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settlement Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eligible Packs for Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSettlePacks.length>0 && selectedSettlePacks.length === settlementPacks.filter(p => p.status === "ready").length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSettlePacks(settlementPacks.filter(p => p.status === "ready").map(p => p.id));
                          } else {
                            setSelectedSettlePacks([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Game Name</TableHead>
                    <TableHead>Pack / Book #</TableHead>
                    <TableHead className="text-right">Tickets Sold</TableHead>
                    <TableHead className="text-right">Tickets Unsold</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Amount Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!settlementPacks.length&&<TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No packs available for settlement.</TableCell></TableRow>}
                  {settlementPacks.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSettlePacks.includes(pack.id)}
                          disabled={pack.status !== "ready"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSettlePacks(prev => [...prev, pack.id]);
                            } else {
                              setSelectedSettlePacks(prev => prev.filter(id => id !== pack.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pack.gameName}</TableCell>
                      <TableCell>{pack.packNumber}</TableCell>
                      <TableCell className="text-right">{pack.ticketsSold}</TableCell>
                      <TableCell className="text-right">{pack.ticketsUnsold}</TableCell>
                      <TableCell className="text-right">${pack.grossSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">${pack.commission.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${pack.netAmountDue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getSettlementStatusBadge(pack)}
                          {pack.status === "blocked" && (
                            <p className="text-xs text-destructive">{getBlockedReason(pack)}</p>
                          )}
                          {pack.status === "settled" && (
                            <p className="text-xs text-muted-foreground">Ref: {pack.settlementRef}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pack.status === "ready" && (
                          <Button size="sm" disabled={!q.data?.canSettle} onClick={() => handleSettlePack(pack.id)}>
                            <DollarSign className="h-4 w-4 mr-1" />
                            Settle
                          </Button>
                        )}
                        {pack.status === "settled" && (
                          <Button size="sm" variant="outline" disabled>
                            <Lock className="h-4 w-4 mr-1" />
                            Locked
                          </Button>
                        )}
                        {pack.status === "blocked" && (
                          <Button size="sm" variant="ghost" disabled>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Blocked
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Return Packs Tab */}
        <TabsContent value="return" className="space-y-6">
          {/* Return Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Packs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{returnStats.total}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eligible for Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{returnStats.eligible}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{returnStats.pending}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{returnStats.returned}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Returnable Packs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Returnable Packs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game Name</TableHead>
                    <TableHead>Pack / Book #</TableHead>
                    <TableHead>Start Ticket #</TableHead>
                    <TableHead>Last Sold Ticket #</TableHead>
                    <TableHead className="text-right">Tickets Remaining</TableHead>
                    <TableHead className="text-right">Pack Value</TableHead>
                    <TableHead>Return Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!returnablePacks.length&&<TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No returnable packs.</TableCell></TableRow>}
                  {returnablePacks.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell className="font-medium">{pack.gameName}</TableCell>
                      <TableCell>{pack.packNumber}</TableCell>
                      <TableCell>{pack.startTicket}</TableCell>
                      <TableCell>{pack.lastSoldTicket === "000" ? "N/A" : pack.lastSoldTicket}</TableCell>
                      <TableCell className="text-right">{pack.ticketsRemaining}</TableCell>
                      <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                      <TableCell>
                        {pack.returnReason ? (
                          <div className="space-y-1">
                            <Badge variant="outline">{pack.returnType === "full" ? "Full Pack" : "Partial"}</Badge>
                            <p className="text-xs text-muted-foreground">{pack.returnReason}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getReturnStatusBadge(pack.status)}
                          {pack.status==="blocked"&&<p className="text-xs text-destructive">{pack.blockedReason}</p>}
                          {pack.distributorRef && (
                            <p className="text-xs text-muted-foreground">Ref: {pack.distributorRef}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {pack.status === "eligible" && (
                            <Button size="sm" disabled={!q.data?.canReturn} onClick={() => handleInitiateReturn(pack)}>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Initiate
                            </Button>
                          )}
                          {pack.status === "pending" && (
                            <Button size="sm" variant="outline" disabled={!q.data?.canReturn} onClick={() => handleConfirmReturnStatus(pack.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                          {(pack.status === "returned"||pack.status === "settled") && (
                            <Button size="sm" variant="ghost" onClick={()=>setViewReturn(pack)}>
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Initiate Pack Return</DialogTitle>
            <DialogDescription>
              {currentReturnPack && (
                <span>
                  Return {currentReturnPack.gameName} - Pack #{currentReturnPack.packNumber}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Return Type *</Label>
              <Select value={returnType} onValueChange={setReturnType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select return type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Pack</SelectItem>
                  <SelectItem value="partial">Partial Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Game discontinued">Game discontinued</SelectItem>
                  <SelectItem value="Low sales">Low sales</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Distributor Reference # *</Label>
              <Input
                value={distributorRef}
                onChange={(e) => setDistributorRef(e.target.value)}
                placeholder="Enter reference number"
              />
            </div>
            {currentReturnPack && (
              <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                <p><span className="font-medium">Tickets Remaining:</span> {currentReturnPack.ticketsRemaining}</p>
                <p><span className="font-medium">Pack Value:</span> ${currentReturnPack.packValue.toFixed(2)}</p>
                <p><span className="font-medium">Return Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!returnType||!returnReason.trim()||!distributorRef.trim()||mutation.isPending} onClick={handleConfirmReturn}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Initiate Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={settleIds.length>0} onOpenChange={v=>{if(!v)setSettleIds([]);}}><DialogContent><DialogHeader><DialogTitle>Finalize pack settlement?</DialogTitle><DialogDescription>This locks the selected packs and records their sales and commission totals. It does not send payment to the distributor.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setSettleIds([])}>Cancel</Button><Button disabled={mutation.isPending} onClick={()=>mutation.mutate({action:'SETTLE',packs:selected(settleIds)},{onSuccess:()=>setSettleIds([])})}>Finalize Settlement</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!confirmReturnId} onOpenChange={v=>{if(!v)setConfirmReturnId(null);}}><DialogContent><DialogHeader><DialogTitle>Confirm distributor accepted the return?</DialogTitle><DialogDescription>Confirm only after the remaining tickets have been returned and accepted. This records the return and makes the pack eligible for settlement.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setConfirmReturnId(null)}>Cancel</Button><Button disabled={mutation.isPending} onClick={()=>{const p=returnablePacks.find(p=>p.id===confirmReturnId);if(p)mutation.mutate({action:'CONFIRM_RETURN',packs:[{id:p.id,version:p.version}]},{onSuccess:()=>setConfirmReturnId(null)});}}>Confirm Return</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!viewReturn} onOpenChange={v=>{if(!v)setViewReturn(null);}}><DialogContent><DialogHeader><DialogTitle>Return Record</DialogTitle><DialogDescription>{viewReturn?.gameName} · Pack {viewReturn?.packNumber}</DialogDescription></DialogHeader><dl className="space-y-3"><div><dt className="text-muted-foreground">Reason</dt><dd>{viewReturn?.returnReason}</dd></div><div><dt className="text-muted-foreground">Distributor Reference</dt><dd>{viewReturn?.distributorRef}</dd></div><div><dt className="text-muted-foreground">Confirmed By</dt><dd>{viewReturn?.approvedBy||'—'}</dd></div><div><dt className="text-muted-foreground">Return Date</dt><dd>{viewReturn?.returnDate||'—'}</dd></div><div><dt className="text-muted-foreground">Settlement Reference</dt><dd>{viewReturn?.linkedSettlementId||'Not settled'}</dd></div></dl></DialogContent></Dialog>
    </fieldset>
  );
};
