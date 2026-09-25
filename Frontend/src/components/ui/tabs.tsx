import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const PageTabAccess = React.createContext<Record<string,boolean>>({});
function Tabs({value,defaultValue,onValueChange,...props}:React.ComponentProps<typeof TabsPrimitive.Root>){
 const access=React.useContext(PageTabAccess);
 const [internal,setInternal]=React.useState(defaultValue);
 const requested=value??internal;
 const denied=requested!==undefined&&access[requested]===false;
 const selected=denied?Object.keys(access).find(key=>access[key]):requested;
 React.useEffect(()=>{if(denied&&selected!==undefined){setInternal(selected);onValueChange?.(selected);}},[denied,selected,onValueChange]);
 return <TabsPrimitive.Root {...props} value={selected??''} onValueChange={v=>{if(access[v]!==false){setInternal(v);onValueChange?.(v);}}}/>;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
 const access=React.useContext(PageTabAccess);
 if(access[props.value]===false)return null;
 return (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
);});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => {
 const access=React.useContext(PageTabAccess);
 if(access[props.value]===false)return null;
 return (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  ><PageTabAccess.Provider value={{}}>{children}</PageTabAccess.Provider></TabsPrimitive.Content>
);});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
