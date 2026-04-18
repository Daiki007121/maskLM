import { useState, useCallback, useEffect, useMemo } from "react";
import type { HistoryEntry } from "../types";

const HISTORY_KEY = "masklm.history.v1";
const MAX_ENTRIES = 50;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

export interface UseLocalHistoryReturn {
  entries: HistoryEntry[];
  filteredEntries: HistoryEntry[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  add: (entry: Omit<HistoryEntry, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
  updateMapping: (id: string, mapping: Record<string, string>) => void;
}

export function useLocalHistory(): UseLocalHistoryReturn {
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    loadJSON<HistoryEntry[]>(HISTORY_KEY, []),
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    saveJSON(HISTORY_KEY, entries);
  }, [entries]);

  const add = useCallback(
    (data: Omit<HistoryEntry, "id" | "createdAt">) => {
      const entry: HistoryEntry = {
        ...data,
        id: crypto.randomUUID?.() || String(Date.now()),
        createdAt: Date.now(),
      };
      setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  const updateMapping = useCallback(
    (id: string, mapping: Record<string, string>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, mapping } : e)),
      );
    },
    [],
  );

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.original.toLowerCase().includes(q) ||
        e.masked.toLowerCase().includes(q),
    );
  }, [entries, searchQuery]);

  return {
    entries,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    add,
    remove,
    clear,
    updateMapping,
  };
}
