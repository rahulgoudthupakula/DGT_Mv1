import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GasProfitFilters } from "./GasProfitFilters";
import { GasProfitSummaryCards } from "./GasProfitSummaryCards";
import { GasProfitTable } from "./GasProfitTable";
import { GasProfitVarianceStrip } from "./GasProfitVarianceStrip";
import { GasProfitDrawer } from "./GasProfitDrawer";
import { GasProfitBottomSummary } from "./GasProfitBottomSummary";

// Mock data — updated columns
const mockDayData = [
  { date: "02/01/2026", day: "Sun", gallonsSold: 3240, sales: 10530.00, fuelCost: 8748.00, grossProfit: 1782.00, ccFee: 189.54, freight: 64.80, miscCost: 15.00, totalCost: 269.34, netProfit: 1512.66 },
  { date: "02/02/2026", day: "Mon", gallonsSold: 4120, sales: 13390.00, fuelCost: 11124.00, grossProfit: 2266.00, ccFee: 241.02, freight: 82.40, miscCost: 0, totalCost: 323.42, netProfit: 1942.58 },
  { date: "02/03/2026", day: "Tue", gallonsSold: 3890, sales: 12642.50, fuelCost: 10503.00, grossProfit: 2139.50, ccFee: 227.57, freight: 77.80, miscCost: 22.50, totalCost: 327.87, netProfit: 1811.63 },
  { date: "02/04/2026", day: "Wed", gallonsSold: 4350, sales: 14137.50, fuelCost: 11745.00, grossProfit: 2392.50, ccFee: 254.48, freight: 87.00, miscCost: 0, totalCost: 341.48, netProfit: 2051.02 },
  { date: "02/05/2026", day: "Thu", gallonsSold: 4680, sales: 15210.00, fuelCost: 12636.00, grossProfit: 2574.00, ccFee: 273.78, freight: 93.60, miscCost: 67.80, totalCost: 435.18, netProfit: 2138.82 },
  { date: "02/06/2026", day: "Fri", gallonsSold: 5210, sales: 16932.50, fuelCost: 14067.00, grossProfit: 2865.50, ccFee: 304.79, freight: 104.20, miscCost: 0, totalCost: 408.99, netProfit: 2456.51 },
  { date: "02/07/2026", day: "Sat", gallonsSold: 5480, sales: 17810.00, fuelCost: 14796.00, grossProfit: 3014.00, ccFee: 320.58, freight: 109.60, miscCost: 33.00, totalCost: 463.18, netProfit: 2550.82 },
];

const mockFuelData = [
  { fuelType: "Regular", gallonsSold: 18450, avgSalePrice: 3.249, avgCostPerGal: 2.699, taxPerGal: 0.160, marginPerGal: 0.390, netProfit: 7195.50 },
  { fuelType: "Plus", gallonsSold: 5620, avgSalePrice: 3.549, avgCostPerGal: 2.949, taxPerGal: 0.160, marginPerGal: 0.440, netProfit: 2472.80 },
  { fuelType: "Premium", gallonsSold: 3980, avgSalePrice: 3.899, avgCostPerGal: 3.299, taxPerGal: 0.160, marginPerGal: 0.440, netProfit: 1751.20 },
  { fuelType: "Diesel", gallonsSold: 2920, avgSalePrice: 3.799, avgCostPerGal: 3.249, taxPerGal: 0.180, marginPerGal: 0.370, netProfit: 1080.40 },
];

const mockDeliveries = [
  { bol: "45892", vendor: "Marathon", gallons: 8200, costPerGal: 2.699, total: 22131.80 },
  { bol: "45910", vendor: "Marathon", gallons: 7500, costPerGal: 2.715, total: 20362.50 },
];

const mockPriceChanges = [
  { date: "02/03/2026", grade: "Regular", oldPrice: 3.229, newPrice: 3.249 },
  { date: "02/05/2026", grade: "Diesel", oldPrice: 3.779, newPrice: 3.799 },
];

const mockBottomSummary = {
  cashCardCommission: 245.80,
  cashCardCommissionAdj: -12.50,
  creditCardAdj: -35.00,
  creditCardFees: 1811.76,
  creditCardBatchFees: 89.25,
  freightCost: 619.40,
  miscCost: 138.30,
  fleetCardNetGainLoss: 156.20,
  gasCommission: 310.00,
  netProfit: 14464.04,
  netProfitPerVolume: 0.467,
  gasInventoryAdj: -168.40,
  netProfitAfterAdj: 14295.64,
  netProfitPerVolumeAfterAdj: 0.461,
};

export const GasProfitReport = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [fuelType, setFuelType] = useState("all");
  const [viewType, setViewType] = useState<"by-day" | "by-fuel">("by-day");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRowTitle, setSelectedRowTitle] = useState("");

  const totalGallons = 30970;
  const totalSales = 100652.50;
  const totalFuelCost = 83619.00;
  const totalTax = 4955.20;
  const netProfit = 14464.04;
  const profitPercent = (netProfit / totalSales) * 100;

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFuelType("all");
    setViewType("by-day");
  };

  const handleRowClick = (index: number) => {
    const title = viewType === "by-day"
      ? `${mockDayData[index].date} (${mockDayData[index].day})`
      : mockFuelData[index].fuelType;
    setSelectedRowTitle(title);
    setDrawerOpen(true);
  };

  const handleViewTankReport = () => {
    // Navigation to tank report would go here
  };

  return (
    <div className="space-y-4">
      <GasProfitFilters
        startDate={startDate}
        endDate={endDate}
        fuelType={fuelType}
        viewType={viewType}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFuelTypeChange={setFuelType}
        onViewTypeChange={setViewType}
        onClearFilters={clearFilters}
      />

      <GasProfitSummaryCards
        totalGallons={totalGallons}
        totalSales={totalSales}
        totalFuelCost={totalFuelCost}
        totalTax={totalTax}
        netProfit={netProfit}
        profitPercent={profitPercent}
      />

      <Card>
        <CardContent className="p-0">
          <GasProfitTable
            viewType={viewType}
            dayData={mockDayData}
            fuelData={mockFuelData}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <GasProfitBottomSummary data={mockBottomSummary} />

      <GasProfitVarianceStrip
        varianceGallons={-168}
        lossImpact={453.60}
        onViewTankReport={handleViewTankReport}
      />

      <GasProfitDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedRowTitle}
        deliveries={mockDeliveries}
        priceChanges={mockPriceChanges}
        tankVariance={{ expected: 12480, actual: 12312, variance: -168 }}
        taxBreakdown={{ federal: 1854.00, state: 2478.40, local: 622.80, total: 4955.20 }}
      />
    </div>
  );
};
