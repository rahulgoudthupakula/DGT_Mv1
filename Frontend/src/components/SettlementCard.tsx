import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Settlement {
  name: string;
  lastSettled: string;
}

interface SettlementCardProps {
  settlements: Settlement[];
}

export const SettlementCard = ({ settlements }: SettlementCardProps) => {
  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Enter Settlements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settlements.map((settlement, index) => (
            <div
              key={index}
              className="flex items-center justify-between pb-4 border-b border-dashboard-border last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-sm">{settlement.name}</p>
                <p className="text-xs text-info-text mt-1">{settlement.lastSettled}</p>
              </div>
              <Button size="sm" variant="outline">
                Settle
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
