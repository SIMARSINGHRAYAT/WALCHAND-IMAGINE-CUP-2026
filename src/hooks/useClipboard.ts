import { useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "../utils/clipboard";

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copy = async (value: string) => {
    const succeeded = await copyTextToClipboard(value);
    if (succeeded) {
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } else {
      setCopied(false);
    }
    return succeeded;
  };

  return { copied, copy };
}