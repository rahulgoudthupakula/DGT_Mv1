import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source=await readFile(new URL("../src/lib/filterSelection.ts",import.meta.url),"utf8");
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {matchesFilter,toggleFilter,filterParams,searchFilterOptions}=await import("data:text/javascript;base64,"+Buffer.from(output).toString("base64"));

test("multiple departments and vendors use OR within each filter and combine with AND",()=>{
  const rows=[{dept:"Grocery",vendors:["A"]},{dept:"Beverages",vendors:["B","C"]},{dept:"Fuel",vendors:["A"]},{dept:"Grocery",vendors:["D"]}];
  assert.deepEqual(rows.filter(row=>matchesFilter(["Grocery","Beverages"],row.dept)&&matchesFilter(["A","C"],row.vendors)),rows.slice(0,2));
  assert.equal(matchesFilter([],null),true);
  assert.equal(matchesFilter(["Grocery"],null),false);
  assert.equal(matchesFilter(["A"],[]),false);
});
test("choosing another option adds it; deselecting removes only that choice",()=>{
  const original=["Grocery"];
  const both=toggleFilter(original,"Beverages");
  assert.deepEqual(both,["Grocery","Beverages"]);
  assert.deepEqual(original,["Grocery"]);
  assert.deepEqual(toggleFilter(both,"Grocery"),["Beverages"]);
  assert.deepEqual(toggleFilter(["Grocery"],"Grocery"),[]);
});
test("search ignores case and leading/trailing whitespace without losing the selected options",()=>{
  const options=[{value:"1",label:"Grocery"},{value:"2",label:"Fresh Beverages"},{value:"3",label:"Fuel"}];
  assert.deepEqual(searchFilterOptions(options," BEV "),[options[1]]);
  assert.deepEqual(searchFilterOptions(options,""),options);
  assert.deepEqual(searchFilterOptions(options,"missing"),[]);
  assert.equal(options.length,3);
});
test("report query uses repeated vendor parameters and preserves commas in names",()=>{
  const params=filterParams({vendor:["Z","A, Inc","Z"],status:"invoiced"});
  assert.deepEqual(params.getAll("vendor"),["A, Inc","Z"]);
  assert.equal(params.get("status"),"invoiced");
  assert.equal(filterParams({vendor:[]}).has("vendor"),false);
  assert.deepEqual(filterParams({vendor:"A, Inc"}).getAll("vendor"),["A, Inc"]);
});
