import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "./clipboard";

export function useCopy(resetAfterMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (value: string) => {
      const success = await copyText(value);
      if (!success) {
        return false;
      }

      setCopied(true);
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
      timer.current = window.setTimeout(() => setCopied(false), resetAfterMs);
      return true;
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
