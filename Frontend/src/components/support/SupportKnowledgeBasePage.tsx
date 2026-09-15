import { useState } from "react";
import {
  Search,
  BookOpen,
  ChevronRight,
  Tag,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  FileText,
  Fuel,
  ShoppingCart,
  Ticket,
  CreditCard,
  Building2,
  BarChart2,
  Users,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const categories = [
  { label: "Grocery", icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-500/10", count: 12 },
  { label: "Gas Station", icon: Fuel, color: "text-blue-600", bg: "bg-blue-500/10", count: 9 },
  { label: "Lottery", icon: Ticket, color: "text-purple-600", bg: "bg-purple-500/10", count: 7 },
  { label: "Payroll", icon: Users, color: "text-amber-600", bg: "bg-amber-500/10", count: 8 },
  { label: "Tender & Payments", icon: CreditCard, color: "text-rose-600", bg: "bg-rose-500/10", count: 6 },
  { label: "Banking", icon: Building2, color: "text-cyan-600", bg: "bg-cyan-500/10", count: 5 },
  { label: "Closing Reports", icon: BarChart2, color: "text-indigo-600", bg: "bg-indigo-500/10", count: 10 },
  { label: "General / Setup", icon: Layers, color: "text-foreground", bg: "bg-muted", count: 14 },
];

const articles = [
  { id: 1, title: "How to run your first daily closing", category: "Closing Reports", views: 1240, helpful: 98, updated: "2026-02-10", featured: true, content: "Running your daily closing is essential to reconcile all transactions from the day. Navigate to Closing > Store Closing, select today's date, and review each section including cash, cards, and lottery. Once all sections are complete, click 'Close Day' to finalize." },
  { id: 2, title: "Connecting POS to the system", category: "General / Setup", views: 980, helpful: 95, updated: "2026-02-08", featured: true, content: "To connect your POS terminal, go to Settings > POS Settings. Enter your terminal ID and store code. Click 'Test Connection' to verify. If you see a green checkmark, the POS is linked and will sync automatically every 15 minutes." },
  { id: 3, title: "Understanding gas delivery reconciliation", category: "Gas Station", views: 870, helpful: 91, updated: "2026-02-05", featured: true, content: "Gas delivery reconciliation compares your ordered gallons against the actual delivered amount. Go to Gas > Delivery and click the delivery record. Enter your stick reading before and after delivery. The system calculates any variance and flags amounts over your set threshold." },
  { id: 4, title: "Setting up payroll direct deposit", category: "Payroll", views: 760, helpful: 88, updated: "2026-02-01", featured: false, content: "Navigate to Payroll > Direct Deposit and click 'Add Employee Bank Account'. Enter the routing number and account number, then select checking or savings. The employee will receive a test deposit of $0.01 within 2 business days to verify the account." },
  { id: 5, title: "Lottery pack activation guide", category: "Lottery", views: 650, helpful: 92, updated: "2026-01-28", featured: false, content: "Received a new lottery pack delivery? Go to Lottery > Received Delivery, scan or enter the pack serial number, and confirm the game code. Then navigate to Verify & Activate to activate the packs before selling. Packs must be activated before they can be sold." },
  { id: 6, title: "How to add a vendor invoice", category: "Grocery", views: 540, helpful: 85, updated: "2026-01-25", featured: false, content: "Go to Grocery > Orders & Invoices and click 'Add Invoice'. Select the vendor, enter the invoice number and date, then add line items by scanning UPC codes or searching by item name. Review totals and click 'Save & Post' to add to your inventory cost." },
  { id: 7, title: "Running payroll step-by-step", category: "Payroll", views: 480, helpful: 89, updated: "2026-01-22", featured: false, content: "Navigate to Payroll > Run Payroll. Select the pay period (weekly, bi-weekly, or monthly). Review hours pulled from Time & Attendance. The system calculates gross pay, taxes (federal, state, FICA), and deductions. Review the summary and click Approve & Lock to process." },
  { id: 8, title: "Credit card batch not closing", category: "Tender & Payments", views: 420, helpful: 78, updated: "2026-01-20", featured: false, content: "If your credit card batch fails to close, go to Tender > Credit Card > Settlement. Click the batch and select 'Force Close'. If that fails, check that your terminal's time matches server time within 5 minutes. Contact support if the issue persists." },
  { id: 9, title: "Bank reconciliation walkthrough", category: "Banking", views: 380, helpful: 82, updated: "2026-01-18", featured: false, content: "Navigate to Banking > Reconcile. Select the account and statement period. The system shows your book balance and bank balance side by side. Match transactions by clicking the checkboxes. Any unmatched items are flagged. Click 'Complete Reconciliation' when balanced." },
  { id: 10, title: "Understanding inventory cost vs retail value", category: "Grocery", views: 340, helpful: 80, updated: "2026-01-15", featured: false, content: "Your inventory has two values: cost (what you paid) and retail (what you sell for). Go to Grocery > Reports > Inventory Valuation to see both. The difference is your gross margin. Monitor this monthly to catch shrinkage, theft, or pricing errors." },
  { id: 11, title: "EBT foodstamps setup and reconciliation", category: "Tender & Payments", views: 310, helpful: 77, updated: "2026-01-12", featured: false, content: "Go to Tender > EBT. Enter your FNS number and processor terminal ID. EBT sales are captured automatically from your POS. At month-end, run the EBT reconciliation report to match your deposits with the USDA portal totals." },
  { id: 12, title: "Creating a closing report for deli", category: "Closing Reports", views: 290, helpful: 84, updated: "2026-01-10", featured: false, content: "Deli closing is handled separately from main store closing. Go to Closing > Deli Closing. Enter daily sales, waste, and production costs. The system calculates deli profit margin and compares it to your target. Submit daily for accurate monthly totals." },
];

type Article = typeof articles[0];

export const SupportKnowledgeBasePage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down" | null>>({});

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const featured = articles.filter((a) => a.featured);

  if (openArticle) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-1" onClick={() => setOpenArticle(null)}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Knowledge Base
        </Button>

        <div className="space-y-3">
          <Badge variant="secondary" className="text-[10px]">{openArticle.category}</Badge>
          <h1 className="text-2xl font-bold text-foreground">{openArticle.title}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Updated {openArticle.updated}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {openArticle.views.toLocaleString()} views</span>
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" /> {openArticle.helpful}% found helpful</span>
          </div>
        </div>

        <Separator />

        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-foreground leading-relaxed">{openArticle.content}</p>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Related Steps</p>
            {["Navigate to the correct module in the left sidebar", "Use the date filter to select your target period", "Review all flagged items before submitting", "Contact support if any section shows a red warning"].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-foreground">Was this article helpful?</p>
          <Button
            variant={feedback[openArticle.id] === "up" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setFeedback((f) => ({ ...f, [openArticle.id]: f[openArticle.id] === "up" ? null : "up" }))}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Yes
          </Button>
          <Button
            variant={feedback[openArticle.id] === "down" ? "destructive" : "outline"}
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setFeedback((f) => ({ ...f, [openArticle.id]: f[openArticle.id] === "down" ? null : "down" }))}
          >
            <ThumbsDown className="w-3.5 h-3.5" /> No
          </Button>
          {feedback[openArticle.id] && (
            <span className="text-xs text-muted-foreground">Thanks for your feedback!</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse guides, how-tos, and troubleshooting articles</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search articles by title or category…"
          className="pl-10 h-11 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Featured Articles */}
      {!search && !selectedCategory && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((a) => (
              <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenArticle(a)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{a.title}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {a.views.toLocaleString()} views</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {a.helpful}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Browse by Category</h2>
          <button
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
            onClick={() => setSelectedCategory(null)}
          >
            <span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> All Categories</span>
            <span className="text-[10px] opacity-70">{articles.length}</span>
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                onClick={() => setSelectedCategory(isActive ? null : cat.label)}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </span>
                <span className="text-[10px] opacity-70">{cat.count}</span>
              </button>
            );
          })}
        </div>

        {/* Article List */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {selectedCategory ? selectedCategory : "All Articles"}
              <span className="text-muted-foreground font-normal ml-1">({filtered.length})</span>
            </h2>
            {selectedCategory && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setSelectedCategory(null)}>
                Clear filter
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No articles found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <Card key={a.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setOpenArticle(a)}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {a.updated}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> {a.views.toLocaleString()} views</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {a.helpful}% helpful</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
