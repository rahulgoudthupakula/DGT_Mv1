import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/recentFilters.ts", import.meta.url), "utf8");
let generation = 0;
function storage() {
  const values = new Map();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}
async function load(session = storage()) {
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import("data:text/javascript;base64," + Buffer.from(output + `\n// generation ${generation++}`).toString("base64"));
}

test("five most recent distinct choices, newest first", async () => {
  const history = await load();
  for (const label of ["A", "B", "C", "D", "E", "F"]) history.rememberFilter("store1", "department", label);
  assert.deepEqual(history.getRecentFilters("store1", "department"), ["f", "e", "d", "c", "b"]);
  history.rememberFilter("store1", "department", " B ");
  assert.deepEqual(history.getRecentFilters("store1", "department"), ["b", "f", "e", "d", "c"]);
});

test("store and filter histories stay separate", async () => {
  const history = await load();
  history.rememberFilter("store1", "department", "Grocery");
  history.rememberFilter("store1", "vendor", "Vendor One");
  history.rememberFilter("store2", "department", "Fuel");
  assert.deepEqual(history.getRecentFilters("store1", "department"), ["grocery"]);
  assert.deepEqual(history.getRecentFilters("store1", "vendor"), ["vendor one"]);
  assert.deepEqual(history.getRecentFilters("store2", "department"), ["fuel"]);
});

test("current options match by label across IDs and casing, without duplicates or unavailable suggestions", async () => {
  const history = await load();
  history.rememberFilter("store1", "vendor", "Vendor One");
  history.rememberFilter("store1", "vendor", "Removed vendor");
  const options = [{value:"all",label:"All Vendors"},{value:"42",label:"VENDOR ONE"},{value:"99",label:"Other vendor"}];
  const snapshot = structuredClone(options);
  const groups = history.groupRecentFilterOptions(options, history.getRecentFilters("store1", "vendor"));
  assert.deepEqual(groups.pinned, [options[0]]);
  assert.deepEqual(groups.recent, [options[1]]);
  assert.deepEqual(groups.remaining, [options[2]]);
  assert.deepEqual(options, snapshot, "suggestion ordering must not change the caller's options or selected value");
  assert.equal(history.groupRecentFilterOptions([{value:"42",label:"Vendor One",disabled:true}], ["vendor one"]).recent.length, 0);
  assert.equal(history.isResetFilterValue("All Departments"), true);
  assert.equal(history.isResetFilterValue("All Natural Foods"), false);
});

test("page reload retains history, logout clears memory and session storage", async () => {
  const session = storage();
  const firstPage = await load(session);
  firstPage.rememberFilter("store1", "department", "Grocery");
  const nextPage = await load(session);
  assert.deepEqual(nextPage.getRecentFilters("store1", "department"), ["grocery"]);
  nextPage.clearRecentFilters();
  assert.deepEqual(nextPage.getRecentFilters("store1", "department"), []);
  assert.equal(session.values.size, 0);
  const newLogin = await load(session);
  assert.deepEqual(newLogin.getRecentFilters("store1", "department"), []);
});

test("subscribers update immediately and can unsubscribe", async () => {
  const history = await load();
  let updates = 0;
  const unsubscribe = history.subscribeRecentFilters(() => updates++);
  history.rememberFilter("store1", "department", "Grocery");
  history.clearRecentFilters();
  assert.equal(updates, 2);
  unsubscribe();
  history.rememberFilter("store1", "department", "Fuel");
  assert.equal(updates, 2);
});

test("blocked storage and malformed history do not break filtering", async () => {
  const history = await load({getItem(){throw new Error("blocked");},setItem(){throw new Error("blocked");},removeItem(){throw new Error("blocked");}});
  history.rememberFilter("store1", "department", "Grocery");
  assert.deepEqual(history.getRecentFilters("store1", "department"), ["grocery"]);
  history.clearRecentFilters();
  const malformed = await load({getItem:()=>"invalid json"});
  assert.deepEqual(malformed.getRecentFilters("store1", "department"), []);
});
