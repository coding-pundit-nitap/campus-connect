import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

export function useIsMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
