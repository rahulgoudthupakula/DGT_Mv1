import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Button} from '@/components/ui/button';
import {TankStatusPanel} from './TankStatusPanel';
import {GasPriceBox} from './GasPriceBox';
import {GasExceptionsAlerts} from './GasExceptionsAlerts';
import type {GasDashboardData} from './gasDashboardData';
export const GasDashboard=({storeId}:{storeId:string})=>{
 const q=useQuery({queryKey:['gas-dashboard',storeId],queryFn:()=>request<GasDashboardData>(`/access/stores/${encodeURIComponent(storeId)}/gas-prices/dashboard`),enabled:!!storeId,retry:false,refetchInterval:60000});
 if(!storeId)return <p>Select a store.</p>;
 if(q.isPending)return <p role="status">Loading gas dashboard…</p>;
 if(q.error)return <div role="alert">{q.error.message} <Button variant="outline" onClick={()=>void q.refetch()}>Retry</Button></div>;
 const data=q.data;
 return <div className="space-y-6">
  <GasPriceBox prices={data.prices} timezone={data.timezone}/>
  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>As of {new Date(data.asOf).toLocaleString('en-US',{timeZone:data.timezone})} · {data.timezone}</span><Button size="sm" variant="outline" disabled={q.isFetching} onClick={()=>void q.refetch()}>Refresh</Button></div>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><TankStatusPanel tanks={data.tanks} timezone={data.timezone}/></div><GasExceptionsAlerts tanks={data.tanks}/></div>
  <p className="text-xs text-muted-foreground">Recorded gallons use the latest measured reading plus posted tank movements. Unmapped POS fuel sales are not deducted. Water, leak and delivery-variance detection are not connected.</p>
 </div>;
};
