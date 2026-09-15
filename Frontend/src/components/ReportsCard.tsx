import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface ReportSection {
  title: string;
  items: {
    label: string;
    action?: string;
    dates?: { date: string; icon?: boolean }[];
    noData?: string;
  }[];
}

interface ReportsCardProps {
  sections: ReportSection[];
}

export const ReportsCard = ({ sections }: ReportsCardProps) => {
  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="font-medium text-sm mb-3">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80">{item.label}</span>
                    {item.dates && (
                      <div className="flex gap-2">
                        {item.dates.map((dateInfo, dateIndex) => (
                          <Button
                            key={dateIndex}
                            size="sm"
                            variant="outline"
                            className="h-8"
                          >
                            {dateInfo.icon && <Calendar className="w-3 h-3 mr-1" />}
                            {dateInfo.date}
                          </Button>
                        ))}
                      </div>
                    )}
                    {item.noData && (
                      <span className="text-xs text-info-text">{item.noData}</span>
                    )}
                    {item.action && (
                      <Button size="sm" variant="outline">
                        {item.action}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
