import { useFlowStore } from '@/store/flowStore';
import { fromNumber, cmp, formatBigNum } from '@/lib/bigNum';
import { X, TrendingUp, Sword, Coins, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const GOLD_UPGRADE_CONFIG = {
    dps: { baseCost: 50, growth: 1.15 },
    gold: { baseCost: 80, growth: 1.13 },
    auto: { baseCost: 200, growth: 1.20 }
};

export function ShopPanel() {
    const {
        isShopOpen, setShopOpen,
        mineState, goldUpgrades, buyGoldUpgrade
    } = useFlowStore();

    const upgrades = useMemo(() => {
        const { dpsLevel, goldBonusLevel, autoLevel } = goldUpgrades;
        const { gold } = mineState;

        // Helper to calc cost
        const getCost = (type: 'dps' | 'gold' | 'auto', lvl: number) => {
            const cfg = GOLD_UPGRADE_CONFIG[type];
            return fromNumber(Math.floor(cfg.baseCost * Math.pow(cfg.growth, lvl)));
        };

        const dpsCost = getCost('dps', dpsLevel);
        const goldCost = getCost('gold', goldBonusLevel);
        const autoCost = getCost('auto', autoLevel);

        return [
            {
                id: 'dps',
                label: 'Damage Multiplier',
                icon: Sword,
                level: dpsLevel,
                cost: dpsCost,
                canAfford: cmp(gold, dpsCost) >= 0,
                // Effect: 1 + 0.10 * Lv
                currentEffect: `x${(1 + dpsLevel * 0.10).toFixed(1)}`,
                nextEffect: `x${(1 + (dpsLevel + 1) * 0.10).toFixed(1)}`,
                color: 'text-cyan-400',
                btnColor: 'bg-cyan-600 hover:bg-cyan-500',
                note: undefined
            },
            {
                id: 'gold',
                label: 'Gold Yield',
                icon: Coins,
                level: goldBonusLevel,
                cost: goldCost,
                canAfford: cmp(gold, goldCost) >= 0,
                // Effect: Lv * 5%
                currentEffect: `+${goldBonusLevel * 5}%`,
                nextEffect: `+${(goldBonusLevel + 1) * 5}%`,
                color: 'text-yellow-400',
                btnColor: 'bg-yellow-600 hover:bg-yellow-500',
                note: undefined
            },
            {
                id: 'auto',
                label: 'Auto-Run Speed',
                icon: Timer,
                level: autoLevel,
                cost: autoCost,
                canAfford: cmp(gold, autoCost) >= 0,
                currentEffect: 'Lv.' + autoLevel,
                nextEffect: 'Lv.' + (autoLevel + 1),
                color: 'text-green-400',
                btnColor: 'bg-green-600 hover:bg-green-500',
                note: '(Optimizes interval)'
            }
        ] as const;
    }, [goldUpgrades, mineState.gold]);

    if (!isShopOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-[#18181b] border-t sm:border border-white/10 rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#202025]">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-white text-sm tracking-wide">PERMANENT UPGRADES</span>
                    </div>
                    <button
                        onClick={() => setShopOpen(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 overflow-y-auto">
                    {upgrades.map((u) => (
                        <div key={u.id} className="bg-[#2a2a30] rounded-lg p-3 border border-white/5 relative group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg bg-white/5", u.color)}>
                                        <u.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-white/50 font-bold uppercase tracking-wider">{u.label}</div>
                                        <div className="text-lg font-bold text-white">Lv. {u.level}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn("font-mono font-bold text-sm", u.color)}>
                                        {u.currentEffect} <span className="text-white/30 text-xs mx-1">&rarr;</span> {u.nextEffect}
                                    </div>
                                    {u.note && <div className="text-[10px] text-white/30 mt-0.5">{u.note}</div>}
                                </div>
                            </div>

                            <button
                                onClick={() => buyGoldUpgrade(u.id as any)}
                                disabled={!u.canAfford}
                                className={cn(
                                    "w-full py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all",
                                    u.canAfford
                                        ? cn(u.btnColor, "text-white shadow-lg active:scale-95")
                                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                )}
                            >
                                <span>Upgrade</span>
                                <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded">
                                    <Coins className="w-3 h-3" />
                                    <span>{formatBigNum(u.cost)}</span>
                                </div>
                            </button>
                        </div>
                    ))}

                    <div className="text-[10px] text-white/30 text-center mt-4">
                        Stats are applied automatically to all mining operations.
                    </div>
                </div>
            </div>
        </div>
    );
}

