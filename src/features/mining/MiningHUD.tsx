import { useFlowStore } from '@/store/flowStore';
import { useSlotStore } from '@/store/slotStore';
import { toNumber, formatBigNum } from '@/lib/bigNum';
import { formatCompact } from '@/lib/format';
import { Pickaxe, Clock, Ticket, Zap, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { useAutoRun } from './useAutoRun';
import { formatTimeMMSS } from '@/lib/time';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { compileBlueprintToLoadout } from '@/features/engine/mining/loadoutCompiler';
import { computeLoadout } from '@/features/slots/utils';

export function MiningHUD() {
    const { mineState, runMine, n8nStatus, isRunning, setShopOpen, nodes, upgrades, goldUpgrades, premiumUpgrades } = useFlowStore();
    const { inventory, equipped } = useSlotStore();
    const { gold, tickets } = mineState;
    const { enabled, toggle, secondsLeft, resetTimer } = useAutoRun();
    const [isAnimating, setIsAnimating] = useState(false);

    const isGlobalRunning = n8nStatus === 'running' || isRunning;

    // Animated Numbers
    const animGold = useAnimatedNumber(toNumber(gold));
    const animTickets = useAnimatedNumber(tickets);

    const stats = useMemo(() => {
        const bLoadout = compileBlueprintToLoadout(nodes, upgrades.nodeLimit);

        const equippedItems = ['TRIGGER', 'BOOST', 'OUTPUT'].map(type => {
            const id = equipped[type as 'TRIGGER' | 'BOOST' | 'OUTPUT'];
            return inventory.find(i => i.id === id);
        }).filter((i): i is any => !!i);

        const sLoadout = computeLoadout(equippedItems);

        // DPS Calculation
        const dpsMult = 1 + (goldUpgrades.dpsLevel * 0.10);
        const premDpsMult = Math.pow(1.15, premiumUpgrades.dpsLvl);

        // Base handling: if exponent > 0, slot base (flat) is negligible usually, but for correctness:
        // formatted big num handles {m, e}.
        // If e is 0, we add sLoadout.dps. If e > 0, we ignore flat addition or normalize.
        // For simplicity in UI:
        let baseM = bLoadout.dps.m;
        if (bLoadout.dps.e === 0) {
            baseM += sLoadout.dps;
        }

        const finalDpsM = baseM * dpsMult * premDpsMult;

        // Gold Bonus
        const goldVal = goldUpgrades.goldBonusLevel * 5;
        const totalGold = (bLoadout.goldBonusPct || 0) + sLoadout.goldBonusPct + goldVal;

        return {
            dps: { m: finalDpsM, e: bLoadout.dps.e },
            goldBonus: totalGold
        };
    }, [nodes, upgrades.nodeLimit, inventory, equipped, goldUpgrades, premiumUpgrades]);

    const handleMine = async () => {
        setIsAnimating(true);
        resetTimer();
        await runMine(0);
        setTimeout(() => setIsAnimating(false), 200);
    };

    return (
        <div className={cn("flex flex-col gap-2 items-center pointer-events-none transition-all", isGlobalRunning ? "opacity-90" : "opacity-100")}>

            {/* Resources Row (Gold / Tickets) */}
            <div className="flex gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 border border-yellow-500/20 shadow-lg">
                    <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    </div>
                    <span className="text-yellow-400 font-bold font-mono text-xs">
                        {formatCompact(animGold)}
                    </span>
                </div>

                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 border border-indigo-500/20 shadow-lg cursor-pointer hover:bg-black/80"
                    onClick={() => setShopOpen(true)}>
                    <Ticket className="w-3 h-3 text-indigo-400" />
                    <span className="text-indigo-400 font-bold font-mono text-xs">
                        {formatCompact(animTickets)}
                    </span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-2 opacity-80 scale-90">
                <div className="flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5 border border-white/5">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold text-cyan-100">
                        {formatBigNum(stats.dps)} DPS
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5 border border-white/5">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] font-mono font-bold text-yellow-100">
                        +{stats.goldBonus}%
                    </span>
                </div>
            </div>

            {/* Controls Row (Auto / Mine) */}
            <div className="flex gap-2 pointer-events-auto mt-0.5">
                {/* Auto Toggle */}
                <button
                    onClick={toggle}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-lg transition-all active:scale-95",
                        enabled ? "bg-cyan-900/80 border-cyan-500/50" : "bg-black/60 border-white/10"
                    )}
                >
                    <Clock className={cn("w-3 h-3", enabled ? "text-cyan-400 animate-spin-slow" : "text-gray-500")} />
                    <span className={cn("text-[10px] font-bold uppercase", enabled ? "text-cyan-200" : "text-gray-500")}>
                        {enabled ? formatTimeMMSS(secondsLeft) : "Auto Off"}
                    </span>
                </button>

                {/* Manual Mine */}
                <button
                    onClick={handleMine}
                    disabled={n8nStatus === 'running'}
                    className={cn(
                        "flex items-center gap-1 px-4 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95 border",
                        n8nStatus === 'running'
                            ? "bg-gray-800 text-gray-500 border-white/5 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400/30 hover:shadow-blue-500/20"
                    )}
                >
                    <Pickaxe className={cn("w-3 h-3", isAnimating && "animate-bounce")} />
                    <span>Mine</span>
                </button>
            </div>

            {/* Global Running Indicator */}
            {isGlobalRunning && (
                <div className="absolute -right-2 -top-1 pointer-events-none">
                    <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                </div>
            )}
        </div>
    );
}

