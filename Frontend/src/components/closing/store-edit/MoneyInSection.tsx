import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionField } from "./AccordionField";

export const MoneyInSection = () => (
  <div className="space-y-1">
    <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">💰 Money In</h3>
    <Accordion type="multiple" className="space-y-1">
      {/* 1 - Merchandise Sales */}
      <AccordionItem value="merch-sales" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Merchandise Sales</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Grocery – Tax" value="" onChange={() => {}} showSource />
          <AccordionField label="Grocery – NonTax" value="" onChange={() => {}} showSource />
          <AccordionField label="Cigarette Pack" value="" onChange={() => {}} showSource />
          <AccordionField label="Cigarette Carton" value="" onChange={() => {}} showSource />
          <AccordionField label="Total Merchandise Sales" value="0.00" onChange={() => {}} readOnly />
        </AccordionContent>
      </AccordionItem>

      {/* 2 - Sales Tax */}
      <AccordionItem value="sales-tax" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Sales Tax</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Sales Tax" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 3 - Fuel Sold (Gallons) */}
      <AccordionItem value="fuel-gallons" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Fuel Sold (Gallons)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Regular Volume" value="" onChange={() => {}} showSource />
          <AccordionField label="Plus Volume" value="" onChange={() => {}} showSource />
          <AccordionField label="Super Volume" value="" onChange={() => {}} showSource />
          <AccordionField label="Diesel Volume" value="" onChange={() => {}} showSource />
          <AccordionField label="Total Gas Volume" value="0" onChange={() => {}} readOnly />
        </AccordionContent>
      </AccordionItem>

      {/* 4 - Fuel Sold (Amount) */}
      <AccordionItem value="fuel-amount" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Fuel Sold (Amount)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Regular Amount Sold" value="" onChange={() => {}} showSource />
          <AccordionField label="Plus Amount Sold" value="" onChange={() => {}} showSource />
          <AccordionField label="Super Amount Sold" value="" onChange={() => {}} showSource />
          <AccordionField label="Diesel Amount Sold" value="" onChange={() => {}} showSource />
          <AccordionField label="Total Fuel Amount Sold" value="0.00" onChange={() => {}} readOnly />
        </AccordionContent>
      </AccordionItem>

      {/* 5 - Lottery Tickets Sold */}
      <AccordionItem value="lottery-sold" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Lottery Tickets Sold</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Scratch-off Sales" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 6 - Lottery Reading */}
      <AccordionItem value="lottery-reading" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Lottery Reading</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Net Online Sales" value="" onChange={() => {}} showSource />
          <AccordionField label="Net Online Cash" value="" onChange={() => {}} showSource />
          <AccordionField label="Scratch-off Cash" value="" onChange={() => {}} showSource />
          <AccordionField label="Settlement" value="" onChange={() => {}} showSource />
          <AccordionField label="Adjustment" value="" onChange={() => {}} />
          <AccordionField label="Online Credit" value="" onChange={() => {}} />
          <AccordionField label="Scratch-off Credit" value="" onChange={() => {}} />
          <AccordionField label="Commission" value="" onChange={() => {}} />
          <AccordionField label="Balance" value="" onChange={() => {}} readOnly />
        </AccordionContent>
      </AccordionItem>

      {/* 7 - Gas Gift Card */}
      <AccordionItem value="gas-gift-card" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Gas Gift Card Sold (Cash)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Gas Cards Sold" value="" onChange={() => {}} />
          <AccordionField label="$ Amount of Gas Cards Sold" value="" onChange={() => {}} />
          <AccordionField label="Gas Card Commission" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* 8 - Bill Pay */}
      <AccordionItem value="bill-pay" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Bill Pay Reading</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Bill Pay Total" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 9 - Money Transfer */}
      <AccordionItem value="money-transfer" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Money Transfer Reading</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Money Transfer Total" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 10 - Other Money Received */}
      <AccordionItem value="other-received" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Other Money Received</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Customer Account Pay-in" value="" onChange={() => {}} />
          <AccordionField label="Other Income" value="" onChange={() => {}} />
          <AccordionField label="General Account Pay-in" value="" onChange={() => {}} />
          <AccordionField label="Purchase Rebates" value="" onChange={() => {}} />
          <AccordionField label="Check Cashing Commission" value="" onChange={() => {}} />
          <AccordionField label="Money From Bank" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* 11 - Previous Day Closing */}
      <AccordionItem value="prev-day" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Previous Day Closing (Carry Forward)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Opening Cash" value="" onChange={() => {}} />
          <AccordionField label="Opening Checks" value="" onChange={() => {}} />
          <AccordionField label="Total Opening Amount" value="0.00" onChange={() => {}} readOnly />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);
