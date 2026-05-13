import { useState, useEffect, useRef } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const TICK_MS = 16;

export function useScrambleText(
  targetText: string,
  shouldScramble: boolean
): string {
  const [displayText, setDisplayText] = useState(targetText);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!shouldScramble) {
      setDisplayText(targetText);
      return;
    }

    let revealedCount = 0;
    const totalLength = targetText.length;

    intervalRef.current = setInterval(() => {
      revealedCount++;

      if (revealedCount >= totalLength) {
        setDisplayText(targetText);
        clearInterval(intervalRef.current);
        return;
      }

      let result = targetText.slice(0, revealedCount);
      for (let i = revealedCount; i < totalLength; i++) {
        if (targetText[i] === " ") {
          result += " ";
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      setDisplayText(result);
    }, TICK_MS);

    return () => clearInterval(intervalRef.current);
  }, [targetText, shouldScramble]);

  return displayText;
}
