import {Fuel,AlertTriangle,FileText,Droplets} from 'lucide-react';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {useAppNavigation} from '@/contexts/NavigationContext';
import {type DashboardTank,tankPercent,tankLow} from './gasDashboardData';
import {gallons,measuredTime} from './tank-report/tankReportData';
export const TankStatusPanel=({tanks,timezone}:{tanks:DashboardTank[];timezone:string})=>{
 const {navigateTo}=useAppNavigation();
 return <Card className="border-border"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold flex items-center gap-2"><Droplets className="h-4 w-4 text-primary"/>Tank Status</CardTitle><span className="text-[11px] text-muted-foreground">{tanks.length} tanks configured</span></div></CardHeader><CardContent>
 {!tanks.length&&<p className="text-sm text-muted-foreground">No tanks configured for this store.</p>}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{tanks.map(t=>{const percent=tankPercent(t);const low=tankLow(t);return <div key={t.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
  <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Fuel className="h-4 w-4 text-primary"/><span className="font-semibold text-sm">{t.gradeName}</span><span className="text-xs text-muted-foreground">({t.number})</span></div>{low&&<Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1"/>Low</Badge>}</div>
  <div className="space-y-1.5"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{gallons(t.currentGallons)} / {gallons(t.capacity)} gal</span><span>{percent==null?'—':percent.toFixed(1)+'%'}</span></div><div className="h-3 w-full bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${low?'bg-red-500':'bg-primary'}`} style={{width:`${Math.max(0,Math.min(100,percent??0))}%`}}/></div></div>
  <p className="text-[11px] text-muted-foreground">Last reading: {t.measuredAt?measuredTime(t.measuredAt,timezone):'Not recorded'}</p>
  <Button variant="ghost" size="sm" className="text-[11px] h-7 gap-1" onClick={()=>navigateTo('Gas','Tank report')}><FileText className="h-3 w-3"/>View Tank Report</Button>
 </div>;})}</div></CardContent></Card>;
};
