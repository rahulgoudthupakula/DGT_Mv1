import { request } from "@/lib/backend";
import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Paperclip,
  TicketCheck,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  MessageSquare,
  X,
  ChevronDown,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Ticket = {ticket_id:number; id:string;subject:string;module:string;priority:string;status:string;created:string;updated:string;messages:number};
type Message = { sender: "store" | "dgt"; text: string };

const priorityColor: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Low: "bg-muted text-muted-foreground border-border",
};

const statusIcon: Record<string, React.ReactNode> = {
  Open: <Clock className="w-3.5 h-3.5 text-blue-500" />,
  "In Progress": <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  Resolved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
};

const statusBadge: Record<string, string> = {
  Open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "In Progress": "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const ALL_STATUSES = ["Open", "In Progress", "Resolved"] as const;

export const SupportTicketsPage = ({storeId}: {storeId:string}) => {
  const base = `/access/stores/${encodeURIComponent(storeId)}/support-tickets`;
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const createKey=useRef(crypto.randomUUID());
  const replyKey=useRef(crypto.randomUUID());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [replyText, setReplyText] = useState("");
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [newForm, setNewForm] = useState({ subject: "", module: "", priority: "", description: "", phone: "" });

  useEffect(()=>{createKey.current=crypto.randomUUID();},[newForm]);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [viewTicket, conversations]);

  useEffect(() => {
    let active=true;
    const load=async()=>{try{const rows=await request<Ticket[]>(base);if(active){setTickets(rows);setViewTicket(old=>old?(rows.find(t=>t.id===old.id)??old):null);setError("");}}catch(e){if(active)setError(e instanceof Error?e.message:"Unable to load tickets");}};
    void load(); const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer);};
  },[base]);
  useEffect(()=>{
    if(!viewTicket)return;let active=true;
    const load=async()=>{try{const rows=await request<Message[]>(`${base}/${viewTicket.ticket_id}/messages`);if(active)setConversations(old=>({...old,[viewTicket.id]:rows}));}catch(e){if(active)setError(e instanceof Error?e.message:"Unable to load replies");}};
    void load();const timer=setInterval(load,10000);return()=>{active=false;clearInterval(timer);};
  },[base,viewTicket?.ticket_id]);
  const handleSubmitTicket = async () => {
    if(busy||!newForm.subject.trim()||!newForm.description.trim())return;
    setBusy(true);setError("");
    try{const t=await request<Ticket>(base,{method:"POST",headers:{"Idempotency-Key":createKey.current},body:JSON.stringify(newForm)});setTickets(old=>[t,...old.filter(x=>x.id!==t.id)]);setShowNewTicket(false);setViewTicket(t);setNewForm({subject:"",module:"",priority:"",description:"",phone:""});createKey.current=crypto.randomUUID();}
    catch(e){setError(e instanceof Error?e.message:"Unable to submit ticket");}finally{setBusy(false);}
  };
  const handleSendReply = async () => {
    if(busy||!viewTicket||!replyText.trim())return;setBusy(true);setError("");
    try{const rows=await request<Message[]>(`${base}/${viewTicket.ticket_id}/messages`,{method:"POST",headers:{"Idempotency-Key":replyKey.current},body:JSON.stringify({text:replyText})});setConversations(old=>({...old,[viewTicket.id]:rows}));setReplyText("");replyKey.current=crypto.randomUUID();}
    catch(e){setError(e instanceof Error?e.message:"Unable to send reply");}finally{setBusy(false);}
  };
  const updateTicketStatus = async (id:string,status:string) => {
    if(busy||!viewTicket)return;setBusy(true);setError("");
    try{await request(`${base}/${viewTicket.ticket_id}/status`,{method:"POST",body:JSON.stringify({status})});setTickets(old=>old.map(t=>t.id===id?{...t,status}:t));setViewTicket(old=>old?{...old,status}:old);}
    catch(e){setError(e instanceof Error?e.message:"Unable to update status");}finally{setBusy(false);}
  };

  const filtered = tickets.filter((t) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    All: tickets.length,
    Open: tickets.filter((t) => t.status === "Open").length,
    "In Progress": tickets.filter((t) => t.status === "In Progress").length,
    Resolved: tickets.filter((t) => t.status === "Resolved").length,
  };

  return (
    <div className="space-y-8">
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your support requests</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNewTicket(true)}>
          <Plus className="w-4 h-4" /> Create New Ticket
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", count: counts.All, icon: TicketCheck, color: "text-foreground", bg: "bg-muted" },
          { label: "Open", count: counts.Open, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "In Progress", count: counts["In Progress"], icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Resolved", count: counts.Resolved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((k) => (
          <Card key={k.label} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setStatusFilter(k.label === "Total" ? "All" : k.label)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{k.count}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Tickets</CardTitle>
            <CardDescription>
              {statusFilter === "All" ? "All tickets" : `Showing: ${statusFilter}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search tickets…" className="pl-8 h-8 text-xs w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Ticket ID</TableHead>
                <TableHead className="text-[11px]">Subject</TableHead>
                <TableHead className="text-[11px]">Module</TableHead>
                <TableHead className="text-[11px]">Priority</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Messages</TableHead>
                <TableHead className="text-[11px]">Created</TableHead>
                <TableHead className="text-[11px]">Last Updated</TableHead>
                <TableHead className="text-[11px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => { setViewTicket(t); setReplyText(""); }}>
                  <TableCell className="font-mono text-xs font-medium">{t.id}</TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate">{t.subject}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{t.module}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${priorityColor[t.priority]}`}>{t.priority}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] flex items-center gap-1 w-fit ${statusBadge[t.status]}`}>
                      {statusIcon[t.status]} {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" /> {t.messages}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.created}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.updated}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={(e) => { e.stopPropagation(); setViewTicket(t); setReplyText(""); }}>
                      View <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Ticket Sheet */}
      <Sheet open={!!viewTicket} onOpenChange={(open) => !open && setViewTicket(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto flex flex-col">
          {viewTicket && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-base">{viewTicket.id}</SheetTitle>
                  {error && <p role="alert" className="text-destructive">{error}</p>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity ${statusBadge[viewTicket.status]}`}>
                        {statusIcon[viewTicket.status]}
                        {viewTicket.status}
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      {ALL_STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          className="text-xs gap-2"
                          onClick={() => updateTicketStatus(viewTicket.id, s)}
                        >
                          {statusIcon[s]}
                          {s}
                          {viewTicket.status === s && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <SheetDescription>{viewTicket.subject}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Module", value: viewTicket.module },
                    { label: "Priority", value: viewTicket.priority },
                    { label: "Created", value: viewTicket.created },
                    { label: "Last Updated", value: viewTicket.updated },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Conversation */}
                <div className="rounded-lg bg-muted/50 p-4 flex-1 flex flex-col min-h-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Conversation ({conversations[viewTicket.id]?.length ?? 0} messages)
                  </p>
                  <div className="space-y-3 overflow-y-auto flex-1 max-h-64 pr-1">
                    {(conversations[viewTicket.id] ?? []).map((msg, i) => (
                      msg.sender === "dgt" ? (
                        /* DGT Support — left */
                        <div key={i} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[9px] font-bold text-primary-foreground">DGT</span>
                          </div>
                          <div className="flex-1 bg-card rounded-lg p-3 text-xs shadow-sm">
                            <p className="font-semibold text-foreground mb-1">DGT Support</p>
                            <p className="text-muted-foreground">{msg.text}</p>
                          </div>
                        </div>
                      ) : (
                        /* My Store (client) — right */
                        <div key={i} className="flex gap-2 flex-row-reverse">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[9px] font-bold text-primary">MA</span>
                          </div>
                          <div className="flex-1 bg-primary/10 border border-primary/15 rounded-lg p-3 text-xs shadow-sm">
                            <p className="font-semibold text-foreground mb-1 text-right">My Store</p>
                            <p className="text-muted-foreground text-right">{msg.text}</p>
                          </div>
                        </div>
                      )
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                </div>

                {/* Reply */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Reply</Label>
                  <Textarea
                    placeholder="Type your reply…"
                    rows={3}
                    value={replyText}
                    onChange={(e) => {setReplyText(e.target.value);replyKey.current=crypto.randomUUID();}}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendReply();
                    }}
                  />
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={handleSendReply}
                    disabled={busy || !replyText.trim()}
                  >
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Ticket Sheet */}
      <Sheet open={showNewTicket} onOpenChange={setShowNewTicket}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <SheetTitle>Create New Ticket</SheetTitle>
            <SheetDescription>Fill in the details below and our team will get back to you shortly.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Brief description of the issue"
                value={newForm.subject}
                onChange={(e) => setNewForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Module <span className="text-destructive">*</span></Label>
              <Select value={newForm.module} onValueChange={(v) => setNewForm((f) => ({ ...f, module: v }))}>
                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent>
                  {["Grocery", "Gas", "Lottery", "Payroll", "Tender", "Banking", "Services", "Closing Reports", "Other"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Priority <span className="text-destructive">*</span></Label>
              <Select value={newForm.priority} onValueChange={(v) => setNewForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description *</Label>
              <Textarea
                placeholder="Describe the issue in detail…"
                rows={4}
                value={newForm.description}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contact Phone (optional)</Label>
              <Input
                placeholder="(555) 000-0000"
                value={newForm.phone}
                onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmitTicket}
                disabled={busy || !newForm.subject.trim() || !newForm.description.trim() || !newForm.module || !newForm.priority}
              >
                Submit Ticket
              </Button>
              <Button variant="outline" onClick={() => setShowNewTicket(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
