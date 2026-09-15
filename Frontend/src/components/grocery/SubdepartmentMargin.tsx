import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Percent, Save } from "lucide-react";

import { toast } from "@/hooks/use-toast";

export type MarginRow={key:string;version:string;dept:string;subDept:string;margin:string|number|null};
export const SubdepartmentMargin = ({allRows,onChange,editable,onSave}:{allRows:MarginRow[];onChange:(rows:MarginRow[])=>void;editable:boolean;onSave:()=>void}) => {
  const [deptFilter,setDeptFilter]=useState('all');const [search,setSearch]=useState('');const [bulkMargin,setBulkMargin]=useState('');
  const departmentNames=[...new Set(allRows.map(r=>r.dept))];
  const rows=allRows.filter(r=>(deptFilter==='all'||r.dept===deptFilter)&&`${r.dept} ${r.subDept}`.toLowerCase().includes(search.toLowerCase()));
  const setMargin=(key:string,value:string)=>onChange(allRows.map(r=>r.key===key?{...r,margin:value}:r));
  const applyBulk=()=>{const n=Number(bulkMargin);if(bulkMargin===''||!Number.isFinite(n)||n<0||n>=100){toast({title:'Enter a margin between 0 and 99.99%',variant:'destructive'});return;}const keys=new Set(rows.map(r=>r.key));onChange(allRows.map(r=>keys.has(r.key)?{...r,margin:bulkMargin}:r));};
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="h-5 w-5" />
            Sub-Department Margin
          </CardTitle>
          <CardDescription>
            Set the target gross margin percentage for every sub-department. New Arrivals prefills this margin when you select a sub-department. Saving a default does not change existing item prices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="Search department or sub-department"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Apply to shown rows (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  className="h-9 text-sm"
                  placeholder="e.g. 35"
                  disabled={!editable} value={bulkMargin}
                  onChange={(e) => setBulkMargin(e.target.value)}
                />
                <Button variant="outline" className="h-9" onClick={applyBulk} disabled={!editable||bulkMargin === ""}>
                  Apply
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} sub-departments across {departmentNames.length} departments
            </p>
            <Button disabled={!editable} onClick={onSave} className="gap-2 h-9">
              <Save className="h-4 w-4" />
              Save Margins
            </Button>
          </div>

          <div className="rounded-md border max-h-[540px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Sub-Department</TableHead>
                  <TableHead className="w-40 text-right">Margin %</TableHead>
                  <TableHead className="w-28 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      No sub-departments match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => {
                    const value = r.margin;
                    return (
                      <TableRow key={r.key}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm">{r.dept}</TableCell>
                        <TableCell className="text-sm font-medium">{r.subDept}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="h-8 w-28 ml-auto text-right text-sm"
                            placeholder="Not set" disabled={!editable} min="0" max="99.99" step="0.01"
                            value={value ?? ""}
                            onChange={(e) => setMargin(r.key, e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={(value === null || value === "") ? "outline" : "default"} className="text-xs">
                            {(value === null || value === "") ? "Not set" : "Set"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
