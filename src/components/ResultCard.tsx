import { useFlowStore } from '@/store/flowStore';
import { X, Trophy, Star, Activity } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export function ResultCard() {
    const { isResultOpen, setResultOpen, lastExecutionResult } = useFlowStore();
    const [animateScore, setAnimateScore] = useState(0);

    const frameId = useRef<number>();

    useEffect(() => {
        if (isResultOpen && lastExecutionResult?.score) {
            let start = 0;
            const end = lastExecutionResult.score;
            const duration = 1000;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);

                setAnimateScore(Math.floor(start + (end - start) * ease));

                if (progress < 1) {
                    frameId.current = requestAnimationFrame(animate);
                }
            };
            frameId.current = requestAnimationFrame(animate);
        }

        return () => {
            if (frameId.current) cancelAnimationFrame(frameId.current);
        };
    }, [isResultOpen, lastExecutionResult]);

    if (!isResultOpen || !lastExecutionResult) return null;

    const { rank, scoreBreakdown, rewards, missionRewards, missions } = lastExecutionResult;

    // Combine rewards for display
    const allRewards = [...(rewards || []), ...(missionRewards || [])];
    const rewardMap = new Map<string, number>();
    allRewards.forEach(r => {
        const current = rewardMap.get(r.itemType) || 0;
        rewardMap.set(r.itemType, current + r.qty);
    });

    // Just Completed Missions
    const justCompletedMissions = (missions || []).filter((m: { justCompleted: boolean }) => m.justCompleted);

    const rankColor = rank === 'S' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
        rank === 'A' ? 'text-purple-400' :
            rank === 'B' ? 'text-blue-400' : 'text-gray-400';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-[400px] rounded-xl border border-white/20 bg-[#0a0a0f] p-0 shadow-2xl relative overflow-hidden">
                {/* Header / Rank */}
                <div className="relative flex flex-col items-center justify-center pt-8 pb-6 bg-gradient-to-b from-white/5 to-transparent">
                    <button
                        onClick={() => setResultOpen(false)}
                        className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Execution Result</div>
                    <div className={`text-8xl font-black ${rankColor} font-mono is-neon`}>
                        {rank}
                    </div>
                    <div className="text-4xl font-bold text-white mt-2 is-neon">
                        {animateScore}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Breakdown */}
                    <div className="space-y-2 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between">
                            <span>Base</span>
                            <span>{scoreBreakdown?.base || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Nodes ({Math.floor((scoreBreakdown?.nodes || 0) / 10)})</span>
                            <span className="text-green-400">+{scoreBreakdown?.nodes || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Edges ({Math.floor((scoreBreakdown?.edges || 0) / 15)})</span>
                            <span className="text-green-400">+{scoreBreakdown?.edges || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Missions</span>
                            <span className="text-yellow-400">+{scoreBreakdown?.bonus || 0}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-white/10">
                            <span>Gas Used</span>
                            <span className="text-red-400">-{scoreBreakdown?.gasPenalty || 0}</span>
                        </div>
                    </div>

                    {/* Missions */}
                    {justCompletedMissions.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold text-sm uppercase">
                                <Trophy className="h-4 w-4" /> Mission Complete!
                            </div>
                            <div className="space-y-2">
                                {justCompletedMissions.map((m: { id: number, title: string }) => (
                                    <div key={m.id} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-yellow-200 text-sm">
                                        <Activity className="h-4 w-4" />
                                        {m.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rewards */}
                    {rewardMap.size > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-sm uppercase">
                                <Star className="h-4 w-4" /> Rewards
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Array.from(rewardMap.entries()).map(([type, qty]) => (
                                    <div key={type} className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 p-2 rounded text-cyan-100 text-sm">
                                        <span className="truncate max-w-[100px]" title={type}>{type}</span>
                                        <span className="font-mono">x{qty}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex justify-center">
                    <button
                        onClick={() => setResultOpen(false)}
                        className="px-8 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
