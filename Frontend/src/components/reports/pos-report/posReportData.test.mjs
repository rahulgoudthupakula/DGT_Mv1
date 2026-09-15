import {test} from 'node:test';
import assert from 'node:assert/strict';
import {posTables} from './posReportData.ts';
const base={id:'1',saleId:'sale',productId:'p',date:'2026-05-01',hour:23,name:'Cola',sku:'C',unit:'item',barcode:'123',department:'Grocery',category:'Drinks',direction:1,quantity:2,gross:20,discount:2,taxable:18,tax:1.26,price:9};
const report=(rows,payments=[])=>({rows,payments,start:'2026-05-01',end:'2026-05-02',today:'2026-09-14',timezone:'America/New_York',closing:{},closingMeta:{}});
test('refunds, duplicate receipt lines and historical cost gaps',()=>{
 const d=posTables(report([base,{...base,id:'2',productId:'q',name:'Snack',gross:4,discount:0,taxable:4,tax:.28,quantity:1},{...base,id:'3',saleId:'refund',direction:-1,gross:10,discount:1,quantity:1,taxable:9,tax:.63}]));
 assert.equal(d.deptSummaryData[0].net,13);assert.equal(d.deptSummaryData[0].refund,9);
 assert.equal(d.itemSalesByHourData[0].txns,2);assert.equal(d.itemSalesByHourData[0].items,2);
 assert.equal(d.profitData[0].cost,null);assert.equal(d.profitData[0].profit,null);assert.equal(d.deptSummaryData[0].promotions,null);
 assert.equal(d.taxSalesData[0].taxableAmt,13);assert.ok(Math.abs(d.taxSalesData[0].taxCollected-.91)<1e-8);
 assert.deepEqual(d.manualRingupData,[]);
});
test('fuel brands avoid split tender guesses and preserve unknown gallons',()=>{
 const gas={...base,department:'Fuel',name:'Regular',unit:'gallon',quantity:10,gross:30,discount:0};
 const rows=[gas,{...gas,saleId:'split',id:'2'},{...gas,saleId:'unknown',id:'3',productId:'unknown',unit:'item'}];
 const pay=(saleId,code,brand)=>({saleId,code,brand,name:code,amount:30});
 const d=posTables(report(rows,[pay('sale','CREDIT_CARD','Visa'),pay('split','CREDIT_CARD','Visa'),pay('split','CASH',null),pay('unknown','CASH',null)]));
 assert.equal(d.unallocatedFuelReceipts,1);assert.equal(d.fuelByCCData.length,1);assert.equal(d.fuelByCCData[0].gallons,10);assert.equal(d.fuelByCCData[0].amount,30);
 assert.equal(d.gasSalesSummaryData.find(r=>r.gradeId==='C'&&r.gallons===null)?.gallons,null);
 assert.equal(d.gasSalesByHourData[0].days,2);
});
test('merchandise scope, by-date grouping and scanned-only unavailable',()=>{
 const rows=[base,{...base,id:'2',saleId:'fuel',department:'Fuel',productId:'gas',date:'2026-05-02'}];
 const d=posTables(report(rows),true,'by-date',true);
 assert.equal(d.deptSummaryData.length,1);assert.equal(d.itemSalesByHourData.length,2);assert.equal(d.itemSalesByHourData[0].hour,'05/01/2026');assert.deepEqual(d.profitData,[]);
});
test('item history uses the latest sale, not a later refund',()=>{
 const d=posTables(report([base,{...base,id:'2',saleId:'later-sale',price:12},{...base,id:'3',saleId:'refund',direction:-1,price:9,date:'2026-05-02'}]));
 assert.equal(d.itemSalesHistoryData[0].price,12);assert.equal(d.itemSalesHistoryData[0].lastSoldDate,'05/01/2026');
 const onlyRefund=posTables(report([{...base,direction:-1}]));assert.equal(onlyRefund.itemSalesHistoryData[0].lastSoldDate,'—');assert.equal(onlyRefund.itemSalesHistoryData[0].price,null);
});
