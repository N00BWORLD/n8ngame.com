import { useEffect, useState, useRef } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { formatBigNum } from '@/lib/bigNum';
import { ShoppingCart } from 'lucide-react';
import { PremiumShopModal } from '../economy/PremiumShopModal';
import { AdSlot } from '@/components/AdSlot';

export function MiningPanel() {
    const mineState = useFlowStore((state) => state.mineState);
    const runMine = useFlowStore((state) => state.runMine);
    const premiumUpgrades = useFlowStore((state) => state.premiumUpgrades);

    const [now, setNow] = useState(Date.now());
    const [isShopOpen, setShopOpen] = useState(false);

    // Auto Interval Calculation
    // Base 600s (10m). Reduction 60s per level. Min 60s (1m).
    const autoIntervalSec = Math.max(60, 600 - (premiumUpgrades.autoLvl * 60));

    // Timer Loop for UI updates
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculate Unclaimed Logic
    const lastTs = mineState.lastTs || Date.now();
    const elapsedMs = now - lastTs;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const cappedSec = Math.min(elapsedSec, 600); // Max 10 mins

    const handleCollect = () => {
        if (cappedSec > 0) {
            runMine(cappedSec);
        }
    };

    // Auto Run Loop
    // Use ref to track latest interval without resetting timer constantly
    const autoIntervalRef = useRef(autoIntervalSec);
    autoIntervalRef.current = autoIntervalSec;

    useEffect(() => {
        const tick = () => {
            const currentLastTs = useFlowStore.getState().mineState.lastTs;
            const curSec = Math.floor((Date.now() - currentLastTs) / 1000);

            // Check if we passed the dynamic interval OR the hard cap
            const threshold = Math.min(autoIntervalRef.current, 600);

            if (curSec >= threshold && curSec > 0) {
                // Collect capped at 600 (or current if less, actually runMine caps logic if needed, but here we pass elapsed)
                // We pass curSec, but runMine usually handles logic.
                // Actually we should pass Math.min(curSec, 600) to be safe with Logic.
                useFlowStore.getState().runMine(Math.min(curSec, 600));
            }
        };

        // Check frequently (e.g. every 10s) to see if we reached threshold
        // This is better than setting a long interval that resets on render
        const id = setInterval(tick, 10000);
        return () => clearInterval(id);
    }, []); // Empty dependency, uses Ref for dynamic interval

    // HP Bar Logic
    const getHpPct = () => {
        const hp = mineState.rockHp;
        const max = mineState.rockMaxHp;
        if (max.m === 0) return 0;
        const ratio = (hp.m / max.m) * Math.pow(10, hp.e - max.e);
        return Math.min(Math.max(ratio * 100, 0), 100);
    };

    return (
        <div className="flex flex-col gap-2 p-3 glass-panel border border-white/10 w-[220px] bg-gray-900/90 rounded-lg backdrop-blur-md shadow-xl transition-all hover:border-white/20">
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold uppercase text-gray-400">
                    ⛏️ Stage {mineState.stageId}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-xs font-bold animate-pulse">
                        {mineState.premiumCredits} CR
                    </span>
                    <button
                        onClick={() => setShopOpen(true)}
                        className="p-1 rounded bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white transition-colors border border-yellow-600/30"
                        title="Premium Shop"
                    >
                        <ShoppingCart className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Stats Panel */}
            <div className="text-xs font-mono bg-black/40 p-2 rounded space-y-2">

                {/* Gold & Tier */}
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Tier {mineState.rockTier}</span>
                    <span className="text-yellow-200">{formatBigNum(mineState.gold)}g</span>
                </div>

                {/* Progress */}
                <div className="flex justify-between items-center font-bold text-white">
                    <span className="flex items-center gap-1">
                        Rock {Math.min(mineState.killsInStage + 1, mineState.stageGoal)}/{mineState.stageGoal}
                        {mineState.killsInStage + 1 === mineState.stageGoal && (
                            <span className="text-[9px] bg-red-600 px-1 rounded text-white animate-pulse">BOSS</span>
                        )}
                    </span>
                </div>

                {/* HP Bar */}
                <div className="h-5 bg-gray-800 rounded border border-white/10 overflow-hidden relative">
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                        style={{ width: `${getHpPct()}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md z-10">
                        {formatBigNum(mineState.rockHp)} / {formatBigNum(mineState.rockMaxHp)}
                    </div>
                </div>
            </div>

            {/* Collection UI */}
            <div className="mt-1">
                <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Unclaimed</span>
                    <span className={`text-base font-mono font-bold ${cappedSec >= 600 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
                        {Math.floor(cappedSec / 60)}m {cappedSec % 60}s
                    </span>
                </div>

                <button
                    onClick={handleCollect}
                    disabled={cappedSec <= 0}
                    className={`w-full py-3 rounded font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2
                        ${cappedSec > 0
                            ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:scale-105 active:scale-95 text-white shadow-green-900/30'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                        }
                    `}
                >
                    <span>COLLECT</span>
                    {cappedSec >= 600 && <span className="text-[10px] bg-red-500 text-white px-1 rounded">MAX</span>}
                </button>
                <div className="text-[9px] text-center text-gray-600 mt-1 flex justify-center gap-1">
                    Auto-Collect: <span className="text-gray-400">{autoIntervalSec / 60}m</span>
                </div>
            </div>

            {/* Ad Slot (Placeholder) */}
            <div className="mt-2 flex justify-center">
                <AdSlot width={200} height={100} />
            </div>

            <PremiumShopModal isOpen={isShopOpen} onClose={() => setShopOpen(false)} />
        </div>
    );
}
