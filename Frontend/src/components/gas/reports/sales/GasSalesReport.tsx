import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GasSalesFilters } from "./GasSalesFilters";
import { GasSalesSummaryCards } from "./GasSalesSummaryCards";
import { GasSalesTable, DaySalesRow, FuelSalesRow, HourSalesRow } from "./GasSalesTable";
import { GasSalesPriceStrip } from "./GasSalesPriceStrip";
import { GasSalesDrawer } from "./GasSalesDrawer";

const mockDayData: DaySalesRow[] = [
  { date: "02/01/2026", day: "Sun", gallonsSold: 3240, sales: 10530.00, avgPrice: 3.249, highPrice: 3.299, lowPrice: 3.199 },
  { date: "02/02/2026", day: "Mon", gallonsSold: 4120, sales: 13390.00, avgPrice: 3.249, highPrice: 3.299, lowPrice: 3.199 },
  { date: "02/03/2026", day: "Tue", gallonsSold: 3890, sales: 12642.50, avgPrice: 3.249, highPrice: 3.299, lowPrice: 3.199 },
  { date: "02/04/2026", day: "Wed", gallonsSold: 4350, sales: 14137.50, avgPrice: 3.249, highPrice: 3.249, lowPrice: 3.249 },
  { date: "02/05/2026", day: "Thu", gallonsSold: 4680, sales: 15210.00, avgPrice: 3.249, highPrice: 3.299, lowPrice: 3.249 },
  { date: "02/06/2026", day: "Fri", gallonsSold: 5210, sales: 16932.50, avgPrice: 3.249, highPrice: 3.299, lowPrice: 3.249 },
  { date: "02/07/2026", day: "Sat", gallonsSold: 5480, sales: 17810.00, avgPrice: 3.249, highPrice: 3.299, lowPrice: 3.249 },
];

const mockFuelData: FuelSalesRow[] = [
  { fuelType: "Regular", gallonsSold: 18450, sales: 59938.05, avgPrice: 3.249, pctOfTotal: 59.5 },
  { fuelType: "Plus", gallonsSold: 5620, sales: 19945.38, avgPrice: 3.549, pctOfTotal: 19.8 },
  { fuelType: "Premium", gallonsSold: 3980, sales: 15518.10, avgPrice: 3.899, pctOfTotal: 15.4 },
  { fuelType: "Diesel", gallonsSold: 2920, sales: 11092.98, avgPrice: 3.799, pctOfTotal: 5.3 },
];

const mockHourData: HourSalesRow[] = [
  { hour: "6 AM", gallonsSold: 820, sales: 2664.18, avgPrice: 3.249 },
  { hour: "7 AM", gallonsSold: 1540, sales: 5003.46, avgPrice: 3.249 },
  { hour: "8 AM", gallonsSold: 1980, sales: 6433.02, avgPrice: 3.249 },
  { hour: "9 AM", gallonsSold: 1650, sales: 5360.85, avgPrice: 3.249 },
  { hour: "10 AM", gallonsSold: 1320, sales: 4288.68, avgPrice: 3.249 },
  { hour: "11 AM", gallonsSold: 1480, sales: 4808.52, avgPrice: 3.249 },
  { hour: "12 PM", gallonsSold: 2100, sales: 6822.90, avgPrice: 3.249 },
  { hour: "1 PM", gallonsSold: 1890, sales: 6140.61, avgPrice: 3.249 },
  { hour: "2 PM", gallonsSold: 1650, sales: 5360.85, avgPrice: 3.249 },
  { hour: "3 PM", gallonsSold: 1980, sales: 6433.02, avgPrice: 3.249 },
  { hour: "4 PM", gallonsSold: 2310, sales: 7505.19, avgPrice: 3.249 },
  { hour: "5 PM", gallonsSold: 2640, sales: 8577.36, avgPrice: 3.249 },
  { hour: "6 PM", gallonsSold: 2200, sales: 7147.80, avgPrice: 3.249 },
  { hour: "7 PM", gallonsSold: 1760, sales: 5718.24, avgPrice: 3.249 },
  { hour: "8 PM", gallonsSold: 1320, sales: 4288.68, avgPrice: 3.249 },
  { hour: "9 PM", gallonsSold: 880, sales: 2859.12, avgPrice: 3.249 },
  { hour: "10 PM", gallonsSold: 350, sales: 1137.15, avgPrice: 3.249 },
];

const mockPosSales = [
  { method: "Cash", gallons: 9800, sales: 31840.20 },
  { method: "Credit Card", gallons: 16200, sales: 52632.30 },
  { method: "Debit Card", gallons: 3120, sales: 10136.88 },
  { method: "Fleet Card", gallons: 1850, sales: 6010.65 },
];

const mockPriceChanges = [
  { date: "02/03/2026", grade: "Regular", oldPrice: 3.229, newPrice: 3.249 },
  { date: "02/05/2026", grade: "Diesel", oldPrice: 3.779, newPrice: 3.799 },
];

const mockFuelDetails = [
  { fuelType: "Regular", gallons: 18450, sales: 59938.05 },
  { fuelType: "Plus", gallons: 5620, sales: 19945.38 },
  { fuelType: "Premium", gallons: 3980, sales: 15518.10 },
  { fuelType: "Diesel", gallons: 2920, sales: 11092.98 },
];

export const GasSalesReport = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [fuelType, setFuelType] = useState("all");
  const [viewType, setViewType] = useState<"by-day" | "by-fuel" | "by-hour">("by-day");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");

  const filteredFuelData = fuelType === "all"
    ? mockFuelData
    : mockFuelData.filter((r) => r.fuelType.toLowerCase() === fuelType);

  // For by-day view with a fuel type filter, show a note but keep day rows
  // (day rows are aggregate; fuel filter only applies meaningfully to By Fuel view)
  const filteredDayData = mockDayData;

  const totalGallons = filteredFuelData.reduce((s, r) => s + r.gallonsSold, 0);
  const totalSales = filteredFuelData.reduce((s, r) => s + r.sales, 0);
  const avgPrice = totalGallons > 0 ? totalSales / totalGallons : 3.249;
  const trendPercent = 4.2;

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFuelType("all");
    setViewType("by-day");
  };

  const handleRowClick = (index: number) => {
    const activeDay = filteredDayData;
    const activeFuel = filteredFuelData;
    const title =
      viewType === "by-day"
        ? `${activeDay[index]?.date} (${activeDay[index]?.day})`
        : viewType === "by-fuel"
        ? activeFuel[index]?.fuelType
        : mockHourData[index]?.hour;
    setSelectedTitle(title ?? "");
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <GasSalesFilters
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

      <GasSalesSummaryCards
        totalGallons={totalGallons}
        totalSales={totalSales}
        avgPricePerGal={avgPrice}
        trendPercent={trendPercent}
      />

      <Card>
        <CardContent className="p-0">
          <GasSalesTable
            viewType={viewType}
            dayData={filteredDayData}
            fuelData={filteredFuelData}
            hourData={mockHourData}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <GasSalesPriceStrip
        minPrice={3.199}
        maxPrice={3.299}
        priceChangeCount={2}
        onViewPriceHistory={() => console.log("Navigate to Gas Price History")}
      />

      <GasSalesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedTitle}
        posSales={mockPosSales}
        priceChanges={mockPriceChanges}
        fuelDetails={mockFuelDetails}
      />
    </div>
  );
};
