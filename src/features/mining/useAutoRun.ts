import { useState, useEffect, useRef } from 'react';
import { useFlowStore } from '@/store/flowStore';

const AUTORUN_KEY = 'n8ngame:autorun:v1';
const CYCLE_SEC = 600; // 10 minutes

export function useAutoRun() {
    const { runMine } = useFlowStore();

    // Persist Toggle State
    const [isAutoRun, setIsAutoRunState] = useState(() => {
        return localStorage.getItem(AUTORUN_KEY) === 'true';
    });

    // Timer State
    const [timeLeft, setTimeLeft] = useState(CYCLE_SEC);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Persist changes
    useEffect(() => {
        localStorage.setItem(AUTORUN_KEY, String(isAutoRun));
    }, [isAutoRun]);

    // Timer Logic
    useEffect(() => {
        if (!isAutoRun) {
            setTimeLeft(CYCLE_SEC); // Reset on disable
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Trigger Mine
                    // Check if already running to prevent overlap
                    const currentStatus = useFlowStore.getState().n8nStatus;
                    if (currentStatus !== 'running') {
                        runMine(0);
                    }
                    return CYCLE_SEC; // Reset Timer
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoRun, runMine]);

    const toggleAutoRun = () => {
        setIsAutoRunState((prev) => !prev);
    };

    const resetCountdown = () => {
        if (isAutoRun) {
            setTimeLeft(CYCLE_SEC);
        }
    };

    return {
        isAutoRun,
        toggleAutoRun,
        timeLeft,
        resetCountdown
    };
}
