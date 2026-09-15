import {useState} from 'react';
import {Eye} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Table,TableHeader,TableHead,TableRow,TableBody,TableCell} from '@/components/ui/table';
import {usePagination} from '@/hooks/use-pagination';
import {TablePagination} from '@/components/ui/table-pagination';
import {type AdjustmentRecord,reasonLabel,statusLabel} from './gasAdjustmentData';
export const statusColors={DRAFT:'bg-muted text-muted-foreground',PENDING:'bg-amber-100 text-amber-800',POSTED:'bg-green-100 text-green-800',REJECTED:'bg-red-100 text-red-800'};
export const AdjustmentListTable=({records,onViewRecord}:{records:AdjustmentRecord[];onViewRecord:(r:AdjustmentRecord)=>void})=>{
 const [size,setSize]=useState(10);const rows=records.flatMap(r=>r.lines.map(l=>({r,l})));const p=usePagination(rows,size);
 return <div className="border border-border rounded-lg overflow-hidden"><Table><TableHeader><TableRow className="bg-muted/30">{['Date','Tank / Fuel Type','System Volume (gal)','Actual Volume (gal)','Adjustment (gal)','Reason','Reference','Status','Approved By','Actions'].map(h=><TableHead key={h} className="text-[10px] font-semibold uppercase tracking-wider h-9">{h}</TableHead>)}</TableRow></TableHeader><TableBody>
 {!p.paginated.length&&<TableRow><TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">No adjustments match the selected filters.</TableCell></TableRow>}
 {p.paginated.map(({r,l})=><TableRow key={l.id} className="hover:bg-muted/20"><TableCell className="text-xs">{r.date}</TableCell><TableCell className="text-xs">{l.tankNumber} · {l.gradeName}</TableCell><TableCell>{l.systemGallons.toLocaleString()}</TableCell><TableCell>{l.actualGallons.toLocaleString()}</TableCell><TableCell className={l.difference<0?'text-destructive':'text-emerald-600'}>{l.difference>0?'+':''}{l.difference.toLocaleString()}</TableCell><TableCell className="text-xs">{reasonLabel(l.reason)}</TableCell><TableCell className="text-xs">ADJ-{r.id}</TableCell><TableCell><span className={`rounded-full px-2 py-1 text-[10px] ${statusColors[r.status]}`}>{statusLabel[r.status]}</span></TableCell><TableCell className="text-xs">{r.status==='POSTED'?r.reviewedBy:'—'}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`View adjustment ${r.id}`} onClick={()=>onViewRecord(r)}><Eye className="h-3.5 w-3.5"/></Button></TableCell></TableRow>)}
 </TableBody></Table><TablePagination page={p.page} totalPages={p.totalPages} totalItems={p.totalItems} pageSize={size} hasPrev={p.hasPrev} hasNext={p.hasNext} onPrev={p.prevPage} onNext={p.nextPage} onPageSizeChange={setSize}/></div>;
};
