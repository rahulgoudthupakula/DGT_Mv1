import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source=await readFile(new URL('../src/lib/workforceSchedule.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {scheduleSunday,shiftDates}=await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
test('week selection crosses month and year boundaries using Sunday weeks',()=>{
 assert.equal(scheduleSunday('2027-01-01'),'2026-12-27');
 assert.equal(scheduleSunday('2027-01-03'),'2027-01-03');
 assert.equal(scheduleSunday('2027-01-02'),'2026-12-27');
 assert.deepEqual(shiftDates('2027-01-01','2027-01-01',[0,6]),[{date:'2026-12-27',endDate:'2026-12-27'},{date:'2027-01-02',endDate:'2027-01-02'}]);
});
test('overnight multi-day shifts preserve each end date across a DST weekend',()=>{
 assert.deepEqual(shiftDates('2027-03-12','2027-03-13',[0,5,5]),[{date:'2027-03-07',endDate:'2027-03-08'},{date:'2027-03-12',endDate:'2027-03-13'}]);
 assert.throws(()=>shiftDates('2027-03-12','2027-03-11',[0]));
 assert.throws(()=>shiftDates('2027-03-12','2027-03-14',[0]));
 assert.throws(()=>shiftDates('2027-03-12','2027-03-12',[]));
});
