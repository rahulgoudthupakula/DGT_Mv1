import {useState} from 'react';
import {Link} from 'react-router-dom';
import {request} from '@/lib/backend';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export function AccountSetupPage(){
 const [token]=useState(()=>{const value=new URLSearchParams(location.hash.slice(1)).get('token')||'';history.replaceState(null,'',location.pathname);return value;});
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 return <main className="min-h-screen flex items-center justify-center bg-background p-6"><section className="w-full max-w-md rounded-xl border p-8 space-y-5"><h1 className="text-2xl font-bold">Set up your DGT account</h1>{done?<><p>Your password is set. You can now sign in with your email.</p><Link to="/login" className="underline">Go to login</Link></>:<form className="space-y-4" onSubmit={async e=>{e.preventDefault();if(busy)return;if(password!==confirm){setError('Passwords do not match');return;}setBusy(true);setError('');try{await request('/client-handling/activate',{method:'POST',body:JSON.stringify({token,password})});setDone(true);}catch(e){setError(e instanceof Error?e.message:'Unable to activate');}finally{setBusy(false);}}}><p>Choose a password with at least 12 characters.</p><label className="block">New password<Input type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="block">Confirm password<Input type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<Button disabled={busy||!token}>{busy?'Saving…':'Set password'}</Button>{!token&&<p>This setup link is missing or expired. Ask DGT for a new link.</p>}</form>}</section></main>;
}
