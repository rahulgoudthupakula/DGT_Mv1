import {useEffect,useState} from 'react';
import {Card,CardContent} from '@/components/ui/card';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {ChevronUp,ChevronDown} from 'lucide-react';
import {type TankReport,type TankRow,gallons,measuredTime} from './tankReportData';
type SortKey='date'|'tank'|'open'|'purchase'|'adjustments'|'close'|'stVol';
export const TankMovementTable=({data}:{data:TankReport})=>{
 const [sort,setSort]=useState<SortKey>('date'),[asc,setAsc]=useState(true),[page,setPage]=useState(1);
 useEffect(()=>setPage(1),[data]);
 const sorted=[...data.rows].sort((a,b)=>{const x=a[sort],y=b[sort];if(x==null)return y==null?0:1;if(y==null)return -1;const n=typeof x==='string'&&typeof y==='string'?x.localeCompare(y):Number(x)-Number(y);return asc?n:-n;});
 const pages=Math.max(1,Math.ceil(sorted.length/10));const current=Math.min(page,pages);const rows=sorted.slice((current-1)*10,current*10);
 const columns:{label:string;key:keyof TankRow;sort?:SortKey}[]=[{label:'Date',key:'date',sort:'date'},{label:'Tank / Grade',key:'tank',sort:'tank'},{label:'Open',key:'open',sort:'open'},{label:'Purchase',key:'purchase',sort:'purchase'},{label:'Adjustments',key:'adjustments',sort:'adjustments'},{label:'Sold',key:'sold'},{label:'Recorded Close',key:'close',sort:'close'},{label:'St.Inches',key:'stInches'},{label:'Measured Vol',key:'stVol',sort:'stVol'},{label:'O/S',key:'os'}];
 const toggle=(key:SortKey)=>{if(sort===key)setAsc(!asc);else{setSort(key);setAsc(true);}setPage(1);};
 return <Card className="border-border"><CardContent className="p-0"><Table><TableHeader><TableRow>{columns.map(c=><TableHead key={c.key} className={`text-xs ${['date','tank'].includes(c.key)?'':'text-right'}`}>{c.sort?<button className="inline-flex items-center" onClick={()=>toggle(c.sort!)}>{c.label}{sort===c.sort?(asc?<ChevronUp className="h-3 w-3"/>:<ChevronDown className="h-3 w-3"/>):null}</button>:c.label}</TableHead>)}</TableRow></TableHeader><TableBody>
 {!rows.length&&<TableRow><TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">No tanks match this grade and date range.</TableCell></TableRow>}
 {rows.map(r=><TableRow key={r.date+':'+r.tankId}>{columns.map(c=><TableCell key={c.key} className={`text-xs ${['date','tank'].includes(c.key)?'':'text-right'}`} title={c.key==='stVol'?measuredTime(r.measuredAt,data.timezone):undefined}>{c.key==='date'?r.date:c.key==='tank'?<>{r.tank}<div className="text-muted-foreground">{r.gradeName}</div></>:gallons(r[c.key] as number|null)}{c.key==='stVol'&&r.measuredAt&&<div className="text-[10px] text-muted-foreground">{measuredTime(r.measuredAt,data.timezone)}</div>}</TableCell>)}</TableRow>)}
 <TableRow className="bg-muted/40 font-semibold border-t-2"><TableCell className="text-xs">Total</TableCell><TableCell/><TableCell/><TableCell className="text-xs text-right">{gallons(data.rows.reduce((s,r)=>s+r.purchase,0))}</TableCell><TableCell className="text-xs text-right">{gallons(data.rows.reduce((s,r)=>s+r.adjustments,0))}</TableCell><TableCell className="text-right">—</TableCell><TableCell/><TableCell/><TableCell/><TableCell className="text-right">—</TableCell></TableRow>
 </TableBody></Table><div className="px-4 py-3 border-t text-xs text-muted-foreground text-center">Over/short and tolerance checks require sales and matching measured readings. No tolerance result is calculated yet.</div>
 <div className="flex items-center justify-end gap-1 px-4 py-3 border-t">{['First','Previous'].map((x,i)=><Button key={x} variant="ghost" size="sm" className="text-xs h-7" disabled={current===1} onClick={()=>setPage(i?current-1:1)}>{x}</Button>)}<span className="px-3 text-xs">{current} / {pages}</span>{['Next','Last'].map((x,i)=><Button key={x} variant="ghost" size="sm" className="text-xs h-7" disabled={current===pages} onClick={()=>setPage(i?pages:current+1)}>{x}</Button>)}</div>
 </CardContent></Card>;
};
