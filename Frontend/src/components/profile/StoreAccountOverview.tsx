import { useStoreAccess } from "@/lib/store-access";
import fallbackTimezones from "@/lib/timezones.json";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, getStoreSettings, saveStoreSettings, StoreRecord, BusinessDay, isPendingChange } from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, Globe, Clock, Monitor, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const fields = [
  ["store_name", "Store Name / DBA Name"],
  ["store_id", "Store ID"],
  ["legal_business_name", "Legal business name"],
  ["tax_id", "Tax ID"],
  ["license_number", "License number"],
] as const;
type Draft = Record<typeof fields[number][0] | "timezone" | "address" | "phone_number" | "email", string>;
const supportEmail = "support@dgtinnovations.com";
const zoneIntl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
const timezones = ["UTC", ...(zoneIntl.supportedValuesOf?.("timeZone") ?? fallbackTimezones)];

export const StoreAccountOverview = ({ storeId }: { storeId: string }) => {
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const access=useStoreAccess(storeId);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["backend-store", storeId], queryFn: () => getStoreSettings(storeId), enabled: !!storeId && access.data?.modules.STORE_SETTINGS.view===true });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [hours, setHours] = useState<BusinessDay[]>([]);
  const [hoursVersions, setHoursVersions] = useState<Record<string,string>>({});
  const [contactVersion, setContactVersion] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const beginEdit = () => {
    if (!query.data) return;
    setTimezoneOpen(false);
    setHours(weekdays.map(day => { const row=query.data.hours.find(h=>h.day_of_week===day); return {day_of_week:day,status:row?.status ?? "UNSET",open_time:row?.open_time ?? null,close_time:row?.close_time ?? null}; }));
    setHoursVersions(Object.fromEntries(query.data.hours.map(h=>[h.day_of_week,h._version!])));
    setContactVersion(query.data.contact?._version ?? null);
    setDraft({ address: query.data.contact?.address ?? "", phone_number: query.data.contact?.phone_number ?? "", email: query.data.contact?.email ?? "", store_id: query.data.store.store_id ?? "", store_name: query.data.store.store_name ?? "", legal_business_name: query.data.store.legal_business_name ?? "", tax_id: query.data.store.tax_id ?? "", license_number: query.data.store.license_number ?? "", timezone: query.data.store.timezone ?? "" });
    setVersion(query.data.store._version); setError(""); setConflict(false);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || busy || conflict) return;
    setBusy(true); setError("");
    try {
      const { address, phone_number, email, ...storeDraft } = draft;
      const values: Partial<StoreRecord> = { ...storeDraft, store_id: draft.store_id.trim(), store_name: draft.store_name.trim(), timezone: draft.timezone.trim() || null,
        legal_business_name: draft.legal_business_name.trim(), tax_id: draft.tax_id.trim(), license_number: draft.license_number.trim() };
      const contact = contactVersion || address.trim() || phone_number.trim() || email.trim() ? { address: address.trim(), phone_number: phone_number.trim() || null, email: email.trim() || null } : null;
      const saved = await saveStoreSettings(storeId, version, values, contact, contactVersion, hours, hoursVersions);
      if(isPendingChange(saved)){setDraft(null);toast({title:`Submitted for approval (#${saved.requestId})`,description:"Your changes will apply after approval."});await client.invalidateQueries({queryKey:["approvals",storeId]});return;}
      client.setQueryData(["backend-store", storeId], saved);
      await client.invalidateQueries({ queryKey: ["backend-stores"] });
      setDraft(null);
      toast({ title: "Store settings saved" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
      setConflict(err instanceof ApiError && err.status === 409);
    } finally { setBusy(false); }
  };
  if (!storeId) return <p>No stores available for this account.</p>;
  if (access.isPending) return <p>Loading access…</p>;
  if (access.error) return <p role="alert">{access.error.message}</p>;
  if (!access.data?.modules.STORE_SETTINGS.view) return <p>You do not have access to Store Account Overview for this store.</p>;
  if (query.isPending) return <p>Loading store settings…</p>;
  if (query.error) return <p role="alert">{query.error.message} <Button onClick={() => query.refetch()}>Retry</Button></p>;
  const store = query.data.store;
  const contact = query.data.contact;
  const displayField = (label: string, value?: string | null) => (
    <div key={label}><span className="text-muted-foreground block">{label}</span><span className="font-medium block min-h-5">{value ?? ""}</span></div>
  );
  let createdDate = "";
  if (store.created_at && !Number.isNaN(Date.parse(store.created_at))) {
    // Do not silently use the viewer's timezone for a store's signup date.
    try { createdDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: store.timezone || "UTC" }).format(new Date(store.created_at)); }
    catch { createdDate = store.created_at; }
  }
  const editButton = (label = "Edit") => <Button variant="outline" size="sm" disabled={!access.data?.modules.STORE_SETTINGS.edit} onClick={beginEdit}><Edit className="w-4 h-4 mr-1" />{label}</Button>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Store Account Overview</h1>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-lg">Store Identity</CardTitle>{editButton("Edit Store Info")}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {displayField("Store Name", store.store_name)}
            {displayField("Store ID", store.store_id)}
            {displayField("DGT Account Number", store.dgt_id)}
            {displayField("Subscription Status")}
            {displayField("Account Status")}
            {displayField("Created Date", createdDate)}
            {displayField("Last Login")}
            {displayField("Support Contact Email", supportEmail)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-lg">Store Information</CardTitle>{editButton()}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {displayField("Legal Business Name", store.legal_business_name)}
            {displayField("DBA Name", store.store_name)}
            {displayField("Address", contact?.address)}
            {displayField("Phone", contact?.phone_number)}
            {displayField("Store Email ID", contact?.email)}
            {displayField("Tax ID", store.tax_id)}
            {displayField("License #", store.license_number)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-lg">Timezone &amp; Business Hours</CardTitle>{editButton()}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-start gap-3"><Globe className="w-4 h-4 text-muted-foreground mt-0.5" />{displayField("Timezone", store.timezone)}</div>
            <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-muted-foreground mt-0.5" /><div><span className="text-muted-foreground block">Business Hours</span>{weekdays.map(day => { const h=query.data.hours.find(h=>h.day_of_week===day); return <div key={day} className="flex gap-3 min-h-5"><span className="w-24">{day.charAt(0)+day.slice(1).toLowerCase()}</span><span>{!h || h.status==='UNSET' ? '' : h.status==='CLOSED' ? 'Closed' : h.status==='OPEN_24_HOURS' ? 'Open 24 hours' : `${h.open_time} – ${h.close_time}${h.close_time! < h.open_time! ? ' (next day)' : ''}`}</span></div>; })}</div></div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={draft !== null} onOpenChange={open => { if (!open && !busy) setDraft(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Store Information</DialogTitle>
            <DialogDescription>Update your store details below. Empty disabled fields are not available yet.</DialogDescription>
          </DialogHeader>
          {draft && <form onSubmit={save} className="space-y-4">
            <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {fields.map(([key, label]) => <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} required disabled={busy} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
            </div>)}
            <div className="space-y-1">
              <Label htmlFor="timezone">Store timezone</Label>
              <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                <PopoverTrigger asChild>
                  <Button id="timezone" type="button" variant="outline" role="combobox" aria-expanded={timezoneOpen} disabled={busy} className="w-full justify-between font-normal">
                    {draft.timezone || "Select timezone"}<Globe className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search city or region…" aria-label="Search worldwide timezones" onKeyDown={e => { if(e.key==='Enter') e.preventDefault(); }} />
                    <CommandList>
                      <CommandEmpty>No matching timezone.</CommandEmpty>
                      <CommandItem value="Clear timezone unassigned" onSelect={() => { setDraft({...draft, timezone:""}); setTimezoneOpen(false); }}>Clear timezone</CommandItem>
                      {Array.from(new Set([...timezones, "Asia/Kolkata", ...(draft.timezone ? [draft.timezone] : [])])).sort().map(zone =>
                        <CommandItem key={zone} value={zone} keywords={[zone.replace(/_/g, ' ')]} onSelect={() => { setDraft({...draft, timezone:zone}); setTimezoneOpen(false); }}>{zone}</CommandItem>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">For example Asia/Kolkata or America/New_York. Each store has its own timezone. Leaving this blank keeps it unassigned.</p>
            </div>
              {([['address', 'Address', 500], ['phone_number', 'Phone', 20], ['email', 'Store Email ID', 255]] as const).map(([key, label, max]) => <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label><Input id={key} value={draft[key]} maxLength={max} type={key === 'email' ? 'email' : 'text'} required={key === 'address' && !!(contactVersion || draft.phone_number || draft.email)} disabled={busy} onChange={e => setDraft({...draft, [key]: e.target.value})} />
              </div>)}
              {['Support Contact Email'].map(label => <div key={label} className="space-y-1">
                <Label htmlFor={`pending-${label}`}>{label}</Label><Input id={`pending-${label}`} value={supportEmail} readOnly />
              </div>)}
              <fieldset className="space-y-3" disabled={busy}><legend className="font-medium">Business Hours</legend>
              <p className="text-xs text-muted-foreground">Times are local to {draft.timezone || 'the store (timezone not assigned)'}. Closing before opening means the next day.</p>
              {hours.map((h,i) => <div key={h.day_of_week} className="space-y-1">
                <Label htmlFor={`hours-${i}`}>{h.day_of_week.charAt(0)+h.day_of_week.slice(1).toLowerCase()}</Label>
                <select id={`hours-${i}`} className="w-full border rounded-md p-2 bg-background" value={h.status} onChange={e=>setHours(hours.map((v,j)=>j===i?{...v,status:e.target.value as BusinessDay['status'],open_time:null,close_time:null}:v))}>
                  <option value="UNSET"></option><option value="SCHEDULED">Scheduled hours</option><option value="CLOSED">Closed</option><option value="OPEN_24_HOURS">Open 24 hours</option>
                </select>
                {h.status==='SCHEDULED' && <div className="flex gap-2">{(['open_time','close_time'] as const).map(key=><Input key={key} aria-label={`${h.day_of_week} ${key==='open_time'?'opens':'closes'}`} type="time" step="1" required value={h[key] ?? ''} onChange={e=>setHours(hours.map((v,j)=>j===i?{...v,[key]:e.target.value || null}:v))} />)}</div>}
              </div>)}
              </fieldset>
            </div>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            {conflict && <Button type="button" onClick={async () => { await query.refetch(); setDraft(null); setError(""); }}>Discard draft and reload latest</Button>}
            <DialogFooter>
              <Button type="submit" disabled={busy || conflict || !draft.store_name.trim()}>{busy ? "Saving…" : access.data?.modules.STORE_SETTINGS.approval ? "Submit for approval" : "Save changes"}</Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}>Cancel</Button>
            </DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader><CardTitle className="text-lg">Connected Devices</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2"><Monitor className="w-4 h-4 text-muted-foreground" />{displayField("POS Status")}</div>
            <div className="flex items-start gap-2"><RefreshCw className="w-4 h-4 text-muted-foreground" />{displayField("Last Data Sync")}</div>
            {displayField("Data Sync Frequency")}
            {displayField("Registered POS Terminals")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
