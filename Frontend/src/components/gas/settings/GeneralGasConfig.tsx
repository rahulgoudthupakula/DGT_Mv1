import {useGasSettings} from "./gasSettingsState";
import {FuelGradeSetup} from "./FuelGradeSetup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const usStates = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
  "District of Columbia","Puerto Rico","Guam","American Samoa","U.S. Virgin Islands","Northern Mariana Islands","Baker Island","Howland Island"
];

export const GeneralGasConfig = () => { const {draft,set,editable}=useGasSettings(); return (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">General Gas Configuration</CardTitle>
      <p className="text-xs text-muted-foreground">Store configuration. Report calculations, blending/POS and payment execution will be connected with those workflows.</p>
    </CardHeader>
    <CardContent className="space-y-5">
      {/* Grade & Tank Setup */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Grade & Tank Setup</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Plus Grade Tank Type</Label>
            <Select disabled={!editable} value={String(draft.plus_tank_type)} onValueChange={v=>set("plus_tank_type",v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blended" className="text-xs">Blended</SelectItem>
                <SelectItem value="separate" className="text-xs">Separate Tank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Blend Ratio (% Regular)</Label>
            <Input type="number" aria-label="blend_regular_percentage" disabled={!editable} value={String(draft.blend_regular_percentage)} onChange={e=>set("blend_regular_percentage",e.target.value)} className="h-8 text-xs" placeholder="e.g. 50" />
          </div>
          <div className="flex items-center justify-between gap-3 pt-4">
            <Label className="text-xs">Do you sell Diesel?</Label>
            <Switch aria-label="Sell diesel" disabled={!editable} checked={Boolean(draft.sells_diesel)} onCheckedChange={v=>set("sells_diesel",v)} />
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <Label className="text-xs">Do you have 2 blended grades?</Label>
            <Switch aria-label="Two blended grades" disabled={!editable} checked={Boolean(draft.two_blended_grades)} onCheckedChange={v=>set("two_blended_grades",v)} />
          </div>
        </div>
      </div>

      <FuelGradeSetup />
      <Separator />

      {/* Tolerance & Multipliers */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tolerance & Multipliers</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Federal Multiplier</Label>
            <Input type="number" step="0.001" aria-label="federal_multiplier" disabled={!editable} value={String(draft.federal_multiplier)} onChange={e=>set("federal_multiplier",e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Federal Tolerance</Label>
            <Input type="number" aria-label="federal_tolerance_gallons" disabled={!editable} value={String(draft.federal_tolerance_gallons)} onChange={e=>set("federal_tolerance_gallons",e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State Multiplier</Label>
            <Input type="number" step="0.001" aria-label="state_multiplier" disabled={!editable} value={String(draft.state_multiplier)} onChange={e=>set("state_multiplier",e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State Tolerance</Label>
            <Input type="number" aria-label="state_tolerance_gallons" disabled={!editable} value={String(draft.state_tolerance_gallons)} onChange={e=>set("state_tolerance_gallons",e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Tank Report Template */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tank Report Template</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">State</Label>
            <Select disabled={!editable} value={String(draft.report_state)} onValueChange={v=>set("report_state",v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {usStates.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Supplier & Payment */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Supplier & Payment</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">How is the gas supplier paid?</Label>
            <Select disabled={!editable} value={String(draft.supplier_payment_method)} onValueChange={v=>set("supplier_payment_method",v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ach" className="text-xs">ACH</SelectItem>
                <SelectItem value="check" className="text-xs">Check</SelectItem>
                <SelectItem value="wire" className="text-xs">Wire Transfer</SelectItem>
                <SelectItem value="auto-debit" className="text-xs">Auto Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bank Account for Supplier Payments (not connected)</Label>
            <Select disabled>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>

            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Credit Card Settlement */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Credit Card Settlement</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Gas Brand</Label>
            <Select disabled={!editable} value={String(draft.gas_brand_type)} onValueChange={v=>set("gas_brand_type",v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="branded" className="text-xs">Branded</SelectItem>
                <SelectItem value="unbranded" className="text-xs">Unbranded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">How does the supplier settle credit cards?</Label>
            <Select disabled={!editable} value={String(draft.card_settlement_method)} onValueChange={v=>set("card_settlement_method",v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="direct" className="text-xs">Directly in my bank account</SelectItem>
                <SelectItem value="jobber" className="text-xs">Jobber invoice credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);};
