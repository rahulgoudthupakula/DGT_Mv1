import {useRebates} from './useRebates';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Copy, RefreshCw, Ban } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";
import { AddRebateProgramDialog } from "./AddRebateProgramDialog";
import { RebateProgram } from "./rebateTypes";



const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Active: "default", Expired: "secondary",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};


interface RebateProgramsPageProps {
  storeId:string;
  onViewDetails?: (program: RebateProgram) => void;
  onManageItems?: () => void;
  onViewClaims?: () => void;
  editRequest?: RebateProgram | null;
  duplicateRequest?: RebateProgram | null;
  onRequestHandled?: () => void;
}

export const RebateProgramsPage = ({
  storeId,onViewDetails, onManageItems, onViewClaims,
  editRequest, duplicateRequest, onRequestHandled,
}: RebateProgramsPageProps) => {
  const {query,save}=useRebates(storeId);
  const programs=query.data?.programs??[];
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProgramDialog, setShowNewProgramDialog] = useState(false);
  const [editProgram, setEditProgram] = useState<RebateProgram | null>(null);
  const [deleteProgram, setDeleteProgram] = useState<RebateProgram | null>(null);



  const filtered = programs.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage, goToPage } =
    usePagination(filtered, 10);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    goToPage(1);
  };

  async function persist(form:Omit<RebateProgram,'id'>,status:string,existing?:RebateProgram|null){setBusy(true);setError('');try{await save('programs',{...form,status},existing);toast.success('Rebate program saved');return true;}catch(e){setError(e instanceof Error?e.message:'Could not save program');return false;}finally{setBusy(false);}}
  const handleCreateProgram=(form:Omit<RebateProgram,'id'>,status:string)=>persist(form,status);
  const handleDeleteProgram=async()=>{if(deleteProgram&&await persist(deleteProgram,'Inactive',deleteProgram))setDeleteProgram(null);};
  const handleDeactivate=(program:RebateProgram)=>persist(program,'Inactive',program);
  const handleCloneProgram=(program:RebateProgram)=>{setEditProgram(null);setCloneProgram({...program,name:`${program.name} (Copy)`,status:'Draft'});setShowNewProgramDialog(true);};
  const [cloneProgram,setCloneProgram]=useState<RebateProgram|null>(null);
  const handleSaveEdit=(form:Omit<RebateProgram,'id'>,status:string)=>persist(form,status,editProgram);

  useEffect(() => {
    if (editRequest) { setEditProgram({ ...editRequest }); onRequestHandled?.(); }
  }, [editRequest]);

  useEffect(() => {
    if (duplicateRequest) { handleCloneProgram(duplicateRequest); onRequestHandled?.(); }
  }, [duplicateRequest]);

  const activeCount = programs.filter((p) => p.status === "Active").length;
  const endingSoon = programs.filter((p) => {
    if (p.status !== "Active" || !p.endDate) return false;
    const days = (new Date(p.endDate).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;
  const summary = [
    { label: "Active Programs", value: String(activeCount) },
    { label: "Ending Soon", value: String(endingSoon) },
    { label: "Qualified", value: "Not calculated" },
    { label: "Expected Rebate", value: "Not calculated" },
  ];

  return (
    <div className="space-y-4">
      {(error||query.error)&&<p role="alert" className="text-destructive">{error||String(query.error)}</p>}
      {query.isPending&&<p>Loading programs…</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Programs</CardTitle>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search programs..." className="pl-9 w-64" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => {setCloneProgram(null);setShowNewProgramDialog(true);}}>
              <Plus className="h-4 w-4 mr-1" /> Add Program
            </Button>
            <AddRebateProgramDialog storeId={storeId} busy={busy} error={error}
              initial={cloneProgram} open={showNewProgramDialog}
              onOpenChange={setShowNewProgramDialog}
              onSave={handleCreateProgram}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Offered By</TableHead>
                <TableHead>Eligible Scope</TableHead>
                <TableHead>Program Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Claim Freq.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!query.isPending&&filtered.length===0&&<TableRow><TableCell colSpan={8}>No programs found for this store.</TableCell></TableRow>}
              {paginated.map((program) => (
                <TableRow key={program.id} className="cursor-pointer" onClick={() => onViewDetails?.(program)}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.vendor}</TableCell>
                  <TableCell>{program.eligibleItems}</TableCell>
                  <TableCell>{program.rebateType}</TableCell>
                  <TableCell className="text-xs">{program.startDate} – {program.endDate}</TableCell>
                  <TableCell>{program.claimFrequency}</TableCell>
                  <TableCell>{getStatusBadge(program.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-medium text-primary hover:text-primary/80"
                        onClick={() => onViewDetails?.(program)}
                      >
                        view details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditProgram({ ...program })}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCloneProgram(program)}>
                            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync to Child Stores
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={busy||program.status==='Inactive'} onClick={() => handleDeactivate(program)}
                          >
                            <Ban className="h-3.5 w-3.5 mr-2" /> Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AddRebateProgramDialog storeId={storeId} busy={busy} error={error}
        open={!!editProgram}
        onOpenChange={(open) => !open && setEditProgram(null)}
        initial={editProgram}
        title="Edit Rebate Program"
        onSave={handleSaveEdit}
      />


      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProgram} onOpenChange={(open) => !open && setDeleteProgram(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Rebate Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <span className="font-semibold text-foreground">"{deleteProgram?.name}"</span>? The program and item history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy} onClick={e=>{e.preventDefault();void handleDeleteProgram();}}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
