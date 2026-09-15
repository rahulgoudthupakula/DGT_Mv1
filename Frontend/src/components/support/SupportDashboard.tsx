import { useState } from "react";
import {
  Headset,
  BookOpen,
  PlayCircle,
  Activity,
  Search,
  MessageCircle,
  TicketCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const popularArticles = [
  "How to run your first daily closing",
  "Connecting POS to the system",
  "Understanding gas delivery reconciliation",
  "Setting up payroll direct deposit",
  "Lottery pack activation guide",
];

const recentTickets = [
  { id: "TKT-4821", subject: "POS not syncing daily totals", status: "Open", priority: "High" },
  { id: "TKT-4790", subject: "Gas delivery variance alert stuck", status: "In Progress", priority: "Medium" },
  { id: "TKT-4755", subject: "Payroll tax form 941 export issue", status: "In Progress", priority: "High" },
];

const statusIcon: Record<string, React.ReactNode> = {
  Open: <Clock className="w-3.5 h-3.5 text-blue-500" />,
  "In Progress": <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  Resolved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
};

const priorityColor: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Low: "bg-muted text-muted-foreground border-border",
};

interface SupportDashboardProps {
  onNavigate?: (tab: string) => void;
}

export const SupportDashboard = ({ onNavigate }: SupportDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support & Training Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Get help, learn the system, and track your support requests</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => onNavigate?.("Tickets")}>
          <TicketCheck className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open Tickets", value: "3", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "In Progress", value: "2", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Resolved (30d)", value: "14", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Avg. Response", value: "4h", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg}`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><Headset className="w-5 h-5 text-primary" /></div>
              <CardTitle className="text-base">Contact Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate?.("Tickets")}>
              <TicketCheck className="w-4 h-4" /> Open Ticket
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <a href="tel:+11234567899">
                <Phone className="w-4 h-4" /> Call Support
              </a>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <a href="mailto:support@example.com">
                <Mail className="w-4 h-4" /> Email Us
              </a>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate?.("Tickets")}>
              <MessageCircle className="w-4 h-4" /> Live Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate?.("Knowledge Base")}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10"><BookOpen className="w-5 h-5 text-blue-600" /></div>
              <CardTitle className="text-base">Knowledge Base</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles…" className="pl-8 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Popular</p>
              {popularArticles.slice(0, 3).map((a) => (
                <button key={a} className="text-xs text-primary hover:underline flex items-center gap-1 w-full text-left" onClick={(e) => { e.stopPropagation(); onNavigate?.("Knowledge Base"); }}>
                  <ChevronRight className="w-3 h-3 shrink-0" /> {a}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10"><PlayCircle className="w-5 h-5 text-emerald-600" /></div>
              <CardTitle className="text-base">Training Videos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate?.("Training")}>
              <PlayCircle className="w-4 h-4" /> Beginner Guides
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate?.("Training")}>
              <PlayCircle className="w-4 h-4" /> Advanced Modules
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate?.("Training")}>
              <BookOpen className="w-4 h-4" /> Getting Started
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10"><Activity className="w-5 h-5 text-amber-600" /></div>
              <CardTitle className="text-base">System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { label: "Server", status: "Operational", ok: true },
              { label: "POS Sync", status: "Connected", ok: true },
              { label: "Payroll API", status: "Operational", ok: true },
              { label: "Incidents", status: "None", ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{s.label}</span>
                <Badge variant="outline" className={`text-[10px] ${s.ok ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <CardDescription className="text-xs">Your latest support requests</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onNavigate?.("Tickets")}>
              View all <ChevronRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTickets.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="shrink-0">{statusIcon[t.status]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{t.subject}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{t.id}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityColor[t.priority]}`}>{t.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggested Articles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Suggested Articles</CardTitle>
            </div>
            <CardDescription className="text-xs">Based on your recent activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {popularArticles.map((a) => (
              <button key={a} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left w-full">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium flex-1">{a}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
