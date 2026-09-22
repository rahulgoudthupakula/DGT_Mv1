import {Fuel,ArrowRight} from 'lucide-react';
import {useAppNavigation} from '@/contexts/NavigationContext';
import {type PriceRow,priceText,localDateTime} from './price/gasPriceData';
export const GasPriceBox=({prices,timezone}:{prices:PriceRow[];timezone:string})=>{
 const {navigateTo}=useAppNavigation();
 return <button className="w-full text-left flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors" onClick={()=>navigateTo('Gas','Gas price')}>
  <div className="flex items-center gap-5 flex-wrap"><div className="flex items-center gap-1.5"><Fuel className="h-4 w-4 text-primary"/><span className="text-xs font-semibold uppercase tracking-wide">Gas Prices</span></div>
  {!prices.length&&<span className="text-xs text-muted-foreground">No current prices recorded.</span>}
  {prices.map(p=><div key={p.id}><span className="text-xs text-muted-foreground">{p.gradeName}: </span><span className="text-sm font-bold">Cash {priceText(p.cash)} · Credit {priceText(p.credit)}</span><p className="text-[10px] text-muted-foreground">Effective {localDateTime(p.effectiveFrom,timezone)}</p></div>)}</div><ArrowRight className="h-3.5 w-3.5 shrink-0"/>
 </button>;
};
