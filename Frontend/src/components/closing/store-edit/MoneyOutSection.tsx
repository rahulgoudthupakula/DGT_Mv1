import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionField } from "./AccordionField";

export const MoneyOutSection = () => (
  <div className="space-y-1">
    <h3 className="text-sm font-bold text-destructive uppercase tracking-wide mb-2">💸 Money Out</h3>
    <Accordion type="multiple" className="space-y-1">
      {/* 1 - Bank Deposits */}
      <AccordionItem value="bank-deposits" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Bank Deposits</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Total Deposits" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 2 - Loaded in ATM */}
      <AccordionItem value="atm-load" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Loaded in ATM</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Put in ATM" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* 3 - Cash Purchases */}
      <AccordionItem value="cash-purchases" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Cash Purchases</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Cash Purchases" value="" onChange={() => {}} />
          <AccordionField label="Pending Invoices Paid" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* 4 - Credit Card (Jobber) */}
      <AccordionItem value="cc-jobber" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Credit Card (Credited in Jobber Invoice)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Credit Card Batches" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 5 - Credit Card 2 (Bank) */}
      <AccordionItem value="cc-bank" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Credit Card 2 (Credited in Bank)</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Credit Card 2 Batches" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 6 - Food Stamps Reading */}
      <AccordionItem value="food-stamps" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Food Stamps Reading</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="EBT/Foodstamp Batch" value="" onChange={() => {}} showSource />
          <AccordionField label="Fleet Card Volume Sold" value="" onChange={() => {}} showSource />
          <AccordionField label="Fleet Card Amount Sold" value="" onChange={() => {}} showSource />
        </AccordionContent>
      </AccordionItem>

      {/* 7 - Other Money Paid */}
      <AccordionItem value="other-paid" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Other Money Paid</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Customer Account Sales" value="" onChange={() => {}} />
          <AccordionField label="Cash Expenses" value="" onChange={() => {}} />
          <AccordionField label="General Account Paid Out" value="" onChange={() => {}} />
          <AccordionField label="Profit Withdrawn" value="" onChange={() => {}} />
        </AccordionContent>
      </AccordionItem>

      {/* 8 - Closing Amount */}
      <AccordionItem value="closing-amount" className="border rounded-lg px-3">
        <AccordionTrigger className="text-sm py-2.5 hover:no-underline">Closing Amount</AccordionTrigger>
        <AccordionContent>
          <AccordionField label="Closing Cash" value="" onChange={() => {}} />
          <AccordionField label="Closing Checks" value="" onChange={() => {}} />
          <AccordionField label="Total Closing Amount" value="0.00" onChange={() => {}} readOnly />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);
