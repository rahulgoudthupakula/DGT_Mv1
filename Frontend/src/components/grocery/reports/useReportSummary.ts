import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {format} from 'date-fns';
/** Fetch server-calculated report results; filters are part of the cache identity. */
export function useReportSummary(store:string, report:string, start?:Date, end?:Date, filters:Record<string,string>={}) {
 const params=new URLSearchParams(filters);
 if(start)params.set('start',format(start,'yyyy-MM-dd'));
 if(end)params.set('end',format(end,'yyyy-MM-dd'));
 // Report endpoints have distinct result shapes, consumed by their individual report hooks.
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 return useQuery({queryKey:['grocery-summary',store,report,params.toString()],queryFn:()=>request<any>(`/access/stores/${encodeURIComponent(store)}/grocery-reports/${report}?${params}`),enabled:!!store});
}
