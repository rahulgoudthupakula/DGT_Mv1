import { useState } from "react";
import { Calendar, Download, Fuel, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { TankMovementTable } from "./TankMovementTable";
import { AllTanksSummary } from "./AllTanksSummary";

import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {type TankReport,exportTankReport} from './tankReportData';

export const TankReportPage = ({storeId}:{storeId:string}) => {
  const [startDate,setStartDate]=useState<Date>();
  const [endDate,setEndDate]=useState<Date>();
  const [grade,setGrade]=useState('all');
  const [allTanksView,setAllTanksView]=useState(false);
  const [applied,setApplied]=useState('');
  const query=useQuery({queryKey:['gas-tank-report',storeId,applied],queryFn:()=>request<TankReport>(`/access/stores/${encodeURIComponent(storeId)}/gas-tank-report${applied}`)});
  const data=query.data;
  const from=startDate??(data?parseISO(data.start):undefined),to=endDate??(data?parseISO(data.end):undefined);
  const hasActiveFilters=grade!=='all'||!!startDate||!!endDate;
  const clearFilters=()=>{setGrade('all');setStartDate(undefined);setEndDate(undefined);setApplied('');};
  const run=()=>{if(!from||!to)return;const params=new URLSearchParams({start:format(from,'yyyy-MM-dd'),end:format(to,'yyyy-MM-dd')});if(grade!=='all')params.set('grade',grade);const next='?'+params;if(next===applied)void query.refetch();else setApplied(next);};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          Tank Report
        </h1>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled={!data||!data.rows.length||query.isFetching} onClick={()=>data&&exportTankReport(data,allTanksView)}>
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background pb-4 border-b border-border">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Report Date range */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Report Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  {from?format(from, "MM/dd/yyyy"):"Start date"} – {to?format(to, "MM/dd/yyyy"):"End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="border-r border-border">
                    <p className="px-3 pt-2 text-xs text-muted-foreground font-medium">Start</p>
                    <CalendarPicker mode="single" selected={from} onSelect={(d) => d && setStartDate(d)} className={cn("p-3 pointer-events-auto")} />
                  </div>
                  <div>
                    <p className="px-3 pt-2 text-xs text-muted-foreground font-medium">End</p>
                    <CalendarPicker mode="single" selected={to} onSelect={(d) => d && setEndDate(d)} className={cn("p-3 pointer-events-auto")} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Select Grade */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Select Grade</span>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {data?.grades.map(g=><SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" className="gap-1.5 text-xs" disabled={!from||!to||query.isFetching} onClick={run}>
            <Play className="h-3.5 w-3.5" />
            Run Report
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}

          {/* All Tanks toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <Switch checked={allTanksView} onCheckedChange={setAllTanksView} id="all-tanks" />
            <Label htmlFor="all-tanks" className="text-xs text-muted-foreground cursor-pointer">
              All Tanks Summary
            </Label>
          </div>
        </div>
      </div>

      {query.isPending&&<p>Loading tank report…</p>}
      {query.error&&<p role="alert" className="text-destructive">{query.error.message} <Button variant="outline" onClick={()=>query.refetch()}>Retry</Button><Button variant="ghost" onClick={clearFilters}>Reset dates</Button></p>}
      {data&&<>
       <p className="text-xs text-muted-foreground">Report: {data.start} – {data.end} · {data.timezone}. All quantities are gallons. Today's closing is the recorded balance so far.</p>
       <p className="text-xs text-muted-foreground">Deliveries use the date received; approved adjustments are included. Recorded balances use saved readings and subsequent movements. Sales, stick inches and over/short remain unavailable until their data is connected. Measured volume is the latest reading in the selected day or period, not necessarily a closing reading.</p>
       {allTanksView ? <AllTanksSummary data={data} /> : <TankMovementTable data={data} />}
      </>}
    </div>
  );
};
