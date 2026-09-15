import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, AlertTriangle, Package, History, Save, RotateCcw, Percent } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SubdepartmentMargin, type MarginRow } from "./SubdepartmentMargin";
import { request } from "@/lib/backend";
import { useQuery, useQueryClient } from "@tanstack/react-query";
type SettingsResponse = { settings: Record<string, unknown> | null; version: string; margins: MarginRow[]; audit: {id:string;timestamp:string;user:string;changes:string}[] };



export const GrocerySettings = ({storeId}:{storeId:string}) => {
  const client=useQueryClient(),path=`/access/stores/${encodeURIComponent(storeId)}/grocery-settings`;
  const query=useQuery({queryKey:['grocery-settings',storeId],queryFn:()=>request<SettingsResponse>(path),refetchOnWindowFocus:false});
  const [marginRows,setMarginRows]=useState<MarginRow[]>([]);
  const [editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
  // Tax Settings State
  const [defaultTaxType, setDefaultTaxType] = useState("taxable");
  const [overrideCategory, setOverrideCategory] = useState(true);
  const [overrideItem, setOverrideItem] = useState(true);
  const [taxRounding, setTaxRounding] = useState("standard");
  const [ebtExempt, setEbtExempt] = useState(true);
  const [wicExempt, setWicExempt] = useState(true);

  // Expiry Settings State
  const [expiryTracking, setExpiryTracking] = useState(true);
  const [alertDays, setAlertDays] = useState("14");
  const [customAlertDays, setCustomAlertDays] = useState("");
  const [expiredHandling, setExpiredHandling] = useState("warning");
  const [dashboardNotif, setDashboardNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [inAppNotif, setInAppNotif] = useState(true);

  // Reorder Point State
  const [reorderRule, setReorderRule] = useState("days_of_stock");
  const [leadTime, setLeadTime] = useState("3");
  const [safetyStock, setSafetyStock] = useState("15");
  const [itemOverride, setItemOverride] = useState(true);

  const hydrate=(data=query.data,preserveSettings=false)=>{
    if(!preserveSettings){
    const v=data?.settings;
    setDefaultTaxType(String(v?.defaultTaxType??'taxable'));setOverrideCategory(Boolean(v?.overrideCategory??true));setOverrideItem(Boolean(v?.overrideItem??true));
    setTaxRounding(String(v?.taxRounding??'standard'));setEbtExempt(Boolean(v?.ebtExempt??true));setWicExempt(Boolean(v?.wicExempt??true));
    setExpiryTracking(Boolean(v?.expiryTracking??true));const days=Number(v?.alertDays??14);setAlertDays([7,14].includes(days)?String(days):'custom');setCustomAlertDays([7,14].includes(days)?'':String(days));
    setExpiredHandling(String(v?.expiredHandling??'warning'));setDashboardNotif(Boolean(v?.dashboardNotif??true));setEmailNotif(Boolean(v?.emailNotif??false));setInAppNotif(Boolean(v?.inAppNotif??true));
    setReorderRule(String(v?.reorderRule??'fixed'));setLeadTime(String(v?.leadTime??3));setSafetyStock(String(v?.safetyStock??15));setItemOverride(Boolean(v?.itemOverride??true));
    }
    setMarginRows((data?.margins??[]).map(m=>({...m,margin:m.margin==null?'':String(m.margin)})));
  };
  useEffect(()=>{if(!editing)hydrate();},[query.data]);
  const handleSaveSettings=async(marginsOnly=false)=>{
    setError('');
    const actualDays=alertDays==='custom'?customAlertDays:alertDays;
    if(!marginsOnly&&([actualDays,leadTime,safetyStock].some(v=>v.trim()===''||!Number.isFinite(Number(v)))||![Number(actualDays),Number(leadTime)].every(v=>Number.isInteger(v)&&v>=0&&v<=3650)||Number(safetyStock)<0||Number(safetyStock)>1000)){setError('Enter whole days from 0 to 3650 and a safety stock percentage from 0 to 1000.');return;}
    if(marginRows.some(m=>m.margin!==''&&m.margin!=null&&(!Number.isFinite(Number(m.margin))||Number(m.margin)<0||Number(m.margin)>=100))){setError('Margins must be between 0 and 99.99%. Leave blank to clear a default.');return;}
    setSaving(true);
    try{
      const settings=marginsOnly?null:{defaultTaxType,overrideCategory,overrideItem,taxRounding,ebtExempt,wicExempt,expiryTracking,alertDays:Number(actualDays),expiredHandling,dashboardNotif,emailNotif,inAppNotif,reorderRule,leadTime:Number(leadTime),safetyStock:Number(safetyStock),itemOverride};
      await request(path,{method:'PUT',headers:{'If-Match':query.data?.version??'0'},body:JSON.stringify({settings,margins:marginRows.map(m=>({key:m.key,version:m.version,margin:m.margin===''||m.margin==null?null:Number(m.margin)}))})});
      await client.invalidateQueries({queryKey:['grocery-defaults',storeId]});const fresh=await query.refetch();if(fresh.data)hydrate(fresh.data,marginsOnly);if(!marginsOnly)setEditing(false);toast({title:marginsOnly?'Margins saved':'Grocery settings saved'});
    }catch(e){setError(e instanceof Error?e.message:'Could not save settings');}finally{setSaving(false);}
  };
  const labels:Record<string,string>={defaultTaxType:'Default tax type',overrideCategory:'Sub-department tax override',overrideItem:'Item tax override',taxRounding:'Tax rounding',ebtExempt:'EBT exemption',wicExempt:'WIC exemption',expiryTracking:'Expiry tracking',alertDays:'Expiry alert days',expiredHandling:'Expired item handling',dashboardNotif:'Dashboard alerts',emailNotif:'Email alerts',inAppNotif:'In-app alerts',reorderRule:'Reorder rule',leadTime:'Lead time',safetyStock:'Safety stock %',itemOverride:'Item reorder override'};
  const auditLog=(query.data?.audit??[]).flatMap(row=>{try{return (JSON.parse(row.changes) as {field:string;from:unknown;to:unknown}[]).map((change,index)=>({id:row.id+'-'+index,timestamp:new Date(row.timestamp).toLocaleString(),user:row.user,action:labels[change.field]??change.field,from:change.from==null?'Not set':String(change.from),to:change.to==null?'Not set':String(change.to)}));}catch{return [];}});
  if(query.isLoading)return <p>Loading grocery settings…</p>;
  if(query.isError)return <div role="alert"><p>{query.error.message}</p><Button onClick={()=>query.refetch()}>Retry</Button></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Grocery Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure tax, expiry alerts, and reorder points
          </p>
        </div>
        <div className="flex gap-2">{editing?<><Button onClick={()=>handleSaveSettings()} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving?'Saving…':'Save All Settings'}</Button><Button variant="outline" disabled={saving} onClick={()=>{hydrate();setEditing(false);setError('');}}>Cancel</Button></>:<Button onClick={()=>setEditing(true)}>Edit Settings</Button>}</div>
      </div>

      {!query.data?.settings&&<p className="text-sm text-muted-foreground">No settings saved for this store yet. Review the suggested values before saving.</p>}
      {error&&<div role="alert" className="text-destructive">{error}<Button variant="link" onClick={async()=>{const fresh=await query.refetch();if(fresh.data)hydrate(fresh.data);setError('');}}>Reload saved values</Button></div>}
      {/* Settings Tabs */}
      <Tabs defaultValue="tax" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="tax" className="gap-2 py-3">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Tax Settings</span>
          </TabsTrigger>
          <TabsTrigger value="margin" className="gap-2 py-3">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Subdepartment Margin</span>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="gap-2 py-3">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Expiry Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="reorder" className="gap-2 py-3">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Reorder Points</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 py-3">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="margin" className="space-y-6">
          <SubdepartmentMargin allRows={marginRows} onChange={setMarginRows} editable={editing&&!saving} onSave={()=>handleSaveSettings(true)} />
        </TabsContent>


        {/* Tax Settings Tab */}
        <TabsContent value="tax" className="space-y-6"><p className="text-sm text-muted-foreground">Default tax type prefills Add Item. Override rules, rounding and payment exemptions are saved preferences; POS enforcement is pending.</p>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Default Tax Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Default Tax Type</CardTitle>
                <CardDescription>Set the default tax behavior for new items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup disabled={!editing||saving} value={defaultTaxType} onValueChange={setDefaultTaxType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="taxable" id="taxable" />
                    <Label htmlFor="taxable">Taxable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non_taxable" id="non_taxable" />
                    <Label htmlFor="non_taxable">Non-Taxable</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Override Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Override Allowed At</CardTitle>
                <CardDescription>Where tax type can be overridden</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category-override">Category level</Label>
                  <Switch disabled={!editing||saving} id="category-override" checked={overrideCategory} onCheckedChange={setOverrideCategory} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="item-override">Item level</Label>
                  <Switch disabled={!editing||saving} id="item-override" checked={overrideItem} onCheckedChange={setOverrideItem} />
                </div>
              </CardContent>
            </Card>

            {/* Tax Rounding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax Rounding Rule</CardTitle>
                <CardDescription>How to round calculated tax amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Select disabled={!editing||saving} value={taxRounding} onValueChange={setTaxRounding}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rounding rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (nearest cent)</SelectItem>
                    <SelectItem value="round_up">Always round up</SelectItem>
                    <SelectItem value="round_down">Always round down</SelectItem>
                    <SelectItem value="banker">Banker's rounding</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tax Exemption Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax Exemption Categories</CardTitle>
                <CardDescription>Payment types exempt from tax</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ebt-exempt">EBT / Food Stamps</Label>
                  <Switch disabled={!editing||saving} id="ebt-exempt" checked={ebtExempt} onCheckedChange={setEbtExempt} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="wic-exempt">WIC</Label>
                  <Switch disabled={!editing||saving} id="wic-exempt" checked={wicExempt} onCheckedChange={setWicExempt} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expiry Alerts Tab */}
        <TabsContent value="expiry" className="space-y-6"><p className="text-sm text-muted-foreground">Preferences only for now. Expiry processing, sale blocking and notifications are not active yet.</p>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Enable Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expiry Tracking</CardTitle>
                <CardDescription>Enable or disable expiry date monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="expiry-tracking">Enable expiry tracking</Label>
                  <Switch disabled={!editing||saving} id="expiry-tracking" checked={expiryTracking} onCheckedChange={setExpiryTracking} />
                </div>
              </CardContent>
            </Card>

            {/* Alert Before Expiry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alert Before Expiry</CardTitle>
                <CardDescription>When to trigger expiry warnings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup disabled={!editing||saving} value={alertDays} onValueChange={setAlertDays}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7" id="7days" />
                    <Label htmlFor="7days">7 days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="14" id="14days" />
                    <Label htmlFor="14days">14 days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Custom</Label>
                  </div>
                </RadioGroup>
                {alertDays === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" disabled={!editing||saving} min="0"
                      value={customAlertDays}
                      onChange={(e) => setCustomAlertDays(e.target.value)}
                      placeholder="Enter days"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expired Item Handling */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expired Item Handling</CardTitle>
                <CardDescription>What happens when an item expires</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup disabled={!editing||saving} value={expiredHandling} onValueChange={setExpiredHandling}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="block" id="block" />
                    <Label htmlFor="block">Auto-block sale</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="warning" id="warning" />
                    <Label htmlFor="warning">Warning only</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Notification Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Type</CardTitle>
                <CardDescription>How to receive expiry alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dashboard-notif">Dashboard</Label>
                  <Switch disabled={!editing||saving} id="dashboard-notif" checked={dashboardNotif} onCheckedChange={setDashboardNotif} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notif">Email</Label>
                  <Switch disabled={!editing||saving} id="email-notif" checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inapp-notif">In-app</Label>
                  <Switch disabled={!editing||saving} id="inapp-notif" checked={inAppNotif} onCheckedChange={setInAppNotif} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reorder Point Settings Tab */}
        <TabsContent value="reorder" className="space-y-6"><p className="text-sm text-muted-foreground">The order guide currently uses each item’s reorder level and case pack. Days-of-stock forecasting, lead-time and safety-stock automation remain pending.</p>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Default Reorder Rule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Default Reorder Point Rule</CardTitle>
                <CardDescription>How to calculate reorder triggers</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup disabled={!editing||saving} value={reorderRule} onValueChange={setReorderRule}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed quantity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="days_of_stock" id="days_of_stock" />
                    <Label htmlFor="days_of_stock">Days of stock (recommended)</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Lead Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead Time</CardTitle>
                <CardDescription>Average delivery time from vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" disabled={!editing||saving} min="0"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </CardContent>
            </Card>

            {/* Safety Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safety Stock Percentage</CardTitle>
                <CardDescription>Buffer stock to prevent stockouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" disabled={!editing||saving} min="0"
                    value={safetyStock}
                    onChange={(e) => setSafetyStock(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </CardContent>
            </Card>

            {/* Item Level Override */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item-Level Override</CardTitle>
                <CardDescription>Allow overriding reorder settings per item</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="item-override-reorder">Allow item-level override</Label>
                  <Switch disabled={!editing||saving} id="item-override-reorder" checked={itemOverride} onCheckedChange={setItemOverride} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit & Controls Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setting Change History</CardTitle>
              <CardDescription>Track who changed what and when</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.length===0&&<TableRow><TableCell colSpan={6}>No settings changes recorded for this store.</TableCell></TableRow>}
                  {auditLog.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">{log.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.user}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.from}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{log.to}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          disabled title="Rollback is not implemented yet"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Rollback
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Audit Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Controls</CardTitle>
              <CardDescription>All changes are logged. Rollback and automatic retention are not implemented yet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Track all setting changes</Label>
                  <p className="text-sm text-muted-foreground">Log every modification to settings</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable rollback</Label>
                  <p className="text-sm text-muted-foreground">Allow reverting to previous settings</p>
                </div>
                <Switch checked={false} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Retention period</Label>
                  <p className="text-sm text-muted-foreground">How long to keep audit logs</p>
                </div>
                <Select disabled>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Not configured" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
