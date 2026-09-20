import { useState, useEffect, useCallback } from "react";

export interface SyncQueueItem {
  id: string;
  type: "attendance" | "exam_score" | "student" | "general";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: any;
  timestamp: string;
  status: "pending" | "syncing" | "failed" | "synced";
  retries: number;
  lastError?: string;
}

const STORAGE_KEY = "dugsiga_offline_sync_queue";
const LAST_SYNC_KEY = "dugsiga_last_sync_timestamp";

export function getOfflineQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline sync queue:", e);
    return [];
  }
}

export function saveOfflineQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to persist offline sync queue:", e);
  }
}

export function enqueueOfflineAction(
  type: SyncQueueItem["type"],
  endpoint: string,
  method: SyncQueueItem["method"],
  payload: any
): SyncQueueItem {
  const queue = getOfflineQueue();
  const newItem: SyncQueueItem = {
    id: "sync-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
    type,
    endpoint,
    method,
    payload,
    timestamp: new Date().toISOString(),
    status: "pending",
    retries: 0
  };

  // Prevent immediate duplicates for identical attendance updates
  const existingIdx = queue.findIndex(
    q => q.endpoint === endpoint && q.status === "pending" && JSON.stringify(q.payload) === JSON.stringify(payload)
  );

  if (existingIdx > -1) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }

  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent("dugsiga_sync_queue_updated"));
  return newItem;
}

export async function processOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
  const queue = getOfflineQueue();
  const pendingItems = queue.filter(item => item.status === "pending" || item.status === "failed");

  if (pendingItems.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  if (!navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errorCount = 0;

  // Retrieve current auth headers
  let authHeaders: Record<string, string> = {
    "Content-Type": "application/json"
  };
  try {
    const authRaw = localStorage.getItem("dugsiga_auth");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth.email) authHeaders["X-School-Email"] = auth.email;
      if (auth.schoolId) authHeaders["X-School-Id"] = auth.schoolId;
      if (auth.token) authHeaders["Authorization"] = `Bearer ${auth.token}`;
    }
  } catch (e) {}

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (item.status !== "pending" && item.status !== "failed") continue;

    queue[i].status = "syncing";
    saveOfflineQueue(queue);

    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: authHeaders,
        body: JSON.stringify(item.payload)
      });

      if (response.ok) {
        queue[i].status = "synced";
        syncedCount++;
      } else {
        const errText = await response.text();
        queue[i].status = "failed";
        queue[i].retries += 1;
        queue[i].lastError = `Server ${response.status}: ${errText.substring(0, 100)}`;
        errorCount++;
      }
    } catch (netErr: any) {
      queue[i].status = "failed";
      queue[i].retries += 1;
      queue[i].lastError = netErr?.message || "Network request failed";
      errorCount++;
      // Still offline, break to prevent hammered loops
      break;
    }
  }

  // Prune items that have been synced successfully
  const remainingQueue = queue.filter(item => item.status !== "synced");
  saveOfflineQueue(remainingQueue);

  if (syncedCount > 0) {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }

  window.dispatchEvent(new CustomEvent("dugsiga_sync_queue_updated"));
  return { syncedCount, errors: errorCount };
}

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queue, setQueue] = useState<SyncQueueItem[]>(getOfflineQueue());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage.getItem(LAST_SYNC_KEY) : null
  );

  const refreshQueue = useCallback(() => {
    setQueue(getOfflineQueue());
    setLastSyncTime(localStorage.getItem(LAST_SYNC_KEY));
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return { syncedCount: 0, errors: 0 };
    setIsSyncing(true);
    try {
      const result = await processOfflineQueue();
      refreshQueue();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = () => {
      refreshQueue();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dugsiga_sync_queue_updated", handleQueueChange);

    // Initial check if online and has pending items
    if (navigator.onLine && getOfflineQueue().some(i => i.status === "pending" || i.status === "failed")) {
      triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dugsiga_sync_queue_updated", handleQueueChange);
    };
  }, [triggerSync, refreshQueue]);

  const pendingCount = queue.filter(q => q.status === "pending" || q.status === "failed").length;

  return {
    isOnline,
    isSyncing,
    pendingCount,
    queue,
    lastSyncTime,
    triggerSync,
    refreshQueue
  };
}
