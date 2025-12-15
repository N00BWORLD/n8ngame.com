import { useEffect, useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';
import { formatBigNum, toNumber, fromNumber } from '@/lib/bigNum';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { Crown } from 'lucide-react';

export function RockPanel() {
    const { mineState, lastDamage, lastDamageTs } = useFlowStore();
    const { rockHp, rockMaxHp, stageId, killsInStage } = mineState;

    const hpVal = toNumber(rockHp);
    const maxHpVal = toNumber(rockMaxHp);
    const hpPct = Math.min(100, Math.max(0, (hpVal / maxHpVal) * 100));

    const animatedHp = useAnimatedNumber(hpVal, 200);

    // Damage Floating Text Logic
    const [floatText, setFloatText] = useState<{ id: number, text: string, x: number, y: number } | null>(null);

    useEffect(() => {
        if (lastDamage > 0) {
            setFloatText({
                id: lastDamageTs,
                text: `-${Math.round(lastDamage)}`,
                x: 50 + (Math.random() * 40 - 20), // Center +/-
                y: 50
            });

            const timer = setTimeout(() => setFloatText(null), 800);
            return () => clearTimeout(timer);
        }
    }, [lastDamageTs]);

    // killsInStage is 0-indexed? Let's check logic.
    // killsInStage=0 -> Rock 1/20. killsInStage=19 -> Rock 20/20 (Boss).
    const rockNum = killsInStage + 1;
    const isBossRock = rockNum === 20;

    return (
        <>
            <style>{`
            @keyframes float-up {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -150%) scale(1.5); }
            }
            .animate-float-up {
                animation: float-up 0.8s ease-out forwards;
            }
        `}</style>
            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40 pointer-events-none">
                {/* Stage Info */}
                <div className="flex flex-col items-center gap-1 mb-2 drop-shadow-md">
                    <div className="flex items-center gap-2">
                        <span className="text-orange-400 font-bold text-sm tracking-wider uppercase">Stage {stageId}</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className={cn("text-sm font-bold", isBossRock ? "text-red-500 animate-pulse" : "text-gray-300")}>
                            Rock {rockNum}/20
                        </span>
                        {isBossRock && <Crown className="w-3 h-3 text-red-500 fill-red-500 animate-bounce" />}
                    </div>
                </div>

                {/* Rock / HP Bar */}
                <div className="relative w-full h-12 bg-black/60 rounded-xl border-2 border-white/10 overflow-hidden shadow-xl backdrop-blur-sm transition-all duration-100">
                    {/* HP Progress */}
                    <div
                        className={cn(
                            "absolute top-0 left-0 h-full transition-all duration-300 ease-out",
                            isBossRock ? "bg-gradient-to-r from-red-900 to-red-600" : "bg-gradient-to-r from-cyan-900 to-cyan-600"
                        )}
                        style={{ width: `${hpPct}%` }}
                    />

                    {/* HP Text */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <span className="text-white font-bold font-mono text-lg drop-shadow-md">
                            {formatBigNum(fromNumber(animatedHp))} / {formatBigNum(rockMaxHp)}
                        </span>
                    </div>

                    {/* Floating Damage Text */}
                    {floatText && (
                        <div
                            key={floatText.id}
                            className="absolute text-2xl font-black text-white stroke-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-float-up"
                            style={{
                                left: `${floatText.x}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                            }}
                        >
                            {floatText.text}
                        </div>
                    )}
                </div>

                <div className="text-center mt-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Current Target HP</span>
                </div>
            </div>
        </>
    );
}
