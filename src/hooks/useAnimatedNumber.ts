import { useEffect, useState, useRef } from 'react';

export function useAnimatedNumber(targetValue: number, durationMs: number = 300) {
    const [displayValue, setDisplayValue] = useState(targetValue);
    const startValue = useRef(targetValue);
    const startTime = useRef<number | null>(null);
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        if (displayValue === targetValue) return;

        startValue.current = displayValue;
        startTime.current = null;

        const loop = (now: number) => {
            if (!startTime.current) startTime.current = now;
            const elapsed = now - startTime.current;
            const progress = Math.min(elapsed / durationMs, 1);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            const current = startValue.current + (targetValue - startValue.current) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                rafId.current = requestAnimationFrame(loop);
            } else {
                setDisplayValue(targetValue);
            }
        };

        rafId.current = requestAnimationFrame(loop);

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [targetValue, durationMs]);

    return displayValue;
}
