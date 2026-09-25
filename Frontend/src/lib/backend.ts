// Local preview only. Credentials stay in memory and are cleared on logout/reload.
const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8181/api/v1";
export const developmentDatabase = (import.meta.env.VITE_DATA_ENV || "development") === "development";
export const profilePreview = import.meta.env.VITE_PROFILE_PREVIEW !== "false";
let authorization = "";
export interface StoreRecord {
  parent_store_dgt_id?: string | null;
  created_at: string | null;
  dgt_id: string; store_id: string | null; store_name: string;
  legal_business_name: string | null; tax_id: string | null;
  license_number: string | null; timezone: string | null; _version: string;
}
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function logout() {
 const previous=authorization;authorization="";
 if(profilePreview&&previous.startsWith('Bearer '))void fetch(baseUrl+'/access/session/logout',{method:'POST',headers:{Authorization:previous},credentials:'omit',keepalive:true}).catch(()=>{});
}
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", authorization);
  if (init.body && !headers.has("Idempotency-Key")) headers.set("Idempotency-Key", crypto.randomUUID());
  if (init.body) headers.set("Content-Type", "application/json");
  let response: Response;
  try { response = await fetch(baseUrl + path, { ...init, headers, credentials: "omit" }); }
  catch { throw new Error("Cannot reach the configured backend."); }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Sign-in failed or your session expired or was revoked. Please sign in again.",
      403: "This account does not have access. Ask your company administrator to check your store/module permissions.",
      409: "This store changed since you opened it. Reload the latest details before editing again.",
      503: "Backend access is not configured. Contact the administrator.",
    };
    const problem = await response.json().catch(() => null);
    const detail = (response.status === 400 || response.status === 409) && typeof problem?.detail === "string" ? problem.detail : null;
    throw new ApiError(response.status, detail ?? messages[response.status] ?? `Request failed (${response.status}). Check your values and try again.`);
  }
  return response.json();
}
export async function login(email: string, password: string) {
  const bytes = new TextEncoder().encode(`${email.trim()}:${password}`);
  authorization = "Basic " + btoa(Array.from(bytes, b => String.fromCharCode(b)).join(""));
  try {
   if(profilePreview){const session=await request<{token:string}>('/access/session',{method:'POST'});authorization='Bearer '+session.token;}
   else await request("/access/me");
  } catch (error) { logout(); throw error; }
}
export async function listStores(): Promise<StoreRecord[]> { return request<StoreRecord[]>("/access/stores"); }
export interface PendingChange {pending:true;requestId:number;status:string;}
export function isPendingChange(value: unknown): value is PendingChange {return typeof value==='object'&&value!==null&&'pending' in value&&value.pending===true;}
export const getStore = (id: string) => request<StoreRecord>(`/stores/${encodeURIComponent(id)}`);
export const updateStore = (id: string, version: string, values: Partial<StoreRecord>) =>
  request<StoreRecord>(`/stores/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "If-Match": version }, body: JSON.stringify(values),
  });

export interface StoreContact { contact_info_id: number; address: string; phone_number: string | null; email: string | null; _version: string; }
export interface BusinessDay { day_of_week: string; status: "SCHEDULED" | "CLOSED" | "OPEN_24_HOURS" | "UNSET"; open_time: string | null; close_time: string | null; _version?: string; }
export interface StoreSettings { hours: BusinessDay[]; store: StoreRecord; contact: StoreContact | null; }
export const getStoreSettings = (id: string) => request<StoreSettings>(`/stores/${encodeURIComponent(id)}/settings`);
export const saveStoreSettings = (id: string, version: string, store: Partial<StoreRecord>, contact: {address: string; phone_number: string | null; email: string | null} | null, contactVersion: string | null, hours: BusinessDay[], hoursVersions: Record<string,string>) =>
  request<StoreSettings | PendingChange>(`/stores/${encodeURIComponent(id)}/settings`, { method: "PATCH", headers: {"If-Match": version}, body: JSON.stringify({store, contact, contactVersion, hours, hoursVersions}) });
