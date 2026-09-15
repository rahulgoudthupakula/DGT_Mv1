import test from 'node:test';
import assert from 'node:assert/strict';
import {batchRows,balanceRows,sumMoney,reportCsv} from './tenderReportData.ts';
const card={kind:'card',batch_id:1,group_id:1,group_name:'Processor',business_date:'2026-05-03',batch_reference:'CC-1',pos_sales:80,refund_amount:20,processor_sales:85,expected_fee:2.60,actual_fee:3,chargebacks:5,status:'SETTLED',received_amount:76,settlement_date:'2026-05-04'};
test('card sales/refunds, processor difference and chargebacks reconcile without double subtraction',()=>{
 const [r]=batchRows([card]);assert.equal(r.salesAmount,100);assert.equal(r.netAmount,80);assert.equal(r.expectedNet,77);assert.equal(r.netDeposit,76);assert.equal(r.variance,-1);
 const [balance]=balanceRows([r]);assert.equal(balance.processorDifference,5);assert.equal(balance.pendingDeposit,0);assert.equal(balance.expectedNet,77);assert.equal(balance.totalDeposited-balance.variance+balance.pendingDeposit,balance.expectedNet);
});
test('dated deposit remains pending before settlement and becomes variance only after settlement',()=>{
 const [prior]=balanceRows(batchRows([card],'2026-05-03'));assert.equal(prior.pendingDeposit,77);assert.equal(prior.totalDeposited,0);assert.equal(prior.variance,0);
 const [after]=balanceRows(batchRows([card],'2026-05-04'));assert.equal(after.pendingDeposit,0);assert.equal(after.totalDeposited,76);assert.equal(after.variance,-1);
});
test('mixed SNAP/Cash batch fees and adjustments count once and refund is informational',()=>{
 const [r]=batchRows([{kind:'ebt',group_id:'ebt',group_name:'EBT',batch_id:1,snap_amount:90,cash_amount:20,refund_amount:10,fees:1,adjustment_amount:2,actual_deposit:110,settlement_date:'2026-05-06',status:'RECONCILED'}]);
 assert.equal(r.salesAmount,120);assert.equal(r.totalAmount,110);assert.equal(r.expectedNet,111);assert.equal(r.variance,-1);
 const [balance]=balanceRows([r]);assert.equal(balance.totalBatches,1);assert.equal(balance.totalFees,1);assert.equal(balance.totalDeposited,110);
});
test('fleet statement discount is separate from fees; unknown pending fees stay unknown',()=>{
 const fleet={kind:'fleet',group_id:'wex',group_name:'Fleet (WEX)',batch_id:1,business_date:'2026-05-07',fleet_sales:90,refund_amount:10,processor_fee:1,statement_discount:2,actual_deposit:86,settlement_date:'2026-05-08',status:'SETTLED'};
 const [r]=batchRows([fleet]);assert.equal(r.expectedNet,87);assert.equal(r.fees,1);assert.equal(r.statementDiscount,2);assert.equal(r.variance,-1);
 const [open]=batchRows([{...fleet,batch_id:2,status:'OPEN',actual_deposit:null,settlement_date:null,processor_fee:null,statement_discount:null}]);assert.equal(open.expectedNet,null);assert.equal(open.netDeposit,null);
 const [balance]=balanceRows([r,open]);assert.equal(balance.totalDeposited,86);assert.equal(balance.pendingDeposit,null);assert.equal(balance.totalFees,null);assert.equal(balance.totalBatches,2);
});
test('estimated card fees are labelled; submitted batches do not claim deposits',()=>{
 const [r]=batchRows([{...card,status:'SUBMITTED',actual_fee:null,received_amount:null,settlement_date:null}]);assert.equal(r.estimatedFee,true);assert.equal(r.fees,2.6);assert.equal(r.expectedNet,77.4);assert.equal(r.pending,77.4);assert.equal(r.netDeposit,null);
});
test('grouping uses processor IDs, families and normalized provider IDs; money and CSV are safe',()=>{
 const rows=batchRows([card,{...card,batch_id:2,group_id:2}]);assert.equal(balanceRows(rows).length,2);
 assert.equal(sumMoney([0.1,0.2]),0.3);assert.equal(sumMoney([0,null]),null);assert.equal(sumMoney([]),0);
 assert.equal(reportCsv([['Name','name'],['Amount','amount']],[{name:'=SUM(A1)',amount:-2}]),'"Name","Amount"\r\n"\'=SUM(A1)","-2"');
});
