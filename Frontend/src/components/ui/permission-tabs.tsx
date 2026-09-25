import { createContext, useContext, useEffect, useState, type ComponentProps } from 'react';
import { Tabs, TabsContent, TabsTrigger } from './tabs';
import { useStoreAccess } from '@/lib/store-access';
import { childPermissions } from '@/lib/page-permissions';
const Visibility = createContext<(value:string)=>boolean>(()=>true);
export function PermissionTabs({storeId,parent,value,defaultValue,onValueChange,...props}:ComponentProps<typeof Tabs>&{storeId:string;parent:string}) {
 const access=useStoreAccess(storeId);
 const [internal,setInternal]=useState(defaultValue);
 const mapping=childPermissions[parent]??{};
 const allowed=(tab:string)=>access.data?.pages?.[mapping[tab]]===true;
 const requested=value??internal;
 const selected=requested&&allowed(requested)?requested:Object.keys(mapping).find(allowed);
 useEffect(()=>{if(selected&&selected!==requested){setInternal(selected);onValueChange?.(selected);}},[selected,requested,onValueChange]);
 return <Visibility.Provider value={allowed}><Tabs {...props} value={selected??''} onValueChange={v=>{if(allowed(v)){setInternal(v);onValueChange?.(v);}}}/></Visibility.Provider>;
}
export function PermissionTabsTrigger(props:ComponentProps<typeof TabsTrigger>){const visible=useContext(Visibility);return visible(props.value)?<TabsTrigger {...props}/>:null;}
export function PermissionTabsContent(props:ComponentProps<typeof TabsContent>){const visible=useContext(Visibility);return visible(props.value)?<TabsContent {...props}/>:null;}
