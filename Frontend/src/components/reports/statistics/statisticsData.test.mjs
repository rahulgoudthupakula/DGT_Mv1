import test from 'node:test';
import assert from 'node:assert/strict';
import {statisticsData,change,fraction} from './statisticsData.ts';
const line=(extra={})=>({id:'1',saleId:'sale1',productId:'item1',date:'2026-05-02',hour:23,name:'Coke',unit:'item',department:'Grocery',category:'Beverages',direction:1,quantity:2,gross:20,discount:2,...extra});
const source=(rows)=>({rows,start:'2026-05-02',end:'2026-05-03',previousStart:'2026-04-30',days:2,today:'2026-09-14',latest:'2026-05-03',timezone:'America/New_York'});
test('grocery net values, distinct purchase receipts and prior equal-length period',()=>{
 const result=statisticsData(source([line(),line({id:'2',quantity:1,gross:5,discount:0}),line({id:'3',saleId:'refund',quantity:1,gross:10,discount:1,direction:-1}),line({date:'2026-04-30',saleId:'old',gross:10,discount:0,quantity:1})]));
 assert.deepEqual(result.totals,{sales:14,transactions:1,avg:14,items:2});assert.equal(result.prior.sales,10);assert.equal(change(result.totals.sales,result.prior.sales),40);assert.equal(result.dailySalesData[1].sales,0);assert.equal(result.hourlyTrend[23].sales,14);
});
test('fuel and lottery are excluded from grocery and fuel products are not hardcoded grades',()=>{
 const result=statisticsData(source([line(),line({id:'2',productId:'e85',name:'E85 Flex',department:'Fuel',gross:50,discount:0}),line({id:'3',productId:'lottery',name:'Scratch card',department:'Lottery Tickets',gross:10,discount:0})]));
 assert.equal(result.totals.sales,18);assert.equal(result.totals.transactions,1);assert.equal(result.allTotal,78);assert.equal(result.statisticsTotals.nonMerch,10);assert.equal(result.grades[0].name,'E85 Flex');assert.equal(result.statisticsTotals.fuel_e85,50);assert.equal(result.topSellingItems.length,1);assert.equal(result.mix.reduce((s,r)=>s+r.value,0),78);
});
test('fuel product IDs stay distinct even when their labels are identical',()=>{
 const result=statisticsData(source([line({productId:'g1',name:'Regular',department:'Gas'}),line({productId:'g2',name:'Regular',department:'Gas'})]));assert.equal(result.grades.length,2);assert.equal(result.mix.filter(r=>r.name==='Regular').length,2);assert.equal(result.totals.transactions,0);
});
test('zero and refund-only periods do not fabricate sales percentages or pies',()=>{
 const empty=statisticsData(source([]));assert.equal(empty.totals.avg,null);assert.equal(empty.data[0].merchPct,null);assert.equal(empty.mixPieValid,false);assert.equal(change(2,0),null);assert.equal(fraction(5,0),null);
 const refund=statisticsData(source([line({direction:-1})]));assert.equal(refund.totals.sales,-18);assert.equal(refund.totals.items,-2);assert.equal(refund.categoryPieValid,false);assert.equal(refund.mixPieValid,false);assert.equal(refund.topSellingItems.length,0);
});
test('negative category mix is not drawn as a misleading pie and top items use net quantities',()=>{
 const result=statisticsData(source([line(),line({id:'2',saleId:'refund',productId:'b',category:'Snacks',direction:-1,quantity:1,gross:1,discount:0})]));assert.equal(result.categoryPieValid,false);assert.equal(result.allTotal,17);assert.equal(result.topSellingItems[0].qty,2);
});
test('money uses cents and dates outside the requested and comparison periods are excluded',()=>{
 const result=statisticsData(source([line({gross:0.1,discount:0}),line({id:'2',gross:0.2,discount:0}),line({date:'2026-05-04',gross:999}),line({date:'2026-04-29',gross:999})]));assert.equal(result.totals.sales,0.3);assert.equal(result.allTotal,0.3);assert.equal(result.prior.sales,0);assert.equal(result.data.length,2);
});
