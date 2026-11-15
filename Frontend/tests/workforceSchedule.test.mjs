import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source=await readFile(new URL('../src/lib/workforceSchedule.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {scheduleMonday,shiftDates}=await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
test('week selection crosses month and year boundaries using Monday weeks',()=>{
 assert.equal(scheduleMonday('2027-01-01'),'2026-12-28');
 assert.deepEqual(shiftDates('2027-01-01','2027-01-01',[5,6]),[{date:'2027-01-02',endDate:'2027-01-02'},{date:'2027-01-03',endDate:'2027-01-03'}]);
});
test('overnight multi-day shifts preserve each end date across a DST weekend',()=>{
 assert.deepEqual(shiftDates('2027-03-12','2027-03-13',[6,4,4]),[{date:'2027-03-12',endDate:'2027-03-13'},{date:'2027-03-14',endDate:'2027-03-15'}]);
 assert.throws(()=>shiftDates('2027-03-12','2027-03-11',[0]));
 assert.throws(()=>shiftDates('2027-03-12','2027-03-14',[0]));
 assert.throws(()=>shiftDates('2027-03-12','2027-03-12',[]));
});
