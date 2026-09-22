// Lightweight shared store for lottery packs confirmed at delivery.
// Confirmed packs flow: Received & Confirm Delivery -> Verify Packs -> Activate Packs

export interface ConfirmedPack {
  id: string;
  gameName: string;
  gameId: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  ticketsCount: number;
  packValue: number;
  confirmedDate: string;
  confirmedBy: string;
  gameActive: boolean;
  alreadyActivated: boolean;
  ticketsSoldBeforeActivation: boolean;
}

const STORAGE_KEY = "lottery-confirmed-packs";

type Listener = (packs: ConfirmedPack[]) => void;
const listeners = new Set<Listener>();

export const getConfirmedPacks = (): ConfirmedPack[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConfirmedPack[]) : [];
  } catch {
    return [];
  }
};

const save = (packs: ConfirmedPack[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(packs));
};

export const addConfirmedPacks = (packs: ConfirmedPack[]) => {
  const existing = getConfirmedPacks();
  const known = new Set(existing.map((p) => p.id));
  save([...existing, ...packs.filter((p) => !known.has(p.id))]);
};

export const removeConfirmedPacks = (ids: string[]) => {
  save(getConfirmedPacks().filter((p) => !ids.includes(p.id)));
};

export const subscribeConfirmedPacks = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
