import { useEffect, useRef, useState } from "react";
import { formatRupees } from "../lib/format";

const DURATION_MS = 700;

function canAnimate(): boolean {
  return (
    typeof window.matchMedia === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Counts to a new amount when it changes, so a correction visibly moves the number.
export function AnimatedRupees({ amount }: { amount: number }) {
  const [shown, setShown] = useState(amount);
  const previous = useRef(amount);

  useEffect(() => {
    const from = previous.current;
    previous.current = amount;
    if (from === amount || !canAnimate()) {
      setShown(amount);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (amount - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [amount]);

  return <>{formatRupees(shown)}</>;
}
