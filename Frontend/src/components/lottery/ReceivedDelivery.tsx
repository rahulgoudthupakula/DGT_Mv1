import { useStoreAccess } from "@/lib/store-access";
import { useRef, useState } from "react";
import {useQuery} from "@tanstack/react-query";
import {request} from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Ban,
  ClipboardCheck,
  ReceiptText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AddReceivedReceiptDialog, type ReceiptDraft } from "./AddReceivedReceiptDialog";


interface PendingPack {
  id: string;
  version: string;
  status: string;
  reason: string | null;
  gameName: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  ticketsCount: number;
  packValue: number;
  deliveryRef: string;
  receivedDate: string;
  receivedBy: string;
}

interface DeliveryData {
 packs: PendingPack[]; receiver: string; today: string; canReceive: boolean; canConfirm: boolean;
 vendors: {id:string;name:string}[]; games: {id:string;name:string}[];
}
export const ReceivedDelivery = ({storeId}:{storeId:string}) => {
  const canOpenForm = useStoreAccess(storeId).data?.pages?.["LOTTERY_PAGE_RECEIVED_ADD"] === true;
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedConfirmPacks, setSelectedConfirmPacks] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [packToReject, setPackToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [busy,setBusy]=useState(false);
  const busyRef=useRef(false);
  const receiptRequest=useRef<{body:string;key:string}|null>(null);
  const path=`/access/stores/${encodeURIComponent(storeId)}/lottery-deliveries`;
  const q=useQuery({queryKey:['lottery-deliveries',storeId],queryFn:()=>request<DeliveryData>(path),enabled:!!storeId,retry:false});
  const pendingPacks=(q.data?.packs??[]).filter(p=>p.status==='PENDING');
  const processedPacks=(q.data?.packs??[]).filter(p=>p.status!=='PENDING');
  const distributors=q.data?.vendors??[], games=q.data?.games??[];
  const currentUser=q.data?.receiver??'';
  const mutate=async(action:()=>Promise<unknown>)=>{
   if(busyRef.current)return false;
   busyRef.current=true;setBusy(true);
   try{await action();setSelectedConfirmPacks([]);await q.refetch();return true;}
   catch(error){toast({title:'Lottery delivery was not saved',description:error instanceof Error?error.message:'Please retry',variant:'destructive'});return false;}
   finally{busyRef.current=false;setBusy(false);}
  };
  const handleReceiptSaved=async(draft:ReceiptDraft)=>{
   const {receivedBy,...input}=draft;
   const body=JSON.stringify(input);
   if(receiptRequest.current?.body!==body)receiptRequest.current={body,key:crypto.randomUUID()};
   const saved=await mutate(()=>request(path,{method:'POST',body,headers:{'Idempotency-Key':receiptRequest.current!.key}}));
   if(!saved)throw new Error('Receipt not saved');
   receiptRequest.current=null;
   toast({title:'Receipt saved',description:'Packs are saved in the database and pending confirmation.'});
  };
  const decide=async(ids:string[],action:'CONFIRM'|'REJECT')=>{
   const packs=ids.map(id=>pendingPacks.find(p=>p.id===id)).filter((p):p is PendingPack=>!!p).map(p=>({id:p.id,version:p.version}));
   const saved=await mutate(()=>request(path+'/decision',{method:'POST',body:JSON.stringify({action,reason:rejectionReason,packs})}));
   if(saved)toast({title:action==='CONFIRM'?'Packs confirmed':'Packs rejected',description:action==='CONFIRM'?'Saved for the verification step. Packs are not activated.':'Rejection reason saved; pack records retained.'});
   return saved;
  };
  const confirmPack=(id:string)=>void decide([id],'CONFIRM');
  const confirmAllPacks=()=>void decide(pendingPacks.map(p=>p.id),'CONFIRM');

  const openRejectDialog = (packId: string) => {
    setPackToReject(packId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if(packToReject && await decide([packToReject],'REJECT')){
      setRejectDialogOpen(false);setPackToReject(null);setRejectionReason('');
    }
  };

  const openBulkRejectDialog = () => {
    if (selectedConfirmPacks.length === 0) {
      toast({ title: "No Packs Selected", description: "Select packs to reject", variant: "destructive" });
      return;
    }
    setRejectionReason("");
    setBulkRejectDialogOpen(true);
  };

  const confirmBulkReject=async()=>{
   if(await decide(selectedConfirmPacks,'REJECT')){setBulkRejectDialogOpen(false);setRejectionReason('');}
  };

  const toggleConfirmPackSelection = (id: string) => {
    setSelectedConfirmPacks((prev) => prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]);
  };

  const toggleAllConfirmSelection = () => {
    if (selectedConfirmPacks.length === pendingPacks.length) {
      setSelectedConfirmPacks([]);
    } else {
      setSelectedConfirmPacks(pendingPacks.map((p) => p.id));
    }
  };

  if(!storeId)return <p>Select a store.</p>;
  if(q.isPending)return <p role="status">Loading lottery deliveries…</p>;
  if(q.error)return <p role="alert">{q.error.message} <Button onClick={()=>void q.refetch()}>Retry</Button></p>;
  return (
    <fieldset disabled={busy} className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Received and Confirm Delivery</h1>
            <p className="text-muted-foreground text-sm">
              Log lottery packs received from distributor and confirm pending packs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canOpenForm&&<Button disabled={!q.data?.canReceive} onClick={() => setReceiptDialogOpen(true)}>
            <ReceiptText className="w-4 h-4 mr-1" />
            Add Received Receipt
          </Button>}
        </div>
      </div>


      {/* ===== Packs Pending Confirmation Section ===== */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Packs Pending Confirmation
            </CardTitle>
            <div className="flex gap-2">
              {selectedConfirmPacks.length > 0 && (
                <Button variant="destructive" size="sm" disabled={!q.data?.canConfirm} onClick={openBulkRejectDialog}>
                  <Ban className="w-4 h-4 mr-1" />
                  Reject Selected ({selectedConfirmPacks.length})
                </Button>
              )}
              <Button onClick={confirmAllPacks} disabled={!q.data?.canConfirm || pendingPacks.length === 0}>
                <CheckCheck className="w-4 h-4 mr-1" />
                Confirm All Packs ({pendingPacks.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={pendingPacks.length > 0 && selectedConfirmPacks.length === pendingPacks.length}
                      onCheckedChange={toggleAllConfirmSelection}
                    />
                  </TableHead>
                  <TableHead>Game Name</TableHead>
                  <TableHead>Pack / Book #</TableHead>
                  <TableHead>Start Ticket #</TableHead>
                  <TableHead>End Ticket #</TableHead>
                  <TableHead className="text-center">Tickets</TableHead>
                  <TableHead className="text-right">Pack Value</TableHead>
                  <TableHead>Delivery Ref</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {pendingPacks.length === 0 && <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No packs pending confirmation. Add a received receipt to begin.</TableCell></TableRow>}
                {pendingPacks.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <Checkbox checked={selectedConfirmPacks.includes(pack.id)} onCheckedChange={() => toggleConfirmPackSelection(pack.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>{pack.packNumber}</TableCell>
                    <TableCell>{pack.startTicket}</TableCell>
                    <TableCell>{pack.endTicket}</TableCell>
                    <TableCell className="text-center">{pack.ticketsCount}</TableCell>
                    <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                    <TableCell><span className="text-sm">{pack.deliveryRef}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" disabled={!q.data?.canConfirm} onClick={() => confirmPack(pack.id)} className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                          <CheckCircle className="w-4 h-4 mr-1" />Confirm
                        </Button>
                        <Button variant="ghost" size="sm" disabled={!q.data?.canConfirm} onClick={() => openRejectDialog(pack.id)} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <XCircle className="w-4 h-4 mr-1" />Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3"><Button variant="outline" onClick={()=>void q.refetch()}>Refresh</Button>
       {(!games.length || !distributors.length) && <p className="text-sm text-muted-foreground">Receipt entry needs an active lottery game and vendor in this store.</p>}
      </div>
      <Card><CardHeader><CardTitle className="text-lg">Confirmed and Rejected Packs</CardTitle></CardHeader><CardContent>
       <Table><TableHeader><TableRow><TableHead>Game</TableHead><TableHead>Pack / Book #</TableHead><TableHead>Delivery Ref</TableHead><TableHead>Status</TableHead><TableHead>Rejection Reason</TableHead></TableRow></TableHeader>
       <TableBody>{processedPacks.length===0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No confirmed or rejected packs yet.</TableCell></TableRow>}{processedPacks.map(p=><TableRow key={p.id}><TableCell>{p.gameName}</TableCell><TableCell>{p.packNumber}</TableCell><TableCell>{p.deliveryRef}</TableCell><TableCell>{p.status}</TableCell><TableCell>{p.reason??'—'}</TableCell></TableRow>)}</TableBody></Table>
      </CardContent></Card>
      {/* Verification Rules */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            Verification Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Pack number must be unique within the store and game</li>
            <li>Ticket positions run from 1 through the game’s tickets per pack</li>
            <li>Each receipt is saved in full; duplicate packs or invalid lines reject the entire receipt</li>
            <li>Confirmed packs are saved for verification; activation is a separate step</li>
            <li>Confirmed packs are <strong>not yet sellable</strong> until activated</li>
          </ul>
        </CardContent>
      </Card>

      {/* Single Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Pack</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this pack. This will be recorded in the audit log.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea id="reason" placeholder="Enter the reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject Pack</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {selectedConfirmPacks.length} Packs</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting the selected packs. This will be recorded in the audit log.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkReason">Rejection Reason *</Label>
              <Textarea id="bulkReason" placeholder="Enter the reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmBulkReject}>Reject {selectedConfirmPacks.length} Packs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddReceivedReceiptDialog
        open={receiptDialogOpen&&canOpenForm}
        onOpenChange={setReceiptDialogOpen}
        distributors={distributors}
        games={games}
        defaultReceivedBy={currentUser}
        onSave={handleReceiptSaved}
        defaultDeliveryDate={q.data?.today}
        saving={busy}
      />
    </fieldset>
  );
};
