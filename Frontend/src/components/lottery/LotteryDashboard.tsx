import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export const LotteryDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lottery Dashboard</h1>
        <p className="text-muted-foreground">Overview of lottery activity</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Ticket className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">No lottery data to display</p>
          <p className="text-sm text-muted-foreground">
            Activity will appear here once packs, sales and settlements are recorded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
