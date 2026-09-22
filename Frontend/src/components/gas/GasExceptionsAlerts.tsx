import {AlertTriangle} from 'lucide-react';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {useAppNavigation} from '@/contexts/NavigationContext';
import {type DashboardTank,tankAlerts} from './gasDashboardData';
export const GasExceptionsAlerts=({tanks}:{tanks:DashboardTank[]})=>{
 const alerts=tankAlerts(tanks);const {navigateTo}=useAppNavigation();
 return <Card className="border-border"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive"/>Exceptions & Alerts</CardTitle><span className="text-[11px] text-muted-foreground">{alerts.filter(a=>a.severity==='error').length} critical</span></div></CardHeader><CardContent className="space-y-2">
 {!alerts.length&&<p className="text-xs text-muted-foreground">No alerts from enabled checks and available records.</p>}
 {alerts.map(a=><button key={a.id} onClick={()=>navigateTo('Gas','Tank report')} className={`w-full flex items-start gap-2.5 p-2.5 rounded-md border text-left ${a.severity==='error'?'bg-red-500/10 border-red-200 text-red-700':'bg-amber-500/10 border-amber-200 text-amber-700'}`}><AlertTriangle className="h-4 w-4 shrink-0"/><p className="text-xs font-medium">{a.message}</p></button>)}
 </CardContent></Card>;
};
