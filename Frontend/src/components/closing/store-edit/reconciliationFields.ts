export const reconciliationFields:Record<string,string>={
 'Opening Checks':'opening_checks','Closing Checks':'closing_checks',
 'Cash Purchases':'cash_purchases','Pending Invoices Paid':'pending_invoices_paid',
 'Credit Card Batches':'card_jobber_settlement','Credit Card 2 Batches':'card_bank_settlement',
 'Net Online Sales':'lottery_online_sales','Net Online Cash':'lottery_online_cash',
 'Scratch-off Cash':'lottery_scratch_cash','Settlement':'lottery_settlement','Adjustment':'lottery_adjustment',
 'Online Credit':'lottery_online_credit','Scratch-off Credit':'lottery_scratch_credit','Commission':'lottery_commission','Balance':'lottery_balance',
};
export const nonnegativeReadings=new Set(['opening_checks','closing_checks','cash_purchases','pending_invoices_paid','deposit_cash','deposit_checks']);
export const readingNote=(key:string)=>key.startsWith('card_')?'Enter the amount actually credited on the settlement statement. Recorded card sales are not proof of settlement.':key.startsWith('lottery_')?'Enter the corresponding daily lottery statement reading. These readings reconcile lottery activity; they do not create additional POS sales. Balance is the statement balance.':key.includes('purchases')||key.includes('invoices')?'Cash paid from the drawer, excluding Cash Expenses and cash drops already recorded. Saving records the cash payment; it does not mark a vendor invoice paid.':'Counted checks for this business date.';
