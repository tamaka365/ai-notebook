"use client";

import { useEffect, useRef } from "react";

interface UseAutoSaveOptions {
  isDirty: boolean;
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({
  isDirty,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      pendingSaveRef.current = true;
      await onSave();
      pendingSaveRef.current = false;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, onSave, delay, enabled]);
}
