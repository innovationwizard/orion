"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
};

const STORAGE_KEY = "reservas_offline_queue";
const MAX_RETRIES = 5;

function loadQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Offline queue for the salesperson reservation form.
 * When offline, POST requests are queued in localStorage.
 * When connectivity returns, queued requests are replayed with exponential backoff.
 */
export function useOfflineQueue() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queueSize, setQueueSize] = useState(0);
  const processingRef = useRef(false);

  // Track online/offline
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setQueueSize(loadQueue().length);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Process queue when online
  useEffect(() => {
    if (!online || processingRef.current) return;

    async function processQueue() {
      processingRef.current = true;
      let queue = loadQueue();
      let attempt = 0;

      while (queue.length > 0 && navigator.onLine && attempt < MAX_RETRIES) {
        const item = queue[0];
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: { "Content-Type": "application/json" },
            body: item.body,
          });
          if (res.ok || res.status === 409) {
            // Success or conflict (unit already taken) — remove from queue
            queue = queue.slice(1);
            saveQueue(queue);
            setQueueSize(queue.length);
            attempt = 0;
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch {
          attempt++;
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }

      processingRef.current = false;
    }

    processQueue();
  }, [online]);

  /**
   * Enqueue a fetch request. If online, sends immediately.
   * If offline, stores in localStorage for later replay.
   */
  const enqueue = useCallback(
    async (
      url: string,
      options: { method: string; body: string },
    ): Promise<Response | null> => {
      if (navigator.onLine) {
        try {
          const res = await fetch(url, {
            method: options.method,
            headers: { "Content-Type": "application/json" },
            body: options.body,
          });
          return res;
        } catch {
          // Fell offline during request — queue it
        }
      }

      // Queue for later
      const queue = loadQueue();
      queue.push({
        id: crypto.randomUUID(),
        url,
        method: options.method,
        body: options.body,
        timestamp: Date.now(),
      });
      saveQueue(queue);
      setQueueSize(queue.length);
      return null;
    },
    [],
  );

  return { online, queueSize, enqueue };
}
