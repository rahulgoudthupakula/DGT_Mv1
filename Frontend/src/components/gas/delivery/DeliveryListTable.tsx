import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Delivery } from "./gasDeliveryData";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const statusColors: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/30",
  RECEIVED: "bg-success/15 text-success border-success/30",
};
interface Props {deliveries:Delivery[];onView:(delivery:Delivery)=>void;busy:boolean;}
export const DeliveryListTable = ({deliveries,onView,busy}:Props) => {
  const [pageSize,setPageSize]=useState(10);
  const filtered=deliveries.flatMap(delivery=>delivery.lines.map(line=>({delivery,line})));
  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filtered, pageSize);

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-[11px] font-semibold">Load Date/Time</TableHead>
              <TableHead className="text-[11px] font-semibold">Vendor</TableHead>
              <TableHead className="text-[11px] font-semibold">Fuel Type</TableHead>
              <TableHead className="text-[11px] font-semibold">BOL #</TableHead>
              
              <TableHead className="text-[11px] font-semibold text-right">Gross Gal</TableHead>
              <TableHead className="text-[11px] font-semibold text-right">Net Gal</TableHead>
              <TableHead className="text-[11px] font-semibold">Tank</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                  No deliveries match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(({delivery:d,line:l}) => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs">{d.header.loadDate} {d.header.loadTime}</TableCell>
                  <TableCell className="text-xs font-medium">{d.vendorName}</TableCell>
                  <TableCell className="text-xs">{l.gradeName}</TableCell>
                  <TableCell className="text-xs font-mono">{d.header.bolNumber}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{Number(l.grossGallons).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right">{Number(l.netGallons).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{l.tankNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[d.status] || ""}`}>
                      {d.status==='DRAFT'?'Draft':'Received'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy} aria-label={`View BOL ${d.header.bolNumber}`} onClick={() => onView(d)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
          hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
          onPageSizeChange={(s) => setPageSize(s)}
        />
      </div>


    </>
  );
};
