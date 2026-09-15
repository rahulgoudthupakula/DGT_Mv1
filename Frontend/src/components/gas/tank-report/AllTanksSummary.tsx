import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {LayoutGrid} from 'lucide-react';
import {type TankReport,gallons,measuredTime} from './tankReportData';
export const AllTanksSummary=({data}:{data:TankReport})=><Card className="border-border"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary"/>All Tanks Summary</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow>{['Fuel Type','Tank','Opening','Deliveries','Adjustments','Sales','Recorded Closing','Latest Measured','Variance'].map((h,i)=><TableHead key={h} className={`text-xs ${i>1?'text-right':''}`}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>
 {!data.summary.length&&<TableRow><TableCell colSpan={9} className="text-xs text-center py-8">No tanks match this grade and date range.</TableCell></TableRow>}
 {data.summary.map(t=><TableRow key={t.tankId}><TableCell className="text-xs font-medium">{t.gradeName}</TableCell><TableCell className="text-xs">{t.tank}</TableCell>{[t.open,t.purchase,t.adjustments,t.sold,t.close].map((n,i)=><TableCell key={i} className="text-xs text-right">{gallons(n)}</TableCell>)}<TableCell className="text-xs text-right">{gallons(t.stVol)}<div className="text-[10px] text-muted-foreground">{measuredTime(t.measuredAt,data.timezone)}</div></TableCell><TableCell className="text-xs text-right">—</TableCell></TableRow>)}
 </TableBody></Table></CardContent></Card>;
