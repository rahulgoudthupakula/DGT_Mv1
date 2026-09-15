import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Button} from '@/components/ui/button';
import {type Transaction,type TransactionDetail,money} from './liveActivityData';
export const LiveTransactionDetail=({transaction,path}:{transaction:Transaction;path:string})=>{
 const q=useQuery({queryKey:['sale-detail',path,transaction.id],queryFn:()=>request<TransactionDetail>(`${path}/${transaction.id}`)});
 if(q.isPending)return <p className="text-xs py-3">Loading receipt…</p>;
 if(q.error)return <p role="alert">{q.error.message}<Button variant="ghost" onClick={()=>q.refetch()}>Retry</Button></p>;
 return <div className="border-t border-border/60 mt-2 pt-3 space-y-3 text-xs"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-muted-foreground text-left"><th>Item / Quantity</th><th className="text-right">Unit price</th><th className="text-right">Discount</th><th className="text-right">Tax</th><th className="text-right">Line total</th></tr></thead><tbody>{q.data.items.map(i=><tr key={i.id}><td className="py-2">{i.quantity} × {i.name}<div className="text-muted-foreground">{i.unit} · {i.sku}</div></td><td className="text-right">{money(i.price)}</td><td className="text-right">{money(i.discount)}</td><td className="text-right">{money(i.tax)}</td><td className="text-right font-medium">{money(i.total)}</td></tr>)}</tbody></table></div>
 <div className="border-t pt-2 space-y-1"><div className="flex justify-between"><span>Subtotal after discounts</span><span>{money(transaction.subtotal)}</span></div>{transaction.discount!==0&&<div className="flex justify-between text-muted-foreground"><span>Discount (already included)</span><span>{money(transaction.discount)}</span></div>}<div className="flex justify-between"><span>Taxable amount</span><span>{money(transaction.taxableAmount)}</span></div><div className="flex justify-between"><span>Tax</span><span>{money(transaction.tax)}</span></div><div className="flex justify-between font-bold"><span>Total</span><span>{money(transaction.total)}</span></div></div>
 <div className="border-t pt-2"><p className="font-semibold mb-2">Payments</p>{q.data.payments.map((p,i)=><div key={i} className="flex justify-between"><span>{p.name}{p.brand?` · ${p.brand}`:''}{p.last4?` · •••• ${p.last4}`:''} · {p.status}</span><span>{money(p.amount)}</span></div>)}{!q.data.payments.length&&<p>No recorded payments.</p>}</div>
 </div>;
};
