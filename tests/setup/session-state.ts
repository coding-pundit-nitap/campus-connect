export interface StubSessionUser {
  id: string;
  [key: string]: unknown;
}

export interface StubSession {
  user: StubSessionUser;
  session: { id: string };
}

let current: StubSession | null = null;

export function setSession(session: StubSession | null): void {
  current = session;
}

export function getSession(): StubSession | null {
  return current;
}
