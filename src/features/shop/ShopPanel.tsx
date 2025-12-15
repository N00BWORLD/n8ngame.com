import { useFlowStore } from '@/store/flowStore';
import { fromNumber, cmp } from '@/lib/bigNum';
import { formatCompact } from '@/lib/format';
import { X, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ShopPanel() {
    const {
        isShopOpen, setShopOpen,
        mineState, goldUpgrades, buyGoldUpgrade
    } = useFlowStore();

    if (!isShopOpen) return null;

    const { dpsLevel, goldBonusLevel } = goldUpgrades;
    const { gold } = mineState;

    // Config (Match store)
    const dpsCostVal = Math.floor(25 * Math.pow(1.17, dpsLevel));
    const goldCostVal = Math.floor(40 * Math.pow(1.20, goldBonusLevel));

    const dpsCost = fromNumber(dpsCostVal);
    const goldCost = fromNumber(goldCostVal);

    const canAffordDps = cmp(gold, dpsCost) >= 0;
    const canAffordGold = cmp(gold, goldCost) >= 0;

    const currentDpsBonus = Math.pow(1.15, dpsLevel).toFixed(2);
    const nextDpsBonus = Math.pow(1.15, dpsLevel + 1).toFixed(2);


    const nextGoldBonus = (goldBonusLevel + 1) * 5;

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
                        <span className="font-bold text-white text-sm tracking-wide">UPGRADES</span>
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

                    {/* DPS CARD */}
                    <div className="bg-[#2a2a30] rounded-lg p-3 border border-white/5 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-xs text-white/50 font-bold uppercase tracking-wider mb-0.5">Base Damage</div>
                                <div className="text-lg font-bold text-white">Lv. {dpsLevel}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-cyan-400 font-mono">x{currentDpsBonus} &rarr; x{nextDpsBonus}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => buyGoldUpgrade('dps')}
                            disabled={!canAffordDps}
                            className={cn(
                                "w-full py-2 rounded font-bold text-xs flex items-center justify-center gap-1 transition-all",
                                canAffordDps
                                    ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20 active:scale-95"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            <span>{formatCompact(dpsCostVal)} Gold</span>
                        </button>
                    </div>

                    {/* GOLD BONUS CARD */}
                    <div className="bg-[#2a2a30] rounded-lg p-3 border border-white/5 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-xs text-white/50 font-bold uppercase tracking-wider">Gold Bonus</div>
                                <div className="text-lg font-bold text-white">Lv. {goldBonusLevel}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-yellow-400 font-mono">+{goldBonusLevel * 5}% &rarr; +{nextGoldBonus}%</div>
                            </div>
                        </div>

                        <button
                            onClick={() => buyGoldUpgrade('gold')}
                            disabled={!canAffordGold}
                            className={cn(
                                "w-full py-2 rounded font-bold text-xs flex items-center justify-center gap-1 transition-all",
                                canAffordGold
                                    ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20 active:scale-95"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            <span>{formatCompact(goldCostVal)} Gold</span>
                        </button>
                    </div>

                    <div className="text-[10px] text-white/30 text-center mt-4">
                        Upgrades are permanent and persist across sessions.
                    </div>
                </div>
            </div>
        </div>
    );
}

