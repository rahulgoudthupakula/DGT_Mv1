import { DollarSign, Download } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/backend';
import { Button } from "@/components/ui/button";
import { CurrentPricesPanel } from "./CurrentPricesPanel";
import { PriceHistoryTable } from "./PriceHistoryTable";
import { RecordPriceChangeDrawer } from "./RecordPriceChangeDrawer";
import { type PriceData, exportPrices } from './gasPriceData';

export const GasPricePage = ({storeId}:{storeId:string}) => {
 const client=useQueryClient();const key=['gas-prices',storeId];
 const path=`/access/stores/${encodeURIComponent(storeId)}/gas-prices`;
 const query=useQuery({queryKey:key,queryFn:()=>request<PriceData>(path),enabled:!!storeId,refetchOnWindowFocus:true,refetchInterval:5000});
 if(query.isPending)return <p>Loading gas prices…</p>;
 if(query.error)return <p role="alert">{query.error.message} <Button variant="outline" onClick={()=>query.refetch()}>Retry</Button></p>;
 const data=query.data!;
 return <div className="space-y-6">
  <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-foreground flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/>Gas Prices</h1><div className="flex items-center gap-2">
   <RecordPriceChangeDrawer path={path} data={data} onSaved={saved=>client.setQueryData(key,saved)}><Button size="sm" disabled={data.grades.length===0} className="gap-1.5 text-xs"><DollarSign className="h-3.5 w-3.5"/>Record Price Change</Button></RecordPriceChangeDrawer>
   <Button size="sm" variant="outline" disabled={data.history.length===0} onClick={()=>exportPrices(data)} className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5"/>Export</Button>
  </div></div>
  <CurrentPricesPanel data={data}/>
  <div className="rounded-lg border border-border bg-muted/30 p-4"><p className="text-xs font-semibold mb-1">Margin Insight</p><p className="text-xs text-muted-foreground">Cost and margin calculations are not connected yet. Selling prices are set manually.</p></div>
  <div className="space-y-3">{data.history.some(p=>p.status==='SCHEDULED')&&<p className="text-xs text-muted-foreground">Upcoming changes appear as Scheduled below. They take effect at the saved time, even when this page is closed.</p>}<h2 className="text-sm font-semibold">Price History</h2><PriceHistoryTable data={data} path={path} onSaved={saved=>client.setQueryData(key,saved)}/></div>
 </div>;
};
