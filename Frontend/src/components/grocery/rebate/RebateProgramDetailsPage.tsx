import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Pencil, Copy, Tag, FileText, MoreHorizontal, Upload, RefreshCw, Check, Circle } from "lucide-react";
import { toast } from "sonner";
import { RebateProgram } from "./rebateTypes";

export type ProgramDetail = RebateProgram;

interface Props {
  storeId:string;
  program: ProgramDetail;
  onBack: () => void;
  onEdit: (program: ProgramDetail) => void;
  onDuplicate: (program: ProgramDetail) => void;
  onManageItems: () => void;
  onViewClaims: () => void;
}

const claimRows: {id:string;period:string;amount:number;status:string}[]=[];
const fmt=(n:number)=>`$${n.toLocaleString('en-US')}`;
const fmt2=(n:number)=>`$${n.toFixed(2)}`;
const statusVariant=(s:string):'default'|'secondary'|'outline'=>s==='Active'?'default':s==='Expired'?'secondary':'outline';

const parseAmount = (v?: string) => Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0;

type Kind = "tiered" | "volume" | "percentage" | "perUnit" | "perCase" | "growth" | "compliance" | "promotional";

const kindOf = (program: RebateProgram): Kind => {
  const t = (program.rebateType || "").toLowerCase();
  const r = (program.rewardType || "").toLowerCase();
  if (t.includes("tier") || (program.tiers?.length ?? 0) > 1) return "tiered";
  if (t.includes("growth")) return "growth";
  if (t.includes("display") || t.includes("compliance")) return "compliance";
  if (t.includes("promotional")) return "promotional";
  if (t.includes("per case") || r.includes("per case")) return "perCase";
  if (t.includes("per unit") || r.includes("per unit")) return "perUnit";
  if (t.includes("percentage")) return "percentage";
  if (t.includes("volume") || t.includes("purchase")) return "volume";
  return "percentage";
};

export const RebateProgramDetailsPage = ({
  storeId,program, onBack, onEdit, onDuplicate, onManageItems, onViewClaims,
}: Props) => {
  const eligible=useQuery({queryKey:['rebate-eligible',storeId,program.id],queryFn:()=>request<{id:string;upc:string;name:string}[]>(`/access/stores/${encodeURIComponent(storeId)}/rebates/programs/${program.id}/eligible`)});
  const docs:string[]=[];
  const kind=kindOf(program),isTiered=kind==='tiered',perUnitBased=kind==='perUnit'||kind==='perCase';
  const tiers=program.tiers??[];
  const currentTier:import('./rebateTypes').RebateTier|undefined=undefined,nextTier:import('./rebateTypes').RebateTier|undefined=undefined;
  const eligibleItemRows=eligible.data??[];
  const target=parseAmount(program.target),requiredGrowth=parseAmount(program.target);
  const rateLabel=program.rewardValue?`${program.rewardValue} ${program.rewardType??''}`:'—';
  const totalAccrued=0;
  const summaryCards=[{label:'Eligible Products',value:eligible.isPending?'Loading…':String(eligibleItemRows.length)},{label:'Reward',value:rateLabel},{label:'Estimated Rebate',value:'Not calculated'}];
  const measurementHeader=perUnitBased?'Qualified Qty':'Qualified Purchase Amount';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Programs
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{program.name}</h2>
              <Badge variant={statusVariant(program.status)}>{program.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {program.vendor || "—"} • {program.startDate || "—"} – {program.endDate || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(program)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Program
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(program)}><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate Program</DropdownMenuItem>
              <DropdownMenuItem onClick={onManageItems}><Tag className="h-3.5 w-3.5 mr-2" /> Manage Eligible Items</DropdownMenuItem>
              <DropdownMenuItem onClick={onViewClaims}><FileText className="h-3.5 w-3.5 mr-2" /> View Claims</DropdownMenuItem>
              <DropdownMenuItem disabled><RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync to Child Stores</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">Program definitions and eligible products are connected. Claims & Payments is connected. Earnings calculations and document uploads are not connected yet.</p>
      {eligible.error&&<p role="alert" className="text-destructive">{String(eligible.error)}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Program Rules</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><p className="text-xs text-muted-foreground">Program Type</p><p>{program.rebateType || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Qualification</p><p>{program.qualificationType || (perUnitBased ? "No Minimum Requirement" : "Purchase Amount")}</p></div>
            <div><p className="text-xs text-muted-foreground">Measurement</p><p>{program.measurementBasis || (perUnitBased ? "Units Purchased" : "Purchases")}</p></div>
            <div><p className="text-xs text-muted-foreground">Reward</p><p>{rateLabel}</p></div>
            {(kind === "volume" || isTiered) && (
              <div><p className="text-xs text-muted-foreground">Target</p><p>{fmt(target)}</p></div>
            )}
            {kind === "growth" && (
              <div><p className="text-xs text-muted-foreground">Required Growth</p><p>{requiredGrowth}%</p></div>
            )}
            {isTiered && <div><p className="text-xs text-muted-foreground">Current Tier</p><p>Not calculated</p></div>}
            {isTiered && <div><p className="text-xs text-muted-foreground">Next Tier</p><p>Not calculated</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Claim Information</CardTitle>
            <Button size="sm" onClick={onViewClaims}>Create Claim</Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><p className="text-xs text-muted-foreground">Claim Required</p><p>{program.claimRequired === false ? "No" : "Yes"}</p></div>
            <div><p className="text-xs text-muted-foreground">Claim Frequency</p><p>{program.claimFrequency || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Submission Deadline</p><p>{program.submissionDeadlineDays || "15"} days after period end</p></div>
            <div><p className="text-xs text-muted-foreground">Current Claim Status</p><p>Not connected</p></div>
            <div><p className="text-xs text-muted-foreground">Expected Payment</p><p>{program.paymentMethod || "Vendor Credit"}</p></div>
            <div>
              <p className="text-xs text-muted-foreground">Eligible Rebate Accrued</p>
              <p>Not calculated</p>
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Estimated Rebate is the projected payout on total qualifying activity at the current rate.
              Eligible Rebate Accrued is what has already been earned on items recorded so far.
            </p>
          </CardContent>
        </Card>
      </div>

      {(
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Eligible Products</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Scope: {program.eligibleItems || "—"}</p>
            </div>
            <Button size="sm" variant="outline" onClick={onManageItems}>View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UPC</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">{measurementHeader}</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">{perUnitBased ? "Accrued" : "Estimated Rebate"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleItemRows.map((r) => {
                  const measure = "—";
                  
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.upc}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{measure}</TableCell>
                      <TableCell>{rateLabel}</TableCell>
                      <TableCell className="text-right">—</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isTiered && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Rebate Tiers</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase Amount</TableHead>
                  <TableHead>Rebate</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((t, i) => {
                  const isCurrent = currentTier === t;
                  return (
                    <TableRow key={i} className={isCurrent ? "bg-muted/50" : ""}>
                      <TableCell>
                        {fmt(parseAmount(t.from))}{t.to ? ` – ${fmt(parseAmount(t.to))}` : "+"}
                      </TableCell>
                      <TableCell className="font-medium">{t.reward}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{isCurrent ? "← CURRENT" : ""}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Claims History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claimRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.id}</TableCell>
                    <TableCell>{c.period}</TableCell>
                    <TableCell className="text-right">${c.amount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Program Documents</CardTitle>
            <Button
              size="sm"
              variant="outline"
              disabled
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload Document
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {docs.map((d) => (
              <div key={d} className="flex items-center gap-2 border rounded-md px-3 py-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                {d}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
