// All edits resolve to the same purchase gross/discount columns used by Items.
export function costEdit(i: {unitType:string;unitsPerCase:number;purchaseGrossCost:number;purchaseDiscount:number;cost:number}, key:string, value:number|null) {
 const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
 if(key==='margin'){
  if(value==null||!Number.isFinite(value)||value>=100)throw Error('Enter a margin below 100%.');
  if(i.cost==null||!Number.isFinite(i.cost))throw Error('Enter an item cost before setting margin.');
  return {retail:round(i.cost/(1-value/100))};
 }
 if(!['cost','itemGrossCost','itemDiscount','itemNetCost','caseGrossCost','caseDiscount','caseNetCost'].includes(key))return {[key]:value};
 if(value!=null&&(!Number.isFinite(value)||value<0))throw Error('Costs and discounts cannot be negative.');
 const inputCase=key.startsWith('case'),storedCase=i.unitType==='case';
 if((inputCase||storedCase)&&(!Number.isInteger(i.unitsPerCase)||i.unitsPerCase<=0))throw Error('Enter a positive whole number of units per case first.');
 const factor=(storedCase?i.unitsPerCase:1)/(inputCase?i.unitsPerCase:1);
 const n=value==null?null:round(value*factor);
 if(key.endsWith('Discount'))return {purchaseDiscount:n};
 if(key==='cost'||key.endsWith('NetCost'))return {purchaseGrossCost:n==null?null:round(n+(i.purchaseDiscount??0)),purchaseDiscount:i.purchaseDiscount??0};
 return {purchaseGrossCost:n,purchaseDiscount:i.purchaseDiscount??0};
}
