"use client";

import { useEffect, useMemo, useState } from "react";
import { RECEIPTS_KEY } from "@/lib/constants";
import { ReceiptNote } from "@/lib/types";
import { readExpiringList, writeList } from "@/lib/storage";

export function useReceipts() {
  const [notes, setNotes] = useState<ReceiptNote[]>([]);

  useEffect(() => {
    setNotes(readExpiringList<ReceiptNote>(RECEIPTS_KEY));
  }, []);

  function persist(next: ReceiptNote[]) {
    setNotes(next);
    writeList(RECEIPTS_KEY, next);
  }

  function add(note: Omit<ReceiptNote, "id" | "atual" | "createdAt" | "updatedAt">) {
    const now = Date.now();
    const nextNote: ReceiptNote = {
      ...note,
      id: crypto.randomUUID(),
      atual: 0,
      createdAt: now,
      updatedAt: now
    };

    persist([nextNote, ...notes]);
  }

  function exists(codigo: string) {
    return notes.some((note) => note.codigo.toUpperCase() === codigo.toUpperCase());
  }

  function increment(id: string) {
    persist(
      notes.map((note) =>
        note.id === id
          ? { ...note, atual: Math.min(note.total, note.atual + 1), updatedAt: Date.now() }
          : note
      )
    );
  }

  function decrement(id: string) {
    persist(
      notes.map((note) =>
        note.id === id
          ? { ...note, atual: Math.max(0, note.atual - 1), updatedAt: Date.now() }
          : note
      )
    );
  }

  function reset(id: string) {
    persist(notes.map((note) => (note.id === id ? { ...note, atual: 0, updatedAt: Date.now() } : note)));
  }

  function remove(id: string) {
    persist(notes.filter((note) => note.id !== id));
  }

  function removeCompleted() {
    persist(notes.filter((note) => note.atual < note.total));
  }

  const stats = useMemo(() => {
    const totalItems = notes.reduce((sum, note) => sum + note.total, 0);
    const checkedItems = notes.reduce((sum, note) => sum + note.atual, 0);
    const done = notes.filter((note) => note.atual >= note.total).length;

    return { totalItems, checkedItems, done, open: notes.length - done };
  }, [notes]);

  return { notes, add, exists, increment, decrement, reset, remove, removeCompleted, stats };
}
