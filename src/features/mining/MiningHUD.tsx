import { useFlowStore } from '@/store/flowStore';
import { formatBigNum, BigNum } from '@/lib/bigNum';
import { formatCompact } from '@/lib/format';
import { Pickaxe, Skull, Zap, Clock, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAutoRun } from './useAutoRun';
import { formatTimeMMSS } from '@/lib/time';

function FormattedHP({ current, max }: { current: BigNum, max: BigNum }) {
    const curStr = formatBigNum(current);
    const maxStr = formatBigNum(max);
    return <span>{curStr} / {maxStr}</span>;
}

export function MiningHUD() {
    const { mineState, runMine, n8nStatus, isRunning } = useFlowStore();
    const {
        stageId, killsInStage, rockHp, rockMaxHp, gold, tickets
    } = mineState;

    const { enabled, toggle, secondsLeft, resetTimer } = useAutoRun();
    const [isAnimating, setIsAnimating] = useState(false);

    const isGlobalRunning = n8nStatus === 'running' || isRunning;

    // Rock 1..20. killsInStage is 0..19 usually.
    // If killsInStage is 19, it's the 20th rock (BOSS).
    const rockIndex = (killsInStage % 20) + 1;
    const isBoss = rockIndex === 20;

    // HP Percent

    // Better HP Percent calculation using BigNum math if needed, but simple ratio is usually fine for bar
    // If exponents differ significantly, it's either 0% or 100%.
    const getPercent = () => {
        if (rockHp.e < rockMaxHp.e) return (rockHp.m / Math.pow(10, rockMaxHp.e - rockHp.e)) / rockMaxHp.m * 100;
        if (rockHp.e > rockMaxHp.e) return 100;
        return (rockHp.m / rockMaxHp.m) * 100;
    };
    const hpPercent = Math.max(0, Math.min(100, getPercent()));

    const handleMine = async () => {
        setIsAnimating(true);
        resetTimer();
        await runMine(0);
        setTimeout(() => setIsAnimating(false), 200);
    };

    return (
        <div className="absolute top-16 left-2 right-auto z-40 flex flex-col gap-2 w-48 font-sans select-none pointer-events-none transition-all md:top-20 md:left-4">

            {/* AutoRun Toggle */}
            <div className="bg-black/80 backdrop-blur border border-white/20 rounded-md px-3 py-1.5 flex items-center justify-between pointer-events-auto shadow-lg mb-1">
                <div className="flex items-center gap-2">
                    <Clock className={cn("w-3.5 h-3.5", enabled ? "text-cyan-400" : "text-gray-500")} />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">
                        {enabled ? formatTimeMMSS(secondsLeft) : "OFF"}
                    </span>
                </div>
                <button
                    onClick={toggle}
                    className={cn(
                        "w-6 h-3 rounded-full relative transition-colors border border-white/10",
                        enabled ? "bg-cyan-600" : "bg-gray-700"
                    )}
                >
                    <div className={cn(
                        "absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform shadow-sm",
                        enabled ? "translate-x-3" : "translate-x-0"
                    )} />
                </button>
            </div>

            {/* Main Stats Card */}
            <div className="bg-[#1a1a20]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 shadow-xl pointer-events-auto relative overflow-hidden transition-all group">

                {/* Stage Indicator */}
                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
                            Stage
                            <span className="bg-white/10 px-1 rounded text-[8px] text-cyan-200">
                                {useFlowStore.getState().editorMode === 'SLOT' ? 'SLOT' : 'GRAPH'}
                            </span>
                        </span>
                        <span className="text-sm font-bold text-cyan-400">#{stageId}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-yellow-400 font-bold">{formatBigNum(gold)}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-indigo-300 font-bold">{formatCompact(tickets)}</span>
                            <Ticket className="w-2.5 h-2.5 text-indigo-400" />
                        </div>
                    </div>
                </div>

                {/* Rock / Boss Info */}
                <div className="relative mb-1">
                    <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-1.5">
                            {isBoss ? <Skull className="w-3.5 h-3.5 text-red-500 animate-pulse" /> : <div className="w-3.5 h-3.5 rounded-full bg-gray-600 border border-gray-400" />}
                            <span className={cn("text-xs font-bold", isBoss ? "text-red-400" : "text-white/80")}>
                                {isBoss ? "BOSS" : `Rock ${rockIndex}/20`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* HP Bar */}
                <div className="relative h-3 bg-black/60 rounded-sm overflow-hidden border border-white/10 mb-2">
                    <div
                        className={cn("h-full transition-all duration-300 ease-out", isBoss ? "bg-red-600" : "bg-gradient-to-r from-orange-400 to-yellow-400")}
                        style={{ width: `${hpPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white shadow-black drop-shadow-md">
                            <FormattedHP current={rockHp} max={rockMaxHp} />
                        </span>
                    </div>
                </div>

                {/* Mine Button Row with Shop */}
                <div className="flex gap-1">
                    <button
                        onClick={() => useFlowStore.getState().setShopOpen(true)}
                        className="w-8 flex items-center justify-center rounded bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20 active:scale-95"
                    >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <button
                        onClick={handleMine}
                        disabled={n8nStatus === 'running'}
                        className={cn(
                            "flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20",
                            n8nStatus === 'running' && "bg-gray-700 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {n8nStatus === 'running' ? (
                            <>
                                <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                                <span>Mining...</span>
                            </>
                        ) : (
                            <>
                                <Pickaxe className={cn("w-3 h-3", isAnimating && "animate-bounce")} />
                                <span>Mine</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Running Badge Overlay */}
                {isGlobalRunning && (
                    <div className="absolute top-1 right-1 pointer-events-none">
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
