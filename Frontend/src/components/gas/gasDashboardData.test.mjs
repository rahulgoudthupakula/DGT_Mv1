import test from 'node:test';
import assert from 'node:assert/strict';
import {tankAlerts,tankPercent,tankLow} from './gasDashboardData.ts';
const tank=(x={})=>({id:'1',number:'T1',gradeName:'Regular',capacity:1000,threshold:20,currentGallons:100,measuredGallons:100,measuredAt:null,lowEnabled:true,missingEnabled:true,missingToday:true,...x});
test('low and missing-reading checks follow configured switches and thresholds',()=>{
 assert.equal(tankLow(tank()),true);assert.equal(tankAlerts([tank()]).length,2);
 assert.equal(tankAlerts([tank({lowEnabled:false,missingEnabled:false})]).length,0);
 assert.equal(tankLow(tank({threshold:5})),false);
 assert.equal(tankLow(tank({currentGallons:200})),true);
});
test('unknown readings and thresholds do not invent low stock',()=>{
 assert.equal(tankPercent(tank({currentGallons:null})),null);
 assert.equal(tankLow(tank({currentGallons:null})),false);
 assert.equal(tankLow(tank({threshold:null})),false);
 assert.equal(tankPercent(tank({capacity:0})),null);
});
test('invalid recorded levels are flagged without claiming leak detection',()=>{
 const alerts=tankAlerts([tank({currentGallons:1200,missingToday:false})]);
 assert.equal(alerts.length,1);assert.equal(alerts[0].severity,'error');
 assert.equal(tankPercent(tank({currentGallons:1200})),120);
 assert.deepEqual(tankAlerts([]),[]);
});
