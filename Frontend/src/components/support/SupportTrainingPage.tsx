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

export const SupportTrainingPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support & Training Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Get help, learn the system, and track your support requests</p>
      </div>

      {/* ─── Quick Help Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><Headset className="w-5 h-5 text-primary" /></div>
              <CardTitle className="text-base">Contact Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <TicketCheck className="w-4 h-4" /> Open Ticket
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Headset className="w-4 h-4" /> Call Support
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <MessageCircle className="w-4 h-4" /> Live Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10"><BookOpen className="w-5 h-5 text-blue-600" /></div>
              <CardTitle className="text-base">Knowledge Base</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles…" className="pl-8 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Popular</p>
              {popularArticles.slice(0, 3).map((a) => (
                <button key={a} className="text-xs text-primary hover:underline flex items-center gap-1 w-full text-left">
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
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <PlayCircle className="w-4 h-4" /> Beginner
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <PlayCircle className="w-4 h-4" /> Advanced
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <PlayCircle className="w-4 h-4" /> Module-wise
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Server</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Operational</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">POS Sync</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Connected</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Incidents</span>
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">None</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Suggested Articles ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Suggested Articles</CardTitle>
          </div>
          <CardDescription className="text-xs">Based on your current activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularArticles.map((a) => (
              <button key={a} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium">{a}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
