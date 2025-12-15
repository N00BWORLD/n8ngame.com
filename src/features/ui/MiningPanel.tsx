import { useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { formatBigNum } from '@/lib/bigNum';

export function MiningPanel() {
    const mineState = useFlowStore((state) => state.mineState);
    const runMine = useFlowStore((state) => state.runMine);
    const isMiningAuto = useFlowStore((state) => state.isMiningAuto);
    const toggleMiningAuto = useFlowStore((state) => state.toggleMiningAuto);

    // Auto Miner Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMiningAuto) {
            interval = setInterval(() => {
                runMine(3);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isMiningAuto, runMine]);

    // Background Tab Handler (Visibility API)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                const lastTs = mineState.lastTs;
                if (lastTs > 0) {
                    const elapsedMs = now - lastTs;
                    // Cap at 3600s check
                    if (elapsedMs > 5000) { // Min 5s to trigger catchup
                        const elapsedSec = Math.floor(elapsedMs / 1000);
                        const cappedSec = Math.min(elapsedSec, 3600);

                        // Auto-mine catchup? Probably just log or run once big?
                        // "Auto가 켜져있을 때" or always? Prompt says "사용자가 탭을 벗어났다가 돌아오면... elapsedSec 계산 규칙"
                        // If Auto is OFF, time passes but no mining happens? 
                        // Prompt rule: "elapsedSec = floor..." implying we run a mine OP.
                        // Ideally we only run if the user *would have been mining*. 
                        // But for "Idle Game" vibe, maybe passive gain? 
                        // But prompt says "Auto가 켜지면 3초마다... 추가로 탭 돌아오면 보정 실행" -> Context implies Auto logic catchup.
                        if (isMiningAuto) {
                            // Run Catchup
                            // We run one big mine operation
                            console.log(`[Catchup] Running for ${cappedSec}s`);
                            runMine(cappedSec);
                        }
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [mineState.lastTs, isMiningAuto, runMine]);

    // HP Bar Logic
    // We need percentage. BigNum doesn't sport division easily yet, but BigNum to number is possible for ratio if exponents are close.
    // e.g. hp: {m: 5, e: 2}, max: {m: 1, e: 3} -> 500 / 1000 = 0.5
    // For ratio, we can just do (m1/m2) * 10^(e1-e2)
    // Avoid double precision overflow for HUGE numbers?
    // ratio = (m1/m2) * 10^(e1-e2)
    const getHpPct = () => {
        const hp = mineState.rockHp;
        const max = mineState.rockMaxHp;
        if (max.m === 0) return 0;

        const ratio = (hp.m / max.m) * Math.pow(10, hp.e - max.e);
        return Math.min(Math.max(ratio * 100, 0), 100);
    };

    // Manual Handlers
    const handleMine = (sec: number) => {
        runMine(sec);
    };

    return (
        <div className="absolute top-[80px] left-4 z-40 flex flex-col gap-2 p-3 glass-panel border border-white/10 w-[200px] bg-gray-900/90 rounded-lg backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1 text-gray-400">⛏️ Mining Control</h3>

            {/* Stats */}
            <div className="text-xs font-mono bg-black/40 p-2 rounded mb-2 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rock Lv.{mineState.rockLevel}</span>
                    <span className="text-yellow-400 font-bold">{formatBigNum(mineState.gold)}g</span>
                </div>

                {/* HP Bar */}
                <div className="h-4 bg-gray-800 rounded border border-white/10 overflow-hidden relative">
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                        style={{ width: `${getHpPct()}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white shadow-black drop-shadow-md z-10">
                        {formatBigNum(mineState.rockHp)} / {formatBigNum(mineState.rockMaxHp)}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleMine(10)}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded text-[10px] text-blue-200 transition-all"
                >
                    Mine 10s
                </button>
                <button
                    onClick={() => handleMine(60)}
                    className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded text-[10px] text-purple-200 transition-all"
                >
                    Mine 60s
                </button>
            </div>

            <button
                onClick={toggleMiningAuto}
                className={`w-full text-xs font-bold py-1.5 rounded border transition-all flex items-center justify-center gap-2 ${isMiningAuto
                    ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    }`}
            >
                <span className={`w-2 h-2 rounded-full ${isMiningAuto ? 'bg-green-500' : 'bg-gray-500'}`} />
                {isMiningAuto ? 'AUTO MINING ON' : 'ENABLE AUTO'}
            </button>
        </div>
    );
}
