import {useStockReports,stockCategories} from './useStockReports';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export const InventoryCostRetailRatio = ({storeId}:{storeId:string}) => {
 const query=useStockReports(storeId);const mockCategories=stockCategories(query.data?.items??[]).map(g=>({category:g.category,cost:g.inventoryValue,retail:g.inventoryValueRetail,ratio:g.inventoryValue==null||!g.inventoryValueRetail?null:g.inventoryValue/g.inventoryValueRetail}));
  const totalCost = mockCategories.reduce((sum, c) => sum + c.cost, 0);
  const totalRetail = mockCategories.reduce((sum, c) => sum + c.retail, 0);
  const totalRatio = totalRetail > 0 ? totalCost / totalRetail : 0;

  const unknown=mockCategories.some(c=>c.cost==null||c.retail==null);
 const mockData={ratio:unknown||!totalRetail?null:totalRatio,inventoryAtCost:unknown?null:totalCost,inventoryAtRetail:unknown?null:totalRetail};
 if(query.isPending)return <p>Loading stock ratios…</p>;if(query.error)return <p role="alert">{String(query.error)}</p>;
  return (
    <div className="space-y-5">
      {/* KPI Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Inventory Cost / Retail Value Ratio
            </p>
            <p className="text-5xl font-bold tracking-tight">
              {(mockData.ratio?.toFixed(2)??"—")}
            </p>
            <p className="text-sm text-muted-foreground">
              {mockData.ratio==null?"—":Math.round(mockData.ratio * 100)}% of retail value is tied in
              cost
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Inventory at Cost
              </p>
              <p className="text-3xl font-bold">
                ${(mockData.inventoryAtCost?.toLocaleString()??"—")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Inventory at Retail
              </p>
              <p className="text-3xl font-bold">
                ${(mockData.inventoryAtRetail?.toLocaleString()??"—")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Split Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Category Split</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost $</TableHead>
                <TableHead className="text-right">Retail $</TableHead>
                <TableHead className="text-right">Ratio</TableHead>
                <TableHead className="w-[120px]">Capital Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCategories.map((cat) => {
                const capitalWeight = unknown || totalCost <= 0 || cat.cost == null ? null : cat.cost / totalCost * 100;
                return (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {cat.category}

                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(cat.cost?.toLocaleString()??"—")}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(cat.retail?.toLocaleString()??"—")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(cat.ratio?.toFixed(2)??"—")}
                    </TableCell>
                    <TableCell>
                      {capitalWeight == null ? "—" : <div className="space-y-1">
                        <span className="text-xs">{capitalWeight.toFixed(1)}%</span>
                        <Progress value={capitalWeight} className="h-2" />
                      </div>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">
                  ${unknown?'—':totalCost.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${unknown?'—':totalRetail.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {unknown||!totalRetail?'—':totalRatio.toFixed(2)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
