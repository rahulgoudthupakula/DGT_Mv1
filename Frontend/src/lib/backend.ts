import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8181/api/v1";
export const developmentDatabase = (import.meta.env.VITE_DATA_ENV || "development") === "development";
export const profilePreview = import.meta.env.VITE_PROFILE_PREVIEW !== "false";

const TOKEN_KEY = "dgt_jwt";
const getToken   = () => localStorage.getItem(TOKEN_KEY);
const setToken   = (t: string) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const api = axios.create({ baseURL: baseUrl, withCredentials: false });

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data !== undefined && !config.headers["Idempotency-Key"])
    config.headers["Idempotency-Key"] = crypto.randomUUID();
  return config;
});

const ERROR_MESSAGES: Record<number, string> = {
  401: "Sign-in failed or your session expired. Please sign in again.",
  403: "This account does not have access. Ask your company administrator to check your store/module permissions.",
  409: "This store changed since you opened it. Reload the latest details before editing again.",
  503: "Backend access is not configured. Contact the administrator.",
};

api.interceptors.response.use(
  res => res,
  err => {
    const status: number = err.response?.status ?? 0;
    if (status === 401) clearToken();
    const detail =
      (status === 400 || status === 409) && typeof err.response?.data?.detail === "string"
        ? err.response.data.detail
        : null;
    throw new ApiError(
      status,
      detail ?? ERROR_MESSAGES[status] ?? `Request failed (${status}). Check your values and try again.`
    );
  }
);

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const res = await api.request<T>({
      url: path,
      method: (init.method as string | undefined) ?? "GET",
      data: init.body,
      headers: init.headers as Record<string, string> | undefined,
    });
    return res.data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new Error("Cannot reach the configured backend.");
  }
}

export function logout() {
  const token = getToken();
  clearToken();
  if (profilePreview && token)
    void api
      .post("/access/session/logout", null, { headers: { Authorization: `Bearer ${token}` } })
      .catch(() => {});
}

export async function login(email: string, password: string) {
  const bytes = new TextEncoder().encode(`${email.trim()}:${password}`);
  const basic = "Basic " + btoa(Array.from(bytes, b => String.fromCharCode(b)).join(""));
  try {
    if (profilePreview) {
      const res = await api.post<{ token: string; expiresIn: number }>(
        "/access/session", null, { headers: { Authorization: basic } }
      );
      setToken(res.data.token);
    } else {
      await api.get("/access/me", { headers: { Authorization: basic } });
    }
  } catch (e) {
    clearToken();
    throw e instanceof ApiError ? e : new ApiError(401, "Sign-in failed.");
  }
}

export interface StoreRecord {
  parent_store_dgt_id?: string | null;
  created_at: string | null;
  dgt_id: string; store_id: string | null; store_name: string;
  legal_business_name: string | null; tax_id: string | null;
  license_number: string | null; timezone: string | null; _version: string;
}
export async function listStores(): Promise<StoreRecord[]> { return request<StoreRecord[]>("/access/stores"); }
export interface PendingChange { pending: true; requestId: number; status: string; }
export function isPendingChange(value: unknown): value is PendingChange {
  return typeof value === "object" && value !== null && "pending" in value && (value as any).pending === true;
}
export const getStore = (id: string) => request<StoreRecord>(`/stores/${encodeURIComponent(id)}`);
export const updateStore = (id: string, version: string, values: Partial<StoreRecord>) =>
  request<StoreRecord>(`/stores/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "If-Match": version }, body: JSON.stringify(values),
  });

export interface StoreContact { contact_info_id: number; address: string; phone_number: string | null; email: string | null; _version: string; }
export interface BusinessDay { day_of_week: string; status: "SCHEDULED" | "CLOSED" | "OPEN_24_HOURS" | "UNSET"; open_time: string | null; close_time: string | null; _version?: string; }
export interface StoreSettings { hours: BusinessDay[]; store: StoreRecord; contact: StoreContact | null; }
export const getStoreSettings = (id: string) => request<StoreSettings>(`/stores/${encodeURIComponent(id)}/settings`);
export const saveStoreSettings = (
  id: string, version: string, store: Partial<StoreRecord>,
  contact: { address: string; phone_number: string | null; email: string | null } | null,
  contactVersion: string | null, hours: BusinessDay[], hoursVersions: Record<string, string>
) =>
  request<StoreSettings | PendingChange>(`/stores/${encodeURIComponent(id)}/settings`, {
    method: "PATCH", headers: { "If-Match": version },
    body: JSON.stringify({ store, contact, contactVersion, hours, hoursVersions }),
  });
