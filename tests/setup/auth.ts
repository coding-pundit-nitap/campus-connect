import { setSession, type StubSessionUser } from "./session-state";

export function asUser(user: StubSessionUser): void {
  setSession({ user, session: { id: `sess-${user.id}` } });
}

export function asAnonymous(): void {
  setSession(null);
}
