import { setSession, type StubSessionUser } from "./session-state";

/** Signs in as `user`; status defaults to ACTIVE like a real account. */
export function asUser(user: StubSessionUser): void {
  setSession({
    user: { status: "ACTIVE", ...user },
    session: { id: `sess-${user.id}` },
  });
}

export function asAnonymous(): void {
  setSession(null);
}
