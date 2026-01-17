import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

function getSnapshot() {
  return true;
}

export function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
