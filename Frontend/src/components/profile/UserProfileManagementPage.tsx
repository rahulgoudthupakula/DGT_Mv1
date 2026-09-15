import { useState, type ComponentProps } from "react";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request,logout } from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Smartphone, Eye, EyeOff } from "lucide-react";

function PasswordInput({id,...props}:Omit<ComponentProps<typeof Input>,"type">){
 const [visible,setVisible]=useState(false);
 const name=id==='email-password'?'current password for email change':id==='current-password'?'current password':id==='new-password'?'new password':'confirm new password';
 return <div className="relative">
  <Input {...props} id={id} type={visible?'text':'password'} className="pr-12" />
  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" disabled={props.disabled} aria-label={`${visible?'Hide':'Show'} ${name}`} aria-pressed={visible} aria-controls={id} onClick={()=>setVisible(v=>!v)}>
   {visible?<EyeOff className="h-4 w-4" aria-hidden="true"/>:<Eye className="h-4 w-4" aria-hidden="true"/>}
  </Button>
 </div>;
}

type LoginEvent={event_id:number;occurred_at:string;ip_address:string;user_agent:string;status:string};
type DeviceSession={session_id:string;ip_address:string;user_agent:string;last_active_at:string;current:boolean};
type Profile={first_name:string;last_name:string;email:string;version:string};
export const UserProfileManagementPage = ({onSignOut,enabled=true}:{onSignOut:()=>void;enabled?:boolean}) => {
 const client=useQueryClient();
 const query=useQuery({queryKey:['self-profile'],queryFn:()=>request<Profile>('/access/profile'),enabled});
 const history=useQuery({queryKey:['profile-history'],queryFn:()=>request<LoginEvent[]>('/access/profile/history'),enabled});
 const sessions=useQuery({queryKey:['profile-sessions'],queryFn:()=>request<DeviceSession[]>('/access/profile/sessions'),enabled,refetchInterval:30000});
 async function revoke(id:string){setBusy(true);setError('');try{await request('/access/profile/sessions/'+id+'/revoke',{method:'POST'});await sessions.refetch();setMessage('Session revoked. That device can no longer access your account.');}catch(e){setError(e instanceof Error?e.message:'Could not revoke session');}finally{setBusy(false);}}
 const date=(value:string)=>new Date(value).toLocaleString();
 const [editingProfile,setEditingProfile]=useState(false),[editingPassword,setEditingPassword]=useState(false);
 const [draft,setDraft]=useState<{firstName:string;lastName:string;email:string}|null>(null);
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[emailPassword,setEmailPassword]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const values=draft??{firstName:query.data?.first_name??'',lastName:query.data?.last_name??'',email:query.data?.email??''};
 const emailChanged=values.email.trim().toLowerCase()!==query.data?.email;
 function signOut(){logout();client.clear();onSignOut();}
 async function save(password=false){if(!query.data)return;setBusy(true);setError('');setMessage('');try{
  const result=await request<Profile>('/access/profile'+(password?'/password':''),{method:password?'PUT':'PATCH',headers:{'If-Match':query.data.version},body:JSON.stringify(password?{currentPassword:current,newPassword:next,confirmPassword:confirm}:{...values,currentPassword:emailPassword})});
  setCurrent('');setNext('');setConfirm('');setEmailPassword('');
  if(password||emailChanged){signOut();return;}
  client.setQueryData(['self-profile'],result);setDraft(null);setEditingProfile(false);setMessage('Profile updated.');
 }catch(e){setError(e instanceof Error?e.message:'Could not save');}finally{setBusy(false);}}
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">User Profile Management</h1>

      {enabled&&query.isPending&&<p>Loading profile…</p>}
      {(error||query.error)&&<p role="alert" className="text-destructive">{error||query.error?.message} <Button disabled={busy} variant="outline" onClick={()=>{setDraft(null);setEmailPassword('');setError('');void query.refetch();}}>Reload Profile</Button></p>}
      {message&&<p role="status">{message}</p>}
      {/* Profile Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Profile Information</CardTitle>{!editingProfile&&<Button variant="outline" disabled={busy||!query.data||editingPassword} onClick={()=>{setEditingProfile(true);setError('');setMessage('');}}>Edit</Button>}</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-first">First Name</Label>
              <Input id="profile-first" maxLength={100} readOnly={!editingProfile} disabled={busy||!query.data} value={values.firstName} onChange={e=>setDraft({...values,firstName:e.target.value})} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="profile-last">Last Name</Label><Input id="profile-last" maxLength={100} readOnly={!editingProfile} disabled={busy||!query.data} value={values.lastName} onChange={e=>setDraft({...values,lastName:e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" maxLength={255} readOnly={!editingProfile} disabled={busy||!query.data} value={values.email} onChange={e=>setDraft({...values,email:e.target.value})} />
            </div>
          </div>
          {editingProfile&&query.data&&emailChanged&&<div><Label htmlFor="email-password">Current password to change email</Label><PasswordInput id="email-password" autoComplete="current-password" disabled={busy} value={emailPassword} onChange={e=>setEmailPassword(e.target.value)}/><p className="text-sm text-muted-foreground">After saving, sign in with your new email and existing password.</p></div>}
          {editingProfile&&<div className="flex gap-2"><Button disabled={busy||!query.data} onClick={()=>save()}>Update Profile</Button><Button variant="outline" disabled={busy} onClick={()=>{setEditingProfile(false);setDraft(null);setEmailPassword('');setError('');}}>Cancel</Button></div>}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!editingPassword?<Button disabled={busy||!query.data||editingProfile} onClick={()=>{setEditingPassword(true);setError('');setMessage('');}}>Change Password</Button>:<>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <PasswordInput id="current-password" autoComplete="current-password" disabled={busy||!query.data} value={current} onChange={e=>setCurrent(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput id="new-password" autoComplete="new-password" disabled={busy||!query.data} value={next} onChange={e=>setNext(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <PasswordInput id="confirm-password" autoComplete="new-password" disabled={busy||!query.data} value={confirm} onChange={e=>setConfirm(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Use at least 12 characters (maximum 72 bytes). After saving, sign in with your new password.</p>
          <div className="flex gap-2"><Button disabled={busy||!query.data} onClick={()=>save(true)}>Submit</Button><Button variant="outline" disabled={busy} onClick={()=>{setEditingPassword(false);setCurrent('');setNext('');setConfirm('');setError('');}}>Cancel</Button></div>
          </>}
        </CardContent>
      </Card>

      {/* 2FA Setup */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5" /> Two-Factor Authentication</CardTitle>
          <Switch disabled checked={false} aria-label="Two-factor authentication unavailable" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Two-factor authentication is not implemented yet.</p>
        </CardContent>
      </Card>

      {(history.error||sessions.error)&&<p role="alert" className="text-destructive">{history.error?.message||sessions.error?.message}</p>}
      {enabled&&<div className="flex gap-2"><Button variant="outline" onClick={()=>{void history.refetch();void sessions.refetch();}}>Refresh Activity</Button><Button variant="outline" onClick={signOut}>Sign Out</Button></div>}
      <p className="text-xs text-muted-foreground">Activity times use your browser timezone. Sessions expire after 8 hours. IP addresses are recorded without guessing a location.</p>
      {/* Login Activity History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Login Activity History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device / Browser</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!history.data?.length&&<TableRow><TableCell colSpan={4} className="text-muted-foreground">{enabled?(history.isPending?"Loading login history…":"No recorded sign-ins yet."):"Available in the profile test preview."}</TableCell></TableRow>}
              {history.data?.map((entry) => (
                <TableRow key={entry.event_id}>
                  <TableCell className="text-xs">{date(entry.occurred_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.ip_address}</TableCell>
                  <TableCell className="text-xs">{entry.user_agent}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "SUCCESS" ? "default" : "destructive"} className="text-[10px]">
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Device Sessions */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Smartphone className="w-5 h-5" /> Device Sessions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!sessions.data?.length&&<TableRow><TableCell colSpan={4} className="text-muted-foreground">{enabled?(sessions.isPending?"Loading sessions…":"No active sessions."):"Available in the profile test preview."}</TableCell></TableRow>}
              {sessions.data?.map((s) => (
                <TableRow key={s.session_id}>
                  <TableCell className="text-xs">{s.user_agent} {s.current && <Badge variant="outline" className="ml-1 text-[9px]">Current</Badge>}</TableCell>
                  <TableCell className="text-xs">{s.ip_address}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{date(s.last_active_at)}</TableCell>
                  <TableCell className="text-right">
                    {!s.current && <Button disabled={busy} onClick={()=>revoke(s.session_id)} variant="destructive" size="sm" className="h-6 text-[10px]">Revoke</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};
