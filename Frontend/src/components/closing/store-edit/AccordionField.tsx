import {useContext,useId} from 'react';
import {ClosingFieldContext} from './ClosingFieldContext';
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccordionFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  showSource?: boolean;
}

export const AccordionField = ({ label, value, onChange, readOnly, showSource }: AccordionFieldProps) => {
  const context=useContext(ClosingFieldContext);
  const id=useId();
  const field=context?.fields[label];
  const unavailable=!!context&&!field;
  const locked=context ? context.locked||!field?.onChange : readOnly;
  return (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <label htmlFor={id} className="text-sm text-muted-foreground whitespace-nowrap min-w-[180px]">{label}</label>
    <div className="flex items-center gap-1.5">
      <Input
        id={id}
        aria-label={label}
        disabled={unavailable}
        title={unavailable?"Not connected yet":field?.source}
        type="text"
        value={context?(field?.value??"—"):value}
        onChange={(e) => context?field?.onChange?.(e.target.value):onChange(e.target.value)}
        readOnly={locked}
        className={`w-[140px] h-8 text-sm text-right ${locked ? "bg-muted/50 font-semibold" : ""}`}
      />
      {showSource && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`View source for ${label}`} title={field?.source?"View Source":"Source not connected"} disabled={!!context&&!field?.source} onClick={()=>{if(context&&field?.source)context.showSource(label,field.source);}}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </div>
);
};
