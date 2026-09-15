export type BolHeader = {
  bolNumber: string; folio: string; loadDate: string; loadTime: string;
  terminal: string; supplier: string; customer: string; destination: string;
  carrier: string; driver: string; tractor: string; trailer: string; notes: string;
};
export type BolLine = {
  key: string; productCode: string; description: string; octane: string;
  grossGallons: string; netGallons: string; temperature: string; gravity: string;
  meter: string; compartment: string; tank: string; gradeId: string;
};
export type DeliveryLine = Omit<BolLine,'octane'|'grossGallons'|'netGallons'|'temperature'|'gravity'> & {
  id: string; octane: number|null; grossGallons: number; netGallons: number;
  temperature: number|null; gravity: number|null; gradeName: string; fuelType: string;
  tankNumber: string; tankName: string;
};
export type Delivery = {
  id: string; version: string; status: 'DRAFT'|'RECEIVED'; header: BolHeader;
  lines: DeliveryLine[]; vendorName: string; receivedAt: string|null;
  receivedBy: string; createdBy: string; createdAt: string;
};
export type Assignment = {gradeId:string;gradeName:string;fuelType:string;octane:number;effectiveFrom:string;effectiveTo:string|null};
export type DeliveryOptions = {
  vendors:{id:string;name:string}[];
  tanks:{id:string;number:string;name:string;capacity:number;assignments:Assignment[]}[];
};
export type DeliveryData = {deliveries:Delivery[];canEdit:boolean;canReceive:boolean;today:string};
export function assignmentOn(tank:DeliveryOptions['tanks'][number],date:string) {
  const active=tank.assignments.filter(a=>a.effectiveFrom<=date&&(!a.effectiveTo||a.effectiveTo>=date));
  return active.length===1?active[0]:undefined;
}
export function exportDeliveries(deliveries:Delivery[]) {
  const rows:unknown[][]=[['BOL #','Load date','Load time','Vendor','Product code','Description','Fuel grade','Tank','Gross gallons','Net gallons','Status','Received at','Received by']];
  for(const d of deliveries)for(const l of d.lines)rows.push([d.header.bolNumber,d.header.loadDate,d.header.loadTime,d.vendorName,l.productCode,l.description,l.gradeName,l.tankNumber,l.grossGallons,l.netGallons,d.status,d.receivedAt,d.receivedBy]);
  const csv=rows.map(row=>row.map(value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.split('"').join('""')+'"';}).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='gas-deliveries.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
