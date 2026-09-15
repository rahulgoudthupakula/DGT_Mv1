import {createContext} from 'react';
export type ClosingFieldValue={value:string;onChange?:(value:string)=>void;source?:string};
export const ClosingFieldContext=createContext<{fields:Record<string,ClosingFieldValue>;locked:boolean;showSource:(label:string,source:string)=>void}|null>(null);
