import test from 'node:test';
import assert from 'node:assert/strict';
import {statisticsData,emptyStatistics,change,fraction} from './statisticsData.ts';
test('server summaries remain unchanged; only display colors are added',()=>{
 const stats={...emptyStatistics,totals:{sales:14,transactions:1,avg:14,items:1.5},keys:[{key:'merch',name:'Merchandise'},{key:'fuel_2',name:'Regular'}],grades:[{id:'2',key:'fuel_2',name:'Regular'}],mix:[{key:'fuel_2',name:'Regular',value:50,pct:0.5}],categoryData:[{name:'Beverages',value:14}],topSellingItems:[{id:'1',name:'Cola',category:'Beverages',qty:1.5,revenue:14,rank:1}]};
 const snapshot=JSON.stringify(stats),result=statisticsData(stats);
 assert.deepEqual(result.totals,stats.totals);assert.deepEqual(result.topSellingItems,stats.topSellingItems);
 assert.equal(result.grades[0].color,result.mix[0].color);assert.ok(result.categoryData[0].color);
 assert.equal(JSON.stringify(stats),snapshot);
});
test('empty and unavailable comparisons remain safe',()=>{
 const result=statisticsData(emptyStatistics);assert.equal(result.totals.avg,null);assert.equal(result.hasGrocery,false);assert.deepEqual(result.topSellingItems,[]);
 assert.equal(change(2,0),null);assert.equal(change(14,10),40);assert.equal(fraction(5,0),null);
});
