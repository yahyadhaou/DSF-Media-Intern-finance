import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Saves `value` shortly after the user stops changing it, so nobody ever has to press "Speichern".
 * `flush()` saves immediately (before leaving the screen or opening the PDF) and resolves when done.
 * The initial value (what was loaded from storage) is never saved again.
 */
export function useAutosave<T>(value: T, save: (value: T) => Promise<unknown>, options: { enabled: boolean; delay?: number }) {
  const { enabled, delay = 700 } = options;
  const [state, setState] = useState<SaveState>('idle');
  const latest = useRef(value);
  const dirty = useRef(false);
  const initial = useRef(value);
  const saveRef = useRef(save);

  // Keep the refs current after every render (writing refs during render is not allowed).
  useEffect(() => {
    saveRef.current = save;
    latest.current = value;
  });

  const run = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setState('saving');
    try {
      await saveRef.current(latest.current);
      setState('saved');
    } catch (error) {
      dirty.current = true;
      setState('error');
      throw error;
    }
  }, []);

  useEffect(() => {
    // Unchanged since it was loaded: nothing to save (also true for the repeated effect run in dev).
    if (value === initial.current || !enabled) return;
    dirty.current = true;
    const timer = setTimeout(() => void run().catch(() => undefined), delay);
    return () => clearTimeout(timer);
  }, [value, enabled, delay, run]);

  // Leaving the screen with an unsaved change must not lose it.
  useEffect(() => () => void run().catch(() => undefined), [run]);

  return { state, flush: run };
}
