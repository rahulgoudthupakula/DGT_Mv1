import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {format,parseISO,differenceInCalendarDays} from 'date-fns';
import {request} from '@/lib/backend';
import {statisticsData,type StatisticsSource} from './statisticsData';
const empty:StatisticsSource={rows:[],start:'2000-01-01',end:'2000-01-01',previousStart:'1999-12-31',days:1,today:'2000-01-01',latest:'2000-01-01',timezone:'UTC'};
export function useStatistics(storeId:string,automatic=false){
 const [dates,setDates]=useState<{from?:Date;to?:Date}>({});const [range,setRange]=useState<{start?:string;end?:string}>({});
 const params=new URLSearchParams(range);
 const query=useQuery({queryKey:['sales-statistics',storeId,params.toString()],queryFn:()=>request<StatisticsSource>(`/access/stores/${encodeURIComponent(storeId)}/sales-statistics?${params}`),enabled:!!storeId,retry:false});
 const from=dates.from??(query.data?parseISO(query.data.start):undefined),to=dates.to??(query.data?parseISO(query.data.end):undefined);
 const valid=!!from&&!!to&&differenceInCalendarDays(to,from)>=0&&differenceInCalendarDays(to,from)<366;
 const select=(field:'from'|'to',date:Date)=>{const next={from,to,[field]:date};setDates(next);if(automatic&&next.from&&next.to&&differenceInCalendarDays(next.to,next.from)>=0&&differenceInCalendarDays(next.to,next.from)<366)setRange({start:format(next.from,'yyyy-MM-dd'),end:format(next.to,'yyyy-MM-dd')});};
 const apply=()=>{if(valid)setRange({start:format(from!,'yyyy-MM-dd'),end:format(to!,'yyyy-MM-dd')});};
 const waiting=query.isPending||query.isFetching;
 const notice=<div className="text-xs text-muted-foreground space-y-1">
  {query.error?<p role="alert">{query.error.message}</p>:!valid&&!waiting?<p role="alert">Choose From and To dates in order, covering no more than 366 days.</p>:waiting?<p role="status">Loading recorded sales…</p>:null}
  {query.data&&<p>Showing {query.data.start} to {query.data.end} · {query.data.timezone}. Sales exclude tax and include recorded discounts and refunds. Categories use current item assignments.</p>}
 </div>;
 return {from,to,setFrom:(d:Date)=>select('from',d),setTo:(d:Date)=>select('to',d),apply,valid,today:query.data?parseISO(query.data.today):undefined,notice,ready:!waiting&&!query.error&&valid,stats:statisticsData(query.data??empty)};
}
