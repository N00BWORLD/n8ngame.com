import { X, ShoppingCart, Zap, Coins, Clock } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const UPGRADE_LABELS = {
    dps: { name: 'DPS Multiplier', icon: Zap, desc: 'Base Damage x1.15' },
    gold: { name: 'Gold Bonus', icon: Coins, desc: '+10% Gold Gain' },
    auto: { name: 'Auto Faster', icon: Clock, desc: '-60s Interval (Min 60s)' },
} as const;

export function PremiumShopModal({ isOpen, onClose }: Props) {
    const { mineState, premiumUpgrades, buyPremiumUpgrade } = useFlowStore();
    const credits = mineState.premiumCredits;

    if (!isOpen) return null;

    // Helper to get cost and next level info
    const getUpgradeInfo = (key: 'dps' | 'gold' | 'auto') => {
        let level = 0;
        let cost = 0;
        let nextEffect = '';

        if (key === 'dps') {
            level = premiumUpgrades.dpsLvl;
            cost = Math.ceil(2 * Math.pow(1.6, level));
            nextEffect = `x${Math.pow(1.15, level + 1).toFixed(2)}`;
        } else if (key === 'gold') {
            level = premiumUpgrades.goldLvl;
            cost = Math.ceil(3 * Math.pow(1.7, level));
            nextEffect = `+${(level + 1) * 10}%`;
        } else if (key === 'auto') {
            level = premiumUpgrades.autoLvl;
            cost = Math.ceil(5 * Math.pow(2.0, level));
            const currentInt = Math.max(60, 600 - (level * 60));
            const nextInt = Math.max(60, 600 - ((level + 1) * 60));
            nextEffect = `${nextInt}s (${currentInt}s -> ${nextInt}s)`;
        }

        return { level, cost, nextEffect };
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-stone-900 border border-yellow-500/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-yellow-900/20 border-b border-yellow-500/20">
                    <div className="flex items-center gap-2 text-yellow-400">
                        <ShoppingCart className="h-5 w-5" />
                        <h2 className="font-bold tracking-wide">PREMIUM SHOP</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Credits Display */}
                <div className="p-6 bg-black/40 text-center border-b border-white/5">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Premium Credits</span>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-600 font-mono mt-2 drop-shadow-sm">
                        {credits.toLocaleString()} <span className="text-sm font-bold text-yellow-600">CR</span>
                    </div>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3">
                    {(Object.keys(UPGRADE_LABELS) as Array<'dps' | 'gold' | 'auto'>).map((key) => {
                        const info = UPGRADE_LABELS[key];
                        const { level, cost, nextEffect } = getUpgradeInfo(key);
                        const canAfford = credits >= cost;

                        return (
                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-yellow-500/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors ${canAfford ? 'text-yellow-400' : 'text-gray-600'}`}>
                                        <info.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-200 text-sm flex items-center gap-2">
                                            {info.name}
                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">Lv.{level}</span>
                                        </div>
                                        <div className="text-xs text-stone-400 mt-0.5">{info.desc} <span className="text-yellow-500/80">({nextEffect})</span></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => buyPremiumUpgrade(key)}
                                    disabled={!canAfford}
                                    className={`flex flex-col items-center justify-center w-20 py-2 rounded-lg text-xs font-bold transition-all
                                        ${canAfford
                                            ? 'bg-yellow-600 text-white hover:bg-yellow-500 active:scale-95 shadow-lg shadow-yellow-900/20'
                                            : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                                        }
                                    `}
                                >
                                    <span className="flex items-center gap-1">
                                        {cost.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] opacity-80 font-normal">BUY</span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 text-center text-[10px] text-gray-500 bg-black/20 border-t border-white/5">
                    Upgrades are permanent and persist across sessions.
                </div>
            </div>
        </div>
    );
}
