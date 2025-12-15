import { useFlowStore } from '@/store/flowStore';
import { formatBigNum } from '@/lib/bigNum';
import { Pickaxe, Skull, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAutoRun } from './useAutoRun';
import { formatTimeMMSS } from '@/lib/time';

function FormattedHP({ current, max }: { current: any, max: any }) {
    // Simple formatter if bigNum formatting isn't perfect for "12.3K" style
    // But formatBigNum likely handles it.
    // Assuming BigNum structure {m, e}
    const curStr = formatBigNum(current);
    const maxStr = formatBigNum(max);
    return <span>{curStr} / {maxStr}</span>;
}

export function MiningHUD() {
    const { mineState, runMine, n8nStatus } = useFlowStore();
    const {
        stageId, killsInStage, rockHp, rockMaxHp, gold, tickets
    } = mineState;

    const { isAutoRun, toggleAutoRun, timeLeft, resetCountdown } = useAutoRun();
    const [isAnimating, setIsAnimating] = useState(false);

    const isBoss = (killsInStage + 1) % 20 === 0;
    const progress = (killsInStage % 20) + 1; // 1 to 20
    const hpPercent = Math.max(0, Math.min(100, (rockHp.m / rockMaxHp.m) * 100)); // Simplified calc assuming same exponent for now, purely visual

    const handleMine = async () => {
        setIsAnimating(true);
        resetCountdown(); // Reset auto timer if manual mine
        await runMine(0); // Manual run
        setTimeout(() => setIsAnimating(false), 200);
    };

    return (
        <div className="absolute top-16 left-4 z-50 flex flex-col gap-3 w-64 md:w-72 font-sans select-none pointer-events-none">
            {/* Auto Run Controller */}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-lg p-2 flex items-center justify-between pointer-events-auto shadow-lg hover:border-white/20 transition-all">
                <div className="flex items-center gap-2">
                    <Clock className={cn("w-4 h-4", isAutoRun ? "text-cyan-400" : "text-gray-500")} />
                    <span className="text-xs font-bold text-white/80 uppercase">
                        {isAutoRun ? `Next: ${formatTimeMMSS(timeLeft)}` : "Auto Run: OFF"}
                    </span>
                </div>
                <button
                    onClick={toggleAutoRun}
                    className={cn(
                        "w-10 h-5 rounded-full relative transition-colors border border-white/10",
                        isAutoRun ? "bg-cyan-600" : "bg-gray-800"
                    )}
                >
                    <div className={cn(
                        "absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-sm",
                        isAutoRun ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>

            {/* Top Stats Row */}
            <div className="flex gap-2 pointer-events-auto">
                {/* Stage Info */}
                <div className="flex-1 bg-black/80 backdrop-blur border border-white/20 rounded-lg p-2 flex flex-col justify-center items-center shadow-lg">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Stage</span>
                    <span className="text-xl font-bold text-cyan-400 leading-none">{stageId}</span>
                </div>

                {/* Gold */}
                <div className="flex-1 bg-black/80 backdrop-blur border border-white/20 rounded-lg p-2 flex flex-col justify-center items-center shadow-lg">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Gold</span>
                    <span className="text-lg font-bold text-yellow-400 leading-none">{formatBigNum(gold)}</span>
                </div>
            </div>

            {/* Rock / Boss Card */}
            <div className="bg-[#1a1a20]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl pointer-events-auto relative overflow-hidden">
                {/* Boss Badge */}
                {isBoss && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md animate-pulse">
                        BOSS
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                        {isBoss ? <Skull className="w-4 h-4 text-red-500" /> : <div className="w-4 h-4 rounded-full bg-gray-500/30 border border-white/20" />}
                        <span className={cn("text-sm font-bold", isBoss ? "text-red-400" : "text-white/80")}>
                            Rock {progress} / 20
                        </span>
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">
                        <FormattedHP current={rockHp} max={rockMaxHp} />
                    </div>
                </div>

                {/* HP Bar */}
                <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-3 relative">
                    <div
                        className={cn("h-full transition-all duration-300 ease-out", isBoss ? "bg-red-500" : "bg-gradient-to-r from-orange-400 to-yellow-400")}
                        style={{ width: `${hpPercent}%` }}
                    />
                </div>

                {/* Mine Button */}
                <button
                    onClick={handleMine}
                    disabled={n8nStatus === 'running'}
                    className={cn(
                        "w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 group relative overflow-hidden",
                        n8nStatus === 'running' ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                    )}
                >
                    <div className={cn("absolute inset-0 bg-white/20 transition-opacity duration-75", isAnimating ? "opacity-100" : "opacity-0")} />
                    <Pickaxe className={cn("w-4 h-4", isAnimating && "animate-bounce")} />
                    <span>{n8nStatus === 'running' ? 'Mining...' : 'Mine Now'}</span>
                    {n8nStatus === 'running' && <Zap className="w-3 h-3 text-yellow-400 animate-pulse ml-auto" />}
                </button>
            </div>

            {/* Premium / Tickets */}
            <div className="bg-black/60 backdrop-blur border border-indigo-500/30 rounded-lg p-2 flex items-center justify-between px-3 shadow-lg pointer-events-auto">
                <span className="text-[10px] text-indigo-300 font-bold uppercase">Tickets</span>
                <span className="text-sm font-mono font-bold text-white">{tickets}</span>
            </div>

            {/* Ad Placeholder (Hidden on Mobile) */}
            <div data-ad-slot className="hidden md:flex h-16 bg-white/5 border border-white/5 border-dashed rounded-lg items-center justify-center pointer-events-auto">
                <span className="text-[9px] text-white/20 uppercase">Ad Area</span>
            </div>
        </div>
    );
}
