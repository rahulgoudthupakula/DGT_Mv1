import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Lock,
  Printer,
  Paperclip,
} from "lucide-react";
import { MoneyInSection } from "@/components/closing/store-edit/MoneyInSection";
import { MoneyOutSection } from "@/components/closing/store-edit/MoneyOutSection";
import { NotNeededTab } from "@/components/closing/store-edit/NotNeededTab";

interface DeliEditDayPageProps {
  day: number;
  month: number;
  year: number;
  status: "draft" | "closed" | "issue";
  onBack: () => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const statusVariant: Record<string, "secondary" | "destructive" | "default"> = {
  draft: "secondary",
  closed: "default",
  issue: "destructive",
};

export const DeliEditDayPage = ({ day, month, year, status, onBack }: DeliEditDayPageProps) => {
  const date = new Date(year, month, day);
  const dayOfWeek = WEEKDAYS[date.getDay()];
  const dateLabel = `${dayOfWeek}, ${MONTHS[month]} ${day}, ${year}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="sticky top-0 z-20 bg-background border-b border-border pb-3 pt-1 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Deli – Business Date Details</h1>
              <p className="text-sm text-muted-foreground">{dateLabel}</p>
            </div>
            <Badge variant={statusVariant[status]} className="capitalize text-xs ml-2">
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save Draft
            </Button>
            <Button variant="default" size="sm" className="h-8 text-xs gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Close Day
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="daily" className="flex-1">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="other">Not Needed for Daily Report</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MoneyInSection />
            <MoneyOutSection />
          </div>
        </TabsContent>

        <TabsContent value="other">
          <NotNeededTab />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-20 bg-background border-t border-border mt-6 pt-3 pb-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Z Reading: </span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Money In: </span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Money Out: </span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
            <div>
              <span className="text-muted-foreground">Short/Over: </span>
              <span className="font-semibold text-muted-foreground">$0.00</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
