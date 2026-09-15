// Local store for inventory adjustment requests awaiting approval.
// Approved requests are pushed to their real destination (transfers / shrinkage)
// by the Approvals page.

export type ApprovalRequestType = "transfer" | "shrinkage" | "reduction";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalRequest = {
  id: string;
  type: ApprovalRequestType;
  itemName: string;
  scanCode: string;
  quantity: number;
  reason: string;
  reasonLabel: string;
  transferStore?: string;
  status: ApprovalStatus;
  requestedAt: string;
  decidedAt?: string;
  decisionNotes?: string;
};

const KEY = "grocery_inventory_approvals";

export const loadApprovals = (): ApprovalRequest[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ApprovalRequest[]) : [];
  } catch {
    return [];
  }
};

export const saveApprovals = (requests: ApprovalRequest[]) => {
  localStorage.setItem(KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event("approvals-updated"));
};

export const addApprovalRequests = (
  items: Omit<ApprovalRequest, "id" | "status" | "requestedAt">[]
) => {
  const now = new Date().toISOString();
  const next = [
    ...items.map((i) => ({
      ...i,
      id: `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: "pending" as ApprovalStatus,
      requestedAt: now,
    })),
    ...loadApprovals(),
  ];
  saveApprovals(next);
};

export const updateApprovalRequest = (
  id: string,
  patch: Partial<ApprovalRequest>
) => {
  saveApprovals(loadApprovals().map((r) => (r.id === id ? { ...r, ...patch } : r)));
};
