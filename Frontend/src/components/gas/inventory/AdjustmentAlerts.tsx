// Alerts must come from actual store requests, never sample counts.
export const AdjustmentAlerts = ({pending=0}:{pending?:number}) => pending>0 ? (
 <p className="rounded-md bg-warning/10 text-warning px-3 py-2 text-xs">{pending} adjustment{pending===1?'':'s'} pending approval</p>
) : null;
