const USER_KEY = "finans:userId";
const PROJECT_KEY = "finans:projectId";

export function getActiveUserId(): number | null {
  const v = localStorage.getItem(USER_KEY);
  return v !== null ? Number(v) : null;
}

export function setActiveUserId(id: number): void {
  localStorage.setItem(USER_KEY, String(id));
}

export function getActiveProjectId(): number | null {
  const v = localStorage.getItem(PROJECT_KEY);
  return v !== null ? Number(v) : null;
}

export function setActiveProjectId(id: number): void {
  localStorage.setItem(PROJECT_KEY, String(id));
}

export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PROJECT_KEY);
}
