import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  date?: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const DashboardCard = ({
  title,
  date,
  subtitle,
  description,
  actionLabel,
  onAction,
  className,
}: DashboardCardProps) => {
  return (
    <Card className={cn("bg-dashboard-card border-dashboard-border hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {date && <p className="text-sm text-foreground/60 mt-1">{date}</p>}
        {subtitle && <p className="text-sm text-info-text mt-1">{subtitle}</p>}
      </CardHeader>
      {(description || actionLabel) && (
        <CardContent className="pt-0">
          {description && <p className="text-sm text-info-text mb-4">{description}</p>}
          {actionLabel && onAction && (
            <Button 
              variant="link" 
              className="text-primary hover:text-primary/80 p-0 h-auto"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};
