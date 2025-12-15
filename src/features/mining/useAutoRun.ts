import { useState, useEffect, useRef, useCallback } from 'react';
import { useFlowStore } from '@/store/flowStore';

const AUTORUN_KEY = 'n8ngame:autorun:enabled';
const CYCLE_SECONDS = 600;

export function useAutoRun() {
    const { runMine } = useFlowStore(); // n8nStatus is checked via getState() to avoid stale closures in interval

    // Persistent Toggle State: '1' = ON, '0' = OFF
    const [enabled, setEnabled] = useState(() => {
        return localStorage.getItem(AUTORUN_KEY) === '1';
    });

    // Countdown State
    const [secondsLeft, setSecondsLeft] = useState(CYCLE_SECONDS);
    const timerRef = useRef<number | null>(null);

    // Save persistence
    useEffect(() => {
        localStorage.setItem(AUTORUN_KEY, enabled ? '1' : '0');
    }, [enabled]);

    // Timer Loop
    useEffect(() => {
        if (!enabled) {
            setSecondsLeft(CYCLE_SECONDS);
            if (timerRef.current) window.clearInterval(timerRef.current);
            return;
        }

        // Start Interval
        timerRef.current = window.setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    // Ready to trigger
                    const store = useFlowStore.getState();
                    // Prevent duplicate if already running
                    if (store.n8nStatus !== 'running') {
                        runMine(0);
                    }
                    // Reset to 600s regardless of trigger success (keep rhythm)
                    return CYCLE_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [enabled, runMine]);

    // Manual Toggle
    const toggle = () => setEnabled(prev => !prev);

    // Manual Timer Reset (called when user manually Mines)
    const resetTimer = useCallback(() => {
        setSecondsLeft(CYCLE_SECONDS);
    }, []);

    return {
        enabled,
        toggle,
        secondsLeft,
        resetTimer
    };
}
