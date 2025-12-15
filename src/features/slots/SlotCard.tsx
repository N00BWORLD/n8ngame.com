import { SlotItem, SlotType } from './types';
import { cn } from '@/lib/utils';
import { Lock, Plus, Zap, Hammer, Coins, Cpu, ArrowUpCircle } from 'lucide-react';
import { useSlotStore } from '@/store/slotStore';
import { useFlowStore } from '@/store/flowStore';
import { getItemStats, getUpgradeCost } from './utils';
import { formatShort } from '@/lib/format';
import { toNumber } from '@/lib/bigNum';

interface SlotCardProps {
    slotType: SlotType;
    item?: SlotItem;
    isLocked?: boolean;
    onClick?: () => void;
}

export function SlotCard({ slotType, item, isLocked, onClick }: SlotCardProps) {
    const { upgrade, setInventoryOpen } = useSlotStore();
    const { mineState } = useFlowStore();

    const Icon = {
        TRIGGER: Zap,
        DAMAGE: Hammer,
        GOLD: Coins,
        UTILITY: Cpu
    }[slotType];

    const handleUpgrade = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item) upgrade(slotType);
    };

    const handleCardClick = () => {
        if (!item) setInventoryOpen(true);
        else onClick?.();
    };

    if (isLocked) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square opacity-50">
                <Lock className="w-8 h-8 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase font-bold">Locked</span>
            </div>
        );
    }

    if (!item) {
        return (
            <button
                onClick={() => setInventoryOpen(true)}
                className="bg-white/5 border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square hover:bg-white/10 transition-all active:scale-95 group"
            >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-cyan-400" />
                </div>
                <span className="text-xs text-gray-400 font-bold">Equip {slotType}</span>
            </button>
        );
    }

    const cost = getUpgradeCost(item);
    // mineState.gold usually contains {m, e}. toNumber handles it.
    // However, if formatted, we need raw value.
    const currentGold = toNumber(mineState.gold);
    const canAfford = currentGold >= cost;
    const stats = getItemStats(item);

    // Format Stat String
    let statDisplay = "";
    if (stats.dps) statDisplay = `DPS: ${formatShort(stats.dps)}`;
    if (stats.goldBonusPct) statDisplay = `Gold: +${stats.goldBonusPct}%`;
    if (stats.intervalSec) statDisplay = `Int: ${stats.intervalSec.toFixed(1)}s`;

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "relative bg-gray-900 border border-white/10 rounded-xl p-3 flex flex-col gap-3 transition-all",
                "hover:border-white/20"
            )}
        >
            {/* Header: Icon & Level */}
            <div className="flex items-start justify-between">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center relative",
                    item.rarity === 'legendary' ? "bg-yellow-500/20 text-yellow-500" :
                        item.rarity === 'epic' ? "bg-purple-500/20 text-purple-500" :
                            item.rarity === 'rare' ? "bg-blue-500/20 text-blue-500" :
                                "bg-gray-500/20 text-gray-400"
                )}>
                    <Icon className="w-6 h-6 fill-current" />

                    {/* Mission 22-D: n8n Badge */}
                    <div className="absolute -bottom-2 -right-6 scale-75 origin-left px-1.5 py-0.5 bg-[#FF6D5A] text-black text-[9px] font-bold rounded-full shadow-lg z-10 border border-white/20 whitespace-nowrap">
                        {slotType === 'TRIGGER' ? 'Webhook' :
                            slotType === 'DAMAGE' ? 'Function' :
                                slotType === 'GOLD' ? 'Set' : 'Switch'}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{item.rarity}</span>
                    <span className="text-xs font-mono text-cyan-400">Lv.{item.level}</span>
                </div>
            </div>

            {/* Title & Stat */}
            <div>
                <div className="text-sm font-bold text-white leading-tight mb-1">{item.name}</div>
                <div className="text-xs text-gray-300 font-mono">{statDisplay}</div>
            </div>

            {/* Upgrade Button */}
            <button
                onClick={handleUpgrade}
                disabled={!canAfford}
                className={cn(
                    "mt-auto w-full h-[40px] flex items-center justify-center gap-1.5 rounded-lg font-bold text-xs transition-all active:scale-95",
                    canAfford
                        ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-75"
                )}
            >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>{formatShort(cost)}</span>
            </button>
        </div>
    );
}
