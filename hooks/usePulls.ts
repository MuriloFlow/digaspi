"use client";

import { useEffect, useMemo, useState } from "react";
import { PULLS_KEY, PULLS_TTL_MS } from "@/lib/constants";
import { PullRecord } from "@/lib/types";
import { readExpiringList, writeList } from "@/lib/storage";

function isToday(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function usePulls() {
  const [records, setRecords] = useState<PullRecord[]>([]);

  useEffect(() => {
    setRecords(readExpiringList<PullRecord>(PULLS_KEY, PULLS_TTL_MS));
  }, []);

  function persist(next: PullRecord[]) {
    setRecords(next);
    writeList(PULLS_KEY, next);
  }

  function add(record: Omit<PullRecord, "id" | "createdAt">) {
    const next: PullRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };

    persist([next, ...records]);
  }

  function remove(id: string) {
    persist(records.filter((record) => record.id !== id));
  }

  function clearToday() {
    persist(records.filter((record) => !isToday(record.createdAt)));
  }

  const today = useMemo(() => records.filter((record) => isToday(record.createdAt)), [records]);
  const byBrand = useMemo(() => {
    return today.reduce<Record<string, number>>((acc, record) => {
      acc[record.marca] = (acc[record.marca] || 0) + 1;
      return acc;
    }, {});
  }, [today]);

  return { records, today, totalToday: today.length, byBrand, add, remove, clearToday };
}
