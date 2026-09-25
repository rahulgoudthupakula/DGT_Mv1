import { useRef, useState } from "react";
import {useQuery} from "@tanstack/react-query";
import {request} from "@/lib/backend";
import { TabsList } from "@/components/ui/tabs";
import { PermissionTabs as Tabs, PermissionTabsContent as TabsContent, PermissionTabsTrigger as TabsTrigger } from "@/components/ui/permission-tabs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Zap,
  Clock,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock data for confirmed packs (ready for activation)
interface PackWithActivation {
  id: string;
  version: string;
  gameName: string;
  gameId: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  ticketsCount: number;
  packValue: number;
  confirmedDate: string;
  confirmedBy: string;
  gameActive: boolean;
  alreadyActivated: boolean;
  ticketsSoldBeforeActivation: boolean;
  activationStatus: "pending" | "activating" | "activated" | "failed";
  activationConfirmation?: string;
  activatedAt?: string;
  activatedBy?: string;
  activationError?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notVerified?: boolean;
  notVerifiedBy?: string;
  notVerifiedAt?: string;
  notVerifiedReason?: string;
}

type StatusFilter = "all" | "pending" | "activated" | "failed";

export const VerifyActivatePacks = ({storeId}:{storeId:string}) => {
  const path=`/access/stores/${encodeURIComponent(storeId)}/lottery-verification`;
  const q=useQuery({queryKey:['lottery-verification',storeId],queryFn:()=>request<{packs:PackWithActivation[];canVerify:boolean;canActivate:boolean}>(path),enabled:!!storeId,retry:false});
  const packs=q.data?.packs??[];
  const [references,setReferences]=useState<Record<string,string>>({});
  const busy=useRef(false);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [selectedVerifyPacks, setSelectedVerifyPacks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [packToActivate, setPackToActivate] = useState<string | null>(null);
  const [bulkActivationDialogOpen, setBulkActivationDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activeTab, setActiveTab] = useState("verify");
  const [notVerifiedDialogOpen, setNotVerifiedDialogOpen] = useState(false);
  const [notVerifiedPackId, setNotVerifiedPackId] = useState<string | null>(null);
  const [notVerifiedReason, setNotVerifiedReason] = useState("");

  const getVerificationResult=(p:PackWithActivation)=>{
    const errors:string[]=[];
    if(!p.gameActive)errors.push('Game is inactive');
    if(p.alreadyActivated)errors.push('Activation already recorded');
    if(p.ticketsSoldBeforeActivation)errors.push('Pack has recorded ticket sales');
    return {canActivate:errors.length===0,errors};
  };
  const save=async(endpoint:string,body:unknown)=>{
   if(busy.current)return false;
   busy.current=true;setIsActivating(true);
   try{await request(path+endpoint,{method:'POST',body:JSON.stringify(body)});setSelectedPacks([]);setSelectedVerifyPacks([]);await q.refetch();toast({title:'Saved',description:'Pack records updated in the database.'});return true;}
   catch(e){toast({title:'Not saved',description:e instanceof Error?e.message:'Please retry',variant:'destructive'});return false;}
   finally{busy.current=false;setIsActivating(false);}
  };
  const selected=(ids:string[])=>ids.map(id=>({id,version:packs.find(p=>p.id===id)?.version,reference:references[id]?.trim()}));
  const decide=(ids:string[],action:string)=>save('/decision',{packs:selected(ids),action,reason:notVerifiedReason});
  const verifyPacks=(ids:string[])=>{if(q.data?.canVerify)void decide(ids,'VERIFY');};
  const toggleVerifySelection=(id:string)=>setSelectedVerifyPacks(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const openNotVerifiedDialog=(id:string)=>{setNotVerifiedPackId(id);setNotVerifiedReason('');setNotVerifiedDialogOpen(true);};
  const confirmNotVerified=async()=>{
    if(q.data?.canVerify && notVerifiedPackId && await decide([notVerifiedPackId],'NOT_VERIFIED')){setNotVerifiedDialogOpen(false);setNotVerifiedPackId(null);setNotVerifiedReason('');}
  };
  const restoreToPending=(id:string)=>{if(q.data?.canVerify)void decide([id],'RESTORE');};
  const openActivationDialog=(id:string)=>{setPackToActivate(id);setActivationDialogOpen(true);};
  const record=async(ids:string[])=>{
    if(!q.data?.canActivate)return false;
    if(ids.some(id=>!references[id]?.trim())){toast({title:'Reference required',description:'Enter the actual terminal/provider activation reference for each pack.',variant:'destructive'});return false;}
    return save('/activation',{packs:selected(ids)});
  };
  const handleActivatePack=async(id:string)=>{if(await record([id])){setActivationDialogOpen(false);setPackToActivate(null);setReferences({});}};
  const handleBulkActivate=async()=>{if(await record(selectedPacks)){setBulkActivationDialogOpen(false);setReferences({});}};
  const retryActivation=(id:string)=>openActivationDialog(id);

  const togglePackSelection = (id: string) => {
    setSelectedPacks((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    const filteredPackIds = filteredPacks
      .filter((p) => p.activationStatus === "pending" && getVerificationResult(p).canActivate)
      .map((p) => p.id);
    const allSelected = filteredPackIds.every((id) => selectedPacks.includes(id));
    if (allSelected) {
      setSelectedPacks((prev) => prev.filter((id) => !filteredPackIds.includes(id)));
    } else {
      setSelectedPacks((prev) => [...new Set([...prev, ...filteredPackIds])]);
    }
  };

  const matchesSearch = (pack: PackWithActivation) =>
    pack.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.packNumber.includes(searchTerm);

  // Packs awaiting verification
  const unverifiedPacks = packs.filter((p) => !p.verified && !p.notVerified);

  // Packs marked as not verified
  const notVerifiedPacks = packs.filter((p) => p.notVerified);

  // Verified packs (activation list)
  const verifiedPacks = packs.filter((p) => p.verified);

  const filteredPacks = verifiedPacks.filter((pack) => {
    const matchesStatus =
      statusFilter === "all" || pack.activationStatus === statusFilter;
    return matchesSearch(pack) && matchesStatus;
  });

  // Stats
  const pendingCount = verifiedPacks.filter((p) => p.activationStatus === "pending").length;
  const activatedCount = packs.filter((p) => p.activationStatus === "activated").length;
  const failedCount = packs.filter((p) => p.activationStatus === "failed").length;
  const activatingCount = packs.filter((p) => p.activationStatus === "activating").length;
  const eligibleForActivation = verifiedPacks.filter(
    (p) => p.activationStatus === "pending" && getVerificationResult(p).canActivate
  ).length;

  const selectedEligibleCount = selectedPacks.filter((id) => {
    const pack = packs.find((p) => p.id === id);
    return pack && getVerificationResult(pack).canActivate && pack.activationStatus === "pending";
  }).length;

  if(!storeId)return <p>Select a store.</p>;
  if(q.isPending)return <p role="status">Loading confirmed lottery packs…</p>;
  if(q.error)return <p role="alert">{q.error.message} <Button onClick={()=>void q.refetch()}>Retry</Button></p>;
  return (
    <fieldset disabled={isActivating} className="space-y-6 min-w-0">
      <p className="text-sm text-muted-foreground">Verify confirmed deliveries here. Complete activation on your lottery terminal first, then record its reference. This page does not activate packs with the provider or enable POS sales.</p>
      <Button variant="outline" onClick={()=>void q.refetch()}>Refresh</Button>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Verify & Activate Packs</h1>
            <p className="text-muted-foreground text-sm">
              Activate confirmed packs before sale
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {q.data?.canActivate && activeTab === "activate" && selectedEligibleCount > 0 && (
            <Button onClick={() => setBulkActivationDialogOpen(true)} disabled={isActivating}>
              <Zap className="w-4 h-4 mr-1" />
              Record Activation ({selectedEligibleCount})
            </Button>
          )}
          {q.data?.canVerify && activeTab === "verify" && selectedVerifyPacks.length > 0 && (
            <Button onClick={() => verifyPacks(selectedVerifyPacks)}>
              <ShieldCheck className="w-4 h-4 mr-1" />
              Verify Selected ({selectedVerifyPacks.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs storeId={storeId} parent="LOTTERY_PAGE_ACTIVATE" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="verify">Verify Packs ({unverifiedPacks.length})</TabsTrigger>
          <TabsTrigger value="activate">Activate Packs ({verifiedPacks.length})</TabsTrigger>
        </TabsList>

        {/* ===== Verify Tab ===== */}
        <TabsContent value="verify" className="space-y-6 mt-6"><fieldset disabled={!q.data?.canVerify} className="min-w-0 space-y-6">
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Packs confirmed at delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Check each pack against the game and ticket rules. Verified packs move to the
                    Activate Packs list.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Packs Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            unverifiedPacks.length > 0 &&
                            unverifiedPacks.every((p) => selectedVerifyPacks.includes(p.id))
                          }
                          onCheckedChange={() =>
                            setSelectedVerifyPacks((prev) =>
                              prev.length === unverifiedPacks.length
                                ? []
                                : unverifiedPacks.map((p) => p.id)
                            )
                          }
                        />
                      </TableHead>
                      <TableHead>Game Name</TableHead>
                      <TableHead>Pack / Book #</TableHead>
                      <TableHead>Start Ticket #</TableHead>
                      <TableHead>End Ticket #</TableHead>
                      <TableHead className="text-right">Pack Value</TableHead>
                      <TableHead>Confirmed Date</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {unverifiedPacks.length === 0 && <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No packs pending verification. Confirm delivery packs first.</TableCell></TableRow>}
                    {unverifiedPacks.map((pack) => {
                      const verification = getVerificationResult(pack);
                      return (
                        <TableRow key={pack.id} className={!verification.canActivate ? "bg-muted/30" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedVerifyPacks.includes(pack.id)}
                              onCheckedChange={() => toggleVerifySelection(pack.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{pack.gameName}</TableCell>
                          <TableCell>{pack.packNumber}</TableCell>
                          <TableCell>{pack.startTicket}</TableCell>
                          <TableCell>{pack.endTicket}</TableCell>
                          <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(pack.confirmedDate), "MMM dd, yyyy")}
                              <span className="text-muted-foreground block text-xs">
                                {format(new Date(pack.confirmedDate), "h:mm a")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {verification.canActivate && (
                                <Button size="sm" className="h-8" onClick={() => verifyPacks([pack.id])}>
                                  <ShieldCheck className="w-4 h-4 mr-1" />
                                  Verify
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive border-destructive/40 hover:bg-destructive/10"
                                onClick={() => openNotVerifiedDialog(pack.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Not Verified
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>

          {/* Not Verified Packs */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Not Verified Packs ({notVerifiedPacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game Name</TableHead>
                      <TableHead>Pack / Book #</TableHead>
                      <TableHead>Start Ticket #</TableHead>
                      <TableHead>End Ticket #</TableHead>
                      <TableHead className="text-right">Pack Value</TableHead>
                      <TableHead>Confirmed Date</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {notVerifiedPacks.length === 0 && <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">No packs marked as not verified.</TableCell></TableRow>}
                    {notVerifiedPacks.map((pack) => (
                      <TableRow key={pack.id}>
                        <TableCell className="font-medium">{pack.gameName}</TableCell>
                        <TableCell>{pack.packNumber}</TableCell>
                        <TableCell>{pack.startTicket}</TableCell>
                        <TableCell>{pack.endTicket}</TableCell>
                        <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(pack.confirmedDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {pack.notVerifiedBy}
                            {pack.notVerifiedAt && (
                              <span className="text-muted-foreground block text-xs">
                                {format(new Date(pack.notVerifiedAt), "MMM dd, yyyy h:mm a")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="text-sm">{pack.notVerifiedReason || "—"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => restoreToPending(pack.id)}
                          >
                            Move Back to Pending
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>

          {/* Not Verified Reason Dialog */}
          <Dialog open={notVerifiedDialogOpen} onOpenChange={open=>{if(!isActivating)setNotVerifiedDialogOpen(open);}}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Why is this pack not verified?</DialogTitle>
                <DialogDescription>
                  {notVerifiedPackId &&
                    `Pack ${packs.find((p) => p.id === notVerifiedPackId)?.packNumber ?? ""} — ${
                      packs.find((p) => p.id === notVerifiedPackId)?.gameName ?? ""
                    }`}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Enter the reason (e.g. tickets missing, damaged pack, wrong delivery)..."
                value={notVerifiedReason}
                onChange={(e) => setNotVerifiedReason(e.target.value)}
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setNotVerifiedDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isActivating || !q.data?.canVerify} onClick={confirmNotVerified}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Mark Not Verified
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </fieldset></TabsContent>

        {/* ===== Activate Tab ===== */}
        <TabsContent value="activate" className="space-y-6 mt-6"><fieldset disabled={!q.data?.canActivate} className="min-w-0 space-y-6">
      {/* Warning Banner */}
      <Card className="bg-accent/50 border-accent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Record Completed Terminal Activation</p>
              <p className="text-sm text-muted-foreground">
                Only record activation after it is completed on the lottery terminal.
                The reference is saved here; closing, history and settlement integrations are separate steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Packs</p>
            <p className="text-2xl font-bold">{packs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pending Activation</p>
            <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Eligible to Activate</p>
            <p className="text-2xl font-bold text-primary">{eligibleForActivation}</p>
          </CardContent>
        </Card>
        <Card className={activatedCount > 0 ? "border-primary/50" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Activated</p>
            <p className="text-2xl font-bold text-primary">{activatedCount}</p>
          </CardContent>
        </Card>
        <Card className={failedCount > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className={`text-2xl font-bold ${failedCount > 0 ? "text-destructive" : ""}`}>
              {failedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by game or pack number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Activation</SelectItem>
                  <SelectItem value="activated">Activated</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Eligible Packs for Activation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredPacks.filter((p) => p.activationStatus === "pending" && getVerificationResult(p).canActivate).length > 0 &&
                        filteredPacks
                          .filter((p) => p.activationStatus === "pending" && getVerificationResult(p).canActivate)
                          .every((p) => selectedPacks.includes(p.id))
                      }
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                  <TableHead>Game Name</TableHead>
                  <TableHead>Pack / Book #</TableHead>
                  <TableHead>Start Ticket #</TableHead>
                  <TableHead>End Ticket #</TableHead>
                  <TableHead className="text-right">Pack Value</TableHead>
                  <TableHead>Confirmed Date</TableHead>
                  <TableHead className="text-center">Verification</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredPacks.length === 0 && <TableRow><TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No packs match this view. Verified packs appear here.</TableCell></TableRow>}
                {filteredPacks.map((pack) => {
                  const verification = getVerificationResult(pack);
                  return (
                    <TableRow
                      key={pack.id}
                      className={
                        pack.activationStatus === "activated"
                          ? "bg-primary/5"
                          : pack.activationStatus === "failed"
                          ? "bg-destructive/5"
                          : !verification.canActivate
                          ? "bg-muted/30"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedPacks.includes(pack.id)}
                          onCheckedChange={() => togglePackSelection(pack.id)}
                          disabled={pack.activationStatus !== "pending" || !verification.canActivate}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pack.gameName}</TableCell>
                      <TableCell>{pack.packNumber}</TableCell>
                      <TableCell>{pack.startTicket}</TableCell>
                      <TableCell>{pack.endTicket}</TableCell>
                      <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(pack.confirmedDate), "MMM dd, yyyy")}
                          <span className="text-muted-foreground block text-xs">
                            {format(new Date(pack.confirmedDate), "h:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {verification.canActivate ? (
                          <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                              <XCircle className="w-3 h-3" />
                              Blocked
                            </Badge>
                            <div className="text-xs text-destructive max-w-[150px]">
                              {verification.errors.map((err, i) => (
                                <p key={i}>{err}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {pack.activationStatus === "pending" && (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {pack.activationStatus === "activating" && (
                          <Badge variant="secondary" className="bg-accent">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Activating...
                          </Badge>
                        )}
                        {pack.activationStatus === "activated" && (
                          <div className="space-y-1">
                            <Badge className="bg-primary text-primary-foreground">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activated
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {pack.activationConfirmation}
                            </p>
                          </div>
                        )}
                        {pack.activationStatus === "failed" && (
                          <div className="space-y-1">
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                            <p className="text-xs text-destructive max-w-[120px]">
                              {pack.activationError}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {pack.activationStatus === "pending" && verification.canActivate && (
                            <Button
                              size="sm"
                              onClick={() => openActivationDialog(pack.id)}
                              disabled={isActivating}
                              className="h-8"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Record Activation
                            </Button>
                          )}
                          {pack.activationStatus === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryActivation(pack.id)}
                              className="h-8"
                            >
                              Retry
                            </Button>
                          )}
                          {pack.activationStatus === "activated" && (
                            <span className="text-xs text-muted-foreground">
                              By {pack.activatedBy}
                            </span>
                          )}
                          {pack.activationStatus === "pending" && !verification.canActivate && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Post-Activation Info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Recorded Activation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Recorded activation references, users and timestamps are retained in the database. Day/Shift Closing, POS integration and settlement connections are separate steps.</p>
        </CardContent>
      </Card>
        </fieldset></TabsContent>
      </Tabs>

      {/* Single Activation Dialog */}
      <Dialog open={activationDialogOpen} onOpenChange={open=>{if(!isActivating)setActivationDialogOpen(open);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Record Completed Activation
            </DialogTitle>
            <DialogDescription>
              Record an activation already completed on your lottery terminal. Enter its actual confirmation reference. This saves a record only; it does not contact the provider.
            </DialogDescription>
          </DialogHeader>
          {packToActivate && (
            <div className="py-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {(() => {
                  const pack = packs.find((p) => p.id === packToActivate);
                  if (!pack) return null;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Game:</span>
                        <span className="font-medium">{pack.gameName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pack #:</span>
                        <span className="font-medium">{pack.packNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium">${pack.packValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tickets:</span>
                        <span className="font-medium">{pack.startTicket} - {pack.endTicket}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          {packToActivate && <label className="space-y-2">Terminal/provider confirmation reference<Input maxLength={150} disabled={isActivating} value={references[packToActivate]??''} onChange={e=>setReferences(prev=>({...prev,[packToActivate]:e.target.value}))}/></label>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivationDialogOpen(false)} disabled={isActivating}>
              Cancel
            </Button>
            <Button
              onClick={() => packToActivate && handleActivatePack(packToActivate)}
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Record Activation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Activation Dialog */}
      <Dialog open={bulkActivationDialogOpen} onOpenChange={open=>{if(!isActivating)setBulkActivationDialogOpen(open);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Record Completed Activations
            </DialogTitle>
            <DialogDescription>
              Record completed terminal activations for {selectedEligibleCount} pack(s). Enter a reference for every selected pack.
            </DialogDescription>
          </DialogHeader>
          {selectedPacks.map(id=><label key={id} className="block space-y-2">Pack {packs.find(p=>p.id===id)?.packNumber} — terminal reference<Input maxLength={150} disabled={isActivating} value={references[id]??''} onChange={e=>setReferences(prev=>({...prev,[id]:e.target.value}))}/></label>)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActivationDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isActivating} onClick={handleBulkActivate}>
              <Zap className="w-4 h-4 mr-1" />
              Record {selectedEligibleCount} Activations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </fieldset>
  );
};
