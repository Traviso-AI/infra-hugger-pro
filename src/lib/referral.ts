const STORAGE_KEY = "traviso_referral";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface ReferralData {
  creator_username: string;
  set_at: string;
}

export function setReferral(creatorUsername: string): void {
  const data: ReferralData = {
    creator_username: creatorUsername,
    set_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getReferral(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const data: ReferralData = JSON.parse(raw);
    const age = Date.now() - new Date(data.set_at).getTime();
    if (age > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.creator_username;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearReferral(): void {
  localStorage.removeItem(STORAGE_KEY);
}
