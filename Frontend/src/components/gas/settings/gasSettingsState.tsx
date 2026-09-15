import {createContext,useContext} from 'react';
export const gasBooleanFields=['sells_diesel','two_blended_grades','auto_flag_variance','variance_approval_required','low_tank_dashboard','low_tank_email','high_variance_dashboard','high_variance_email','repeated_loss_dashboard','repeated_loss_email','missing_reading_dashboard','missing_reading_email','lock_critical_after_delivery'];
export const gasNumberFields=['blend_regular_percentage','federal_multiplier','federal_tolerance_gallons','state_multiplier','state_tolerance_gallons','allowed_variance_percentage','daily_loss_threshold_gallons'];
export const gasTextFields=['plus_tank_type','report_state','supplier_payment_method','gas_brand_type','card_settlement_method'];
export type GasDraft=Record<string,string|boolean>;
export type Grade={id:string;name:string;type:string;octane:number};
export type GasTank={id:string|null;key:string;version:string;number:string;name:string;gradeId:string;capacity:string;safeFill:string;lowLevel:string;prepaidTax:string;taxRate:string;ustFees:string;posMapping:string;capacityLocked:boolean;gradeLocked:boolean;hasReadings:boolean};
export type GasAudit={id:string;timestamp:string;actor:string;event:string;changes:string};
export const tankNumberFields=['capacity','safeFill','lowLevel','prepaidTax','taxRate','ustFees'] as const;
export const emptyGasSettings=()=>Object.fromEntries([...gasBooleanFields.map(k=>[k,false]),...[...gasNumberFields,...gasTextFields].map(k=>[k,''])]) as GasDraft;
export const GasSettingsContext=createContext<{draft:GasDraft;set:(key:string,value:string|boolean)=>void;editable:boolean;tanks:GasTank[];setTanks:(rows:GasTank[])=>void;grades:Grade[];addGrade:(grade:{name:string;type:string;octane:number})=>Promise<void>;audit:GasAudit[];exportAudit:()=>Promise<void>}|null>(null);
export function useGasSettings(){const value=useContext(GasSettingsContext);if(!value)throw Error('Gas settings context missing');return value;}
