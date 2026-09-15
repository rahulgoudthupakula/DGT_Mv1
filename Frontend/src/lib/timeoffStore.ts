// Local store for employee time-off requests and their approval workflow.

export type TimeOffType = "Vacation" | "Sick Leave" | "Personal Day" | "Unpaid Leave" | "Other";
export type TimeOffStatus = "pending" | "approved" | "rejected";

export type TimeOffRequest = {
  id: string;
  employee: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: TimeOffStatus;
  requestedAt: string;
  decidedAt?: string;
  decisionNotes?: string;
};

const KEY = "workweek_timeoff_requests";

export const loadTimeOffRequests = (): TimeOffRequest[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TimeOffRequest[]) : [];
  } catch {
    return [];
  }
};

export const saveTimeOffRequests = (requests: TimeOffRequest[]) => {
  localStorage.setItem(KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event("timeoff-updated"));
};

export const addTimeOffRequest = (
  req: Omit<TimeOffRequest, "id" | "status" | "requestedAt">
) => {
  const next: TimeOffRequest[] = [
    {
      ...req,
      id: `TO-${Date.now()}`,
      status: "pending",
      requestedAt: new Date().toISOString(),
    },
    ...loadTimeOffRequests(),
  ];
  saveTimeOffRequests(next);
};

export const updateTimeOffRequest = (
  id: string,
  patch: Partial<TimeOffRequest>
) => {
  saveTimeOffRequests(
    loadTimeOffRequests().map((r) => (r.id === id ? { ...r, ...patch } : r))
  );
};

// Working days between two dates (Mon–Fri), inclusive. Minimum 1.
export const businessDaysList = (start: string, end: string): string[] => {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [];
  const out: string[] = [];
  const d = new Date(s);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

export const calcBusinessDays = (start: string, end: string): number =>
  Math.max(businessDaysList(start, end).length, 1);

// Yearly allowance per time-off type (days). Unpaid/Other are not capped.
export const TIME_OFF_ALLOWANCE: Record<TimeOffType, number | null> = {
  Vacation: 10,
  "Sick Leave": 5,
  "Personal Day": 3,
  "Unpaid Leave": null,
  Other: null,
};

export type TimeOffBalance = {
  type: TimeOffType;
  allowance: number | null;
  used: number;
  pending: number;
  remaining: number | null;
};

export const getEmployeeRequests = (employee: string): TimeOffRequest[] =>
  loadTimeOffRequests().filter((r) => r.employee === employee);

export const getEmployeeBalances = (employee: string): TimeOffBalance[] => {
  const reqs = getEmployeeRequests(employee);
  return (Object.keys(TIME_OFF_ALLOWANCE) as TimeOffType[]).map((type) => {
    const forType = reqs.filter((r) => r.type === type);
    const used = forType.filter((r) => r.status === "approved").reduce((s, r) => s + r.days, 0);
    const pending = forType.filter((r) => r.status === "pending").reduce((s, r) => s + r.days, 0);
    const allowance = TIME_OFF_ALLOWANCE[type];
    return {
      type,
      allowance,
      used,
      pending,
      remaining: allowance === null ? null : Math.max(allowance - used, 0),
    };
  });
};

// Approved time-off days for an employee, one entry per working day.
export const getApprovedTimeOffDays = (
  employee: string
): { date: string; type: TimeOffType }[] =>
  getEmployeeRequests(employee)
    .filter((r) => r.status === "approved")
    .flatMap((r) => businessDaysList(r.startDate, r.endDate).map((date) => ({ date, type: r.type })));
