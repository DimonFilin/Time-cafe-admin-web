const WORKER_ID_KEY = 'activityLogs_selectedWorkerId';
const WORKER_JSON_KEY = 'activityLogs_selectedWorker';

export type ActivityLogsPreselectedWorker = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export function storeActivityLogsWorker(worker: ActivityLogsPreselectedWorker): void {
  localStorage.setItem(WORKER_ID_KEY, worker.id);
  localStorage.setItem(WORKER_JSON_KEY, JSON.stringify(worker));
}

export function consumeActivityLogsWorker(): {
  workerId: string | null;
  worker: ActivityLogsPreselectedWorker | null;
} {
  const workerId = localStorage.getItem(WORKER_ID_KEY);
  const raw = localStorage.getItem(WORKER_JSON_KEY);
  localStorage.removeItem(WORKER_ID_KEY);
  localStorage.removeItem(WORKER_JSON_KEY);

  if (!raw) {
    return { workerId, worker: null };
  }

  try {
    const worker = JSON.parse(raw) as ActivityLogsPreselectedWorker;
    if (worker?.id) {
      return { workerId: workerId ?? worker.id, worker };
    }
  } catch {
    /* ignore */
  }

  return { workerId, worker: null };
}

export type SwitchToActivityLogsDetail = {
  workerId: string;
  worker?: ActivityLogsPreselectedWorker;
};

export const SWITCH_TO_ACTIVITY_LOGS_EVENT = 'switchToActivityLogs';

export function dispatchSwitchToActivityLogs(detail: SwitchToActivityLogsDetail): void {
  window.dispatchEvent(new CustomEvent(SWITCH_TO_ACTIVITY_LOGS_EVENT, { detail }));
}
