import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionField } from "./AccordionField";

export const NotNeededTab = () => (
  <div className="space-y-1">
    <Accordion type="multiple" className="space-y-1">
      {/* A - Closing Tank Reading */}
      <AccordionItem value="tank-reading" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Closing Tank Reading (For Tank Report)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Regular Stick Inches" value="" onChange={() => {}} />
          <AccordionField label="Regular Gallons" value="" onChange={() => {}} />
          <AccordionField label="Super Stick Inches" value="" onChange={() => {}} />
          <AccordionField label="Super Gallons" value="" onChange={() => {}} />
          <AccordionField label="Diesel Stick Inches" value="" onChange={() => {}} />
          <AccordionField label="Diesel Gallons" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* B - ATM Reading */}
      <AccordionItem value="atm-reading" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">ATM Reading (For ATM Balance Report)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="ATM Transactions" value="" onChange={() => {}} />
          <AccordionField label="ATM Dispensed" value="" onChange={() => {}} />
          <AccordionField label="ATM Fee Collected" value="" onChange={() => {}} />
          <AccordionField label="ATM Net EFT" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* C - Money Transfer by Debit */}
      <AccordionItem value="mt-debit" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Money Transfer by Debit Cards (Record Only)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Debit Card Transfers" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* D - Unused Fields */}
      <AccordionItem value="unused" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Unused Fields</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Cigarette Pack Count" value="" onChange={() => {}} />
          <AccordionField label="Cigarette Carton Count" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);
