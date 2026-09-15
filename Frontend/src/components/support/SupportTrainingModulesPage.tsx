import { useState } from "react";
import {
  PlayCircle,
  FileText,
  Download,
  ChevronRight,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Clock,
  Star,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const trainingModules = [
  { name: "Grocery Training", desc: "Inventory, orders, vendor management", items: 12, progress: 75, category: "Operations" },
  { name: "Gas Training", desc: "Deliveries, tank reports, pricing", items: 9, progress: 40, category: "Operations" },
  { name: "Lottery Training", desc: "Packs, settlements, closing", items: 7, progress: 100, category: "Operations" },
  { name: "Services Training", desc: "Money order, bill pay, ATM", items: 5, progress: 20, category: "Services" },
  { name: "Payroll Training", desc: "Employees, time, taxes", items: 8, progress: 60, category: "Admin" },
  { name: "Bank & Reconciliation", desc: "Ledger, fund transfer, reconcile", items: 6, progress: 0, category: "Admin" },
  { name: "Everyday Closing", desc: "Store, deli, and check-cashing closing", items: 10, progress: 90, category: "Operations" },
  { name: "Tender Types", desc: "Credit card, EBT, fleet cards", items: 6, progress: 0, category: "Admin" },
  { name: "Reports & Analytics", desc: "Sales, profit, net worth reports", items: 8, progress: 30, category: "Reports" },
];

const gettingStartedSteps = [
  { title: "Connect your POS", desc: "Link your point-of-sale terminal to start syncing data automatically.", done: true },
  { title: "First daily closing", desc: "Walk through your first end-of-day closing process step by step.", done: true },
  { title: "First inventory sync", desc: "Import your initial inventory data and verify counts.", done: false },
  { title: "First payroll run", desc: "Set up employees, hours, and run your first paycheck.", done: false },
  { title: "Configure gas delivery", desc: "Set up tank configuration and receive your first delivery.", done: false },
  { title: "Lottery activation", desc: "Receive packs, verify, and activate your first lottery order.", done: false },
];

const featureUpdates = [
  { version: "v3.4.0", date: "2026-02-01", whatsNew: "Gas profit VAT report, improved tank reconciliation UI", fixes: "Fixed lottery settlement rounding, credit card batch timeout" },
  { version: "v3.3.2", date: "2026-01-15", whatsNew: "Deli closing module, check-cashing closing", fixes: "Grocery day sales chart rendering fix" },
  { version: "v3.3.0", date: "2025-12-20", whatsNew: "Net worth dashboard, POS report hub", fixes: "Payroll ledger export, bank reconcile date filter" },
  { version: "v3.2.5", date: "2025-11-10", whatsNew: "Run payroll stepper, punch log drawer in time & attendance", fixes: "Gas price history table sort order, lottery pack history pagination" },
];

const categories = ["All", "Operations", "Admin", "Services", "Reports"];

export const SupportTrainingModulesPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = trainingModules.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || m.category === category;
    return matchSearch && matchCat;
  });

  const completedCount = trainingModules.filter((m) => m.progress === 100).length;
  const inProgressCount = trainingModules.filter((m) => m.progress > 0 && m.progress < 100).length;
  const overallProgress = Math.round(trainingModules.reduce((sum, m) => sum + m.progress, 0) / trainingModules.length);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Training Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Learn the system through guided modules, getting started guides, and feature updates</p>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
                <p className="text-xs text-muted-foreground">Overall Completion</p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Modules Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Clock className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Resources</CardTitle>
          <CardDescription>Guided modules, onboarding, and release notes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="modules">
            <TabsList>
              <TabsTrigger value="modules" className="text-xs">Module Training</TabsTrigger>
              <TabsTrigger value="getting-started" className="text-xs">Getting Started</TabsTrigger>
              <TabsTrigger value="updates" className="text-xs">Feature Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="modules">
              <div className="flex items-center gap-3 mt-4 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search modules…" className="pl-8 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-1">
                  {categories.map((c) => (
                    <Button key={c} variant={category === c ? "default" : "outline"} size="sm" className="h-8 text-xs px-3" onClick={() => setCategory(c)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((m) => (
                  <Card key={m.name} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{m.name}</h4>
                        <div className="flex items-center gap-1.5">
                          {m.progress === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          <Badge variant="secondary" className="text-[10px]">{m.items} lessons</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{m.progress}% complete</span>
                          <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                        </div>
                        <Progress value={m.progress} className="h-1.5" />
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="text-[11px] h-7 gap-1 flex-1"><FileText className="w-3 h-3" /> Guide</Button>
                        <Button variant="outline" size="sm" className="text-[11px] h-7 gap-1 flex-1"><PlayCircle className="w-3 h-3" /> Video</Button>
                        <Button variant="outline" size="sm" className="text-[11px] h-7 gap-1 flex-1"><Download className="w-3 h-3" /> PDF</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="getting-started">
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">New Store Setup Guide</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {gettingStartedSteps.filter(s => s.done).length}/{gettingStartedSteps.length} Complete
                  </Badge>
                </div>
                <Progress value={(gettingStartedSteps.filter(s => s.done).length / gettingStartedSteps.length) * 100} className="h-2" />
                <div className="space-y-3 mt-4">
                  {gettingStartedSteps.map((s, i) => (
                    <div key={s.title} className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${s.done ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card hover:bg-muted/30"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-emerald-500" : "bg-primary/10"}`}>
                        {s.done
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <span className="text-sm font-bold text-primary">{i + 1}</span>
                        }
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">{s.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                      {!s.done && (
                        <Button variant="ghost" size="sm" className="text-[11px] h-7 gap-1">
                          Start <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                      {s.done && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Done</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="updates">
              <div className="space-y-4 mt-4">
                {featureUpdates.map((u) => (
                  <div key={u.version} className="p-4 rounded-lg border bg-card space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className="text-[10px]">{u.version}</Badge>
                      <span className="text-xs text-muted-foreground">{u.date}</span>
                      {u.version === "v3.4.0" && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> Latest
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs"><span className="font-semibold text-emerald-600">What's New:</span> {u.whatsNew}</p>
                      <p className="text-xs mt-1"><span className="font-semibold text-amber-600">Bug Fixes:</span> {u.fixes}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[11px] h-7 gap-1 p-0 hover:bg-transparent">
                      <BookOpen className="w-3 h-3" /> Full release notes <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
