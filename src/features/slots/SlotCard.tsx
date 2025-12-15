import { SlotType, SlotItem } from './types';
import { cn } from '@/lib/utils';
import { Zap, Hammer, Coins, Cpu, Plus } from 'lucide-react';
import { useSlotStore } from '@/store/slotStore';
import { getItemStats, getUpgradeCost } from './utils';

// Constants
const ICONS: Record<SlotType, any> = {
    TRIGGER: Zap,
    DAMAGE: Hammer,
    GOLD: Coins,
    UTILITY: Cpu
};

const COLORS: Record<SlotType, string> = {
    TRIGGER: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
    DAMAGE: 'text-red-400 bg-red-400/10 border-red-500/20',
    GOLD: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
    UTILITY: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20'
};

interface SlotCardProps {
    type: SlotType;
    item?: SlotItem;
    onRemove: () => void;
    onInstallClick: () => void;
}

export function SlotCard({ type, item, onRemove, onInstallClick }: SlotCardProps) {
    const { upgrade } = useSlotStore();
    const stats = item ? getItemStats(item) : {};
    const cost = item ? getUpgradeCost(item) : 0;

    // Mission 22-C Fix: Define constants
    const Icon = ICONS[type];
    const colorClass = COLORS[type];

    // Helper to format stat string
    const getStatString = () => {
        if (!item) return '';
        if (stats.dps) return `${stats.dps} DPS`;
        if (stats.goldBonusPct) return `+${stats.goldBonusPct}% Gold`;
        if (stats.intervalSec) return `${stats.intervalSec.toFixed(1)}s Interval`;
        if (stats.intervalMs) return `${(stats.intervalMs / 1000).toFixed(1)}s Interval`;
        return '';
    };

    return (
        <div className={cn(
            "relative w-full aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center transition-all",
            item ? "bg-[#1a1a20] border-white/20" : `border-dashed ${colorClass} hover:bg-white/5 cursor-pointer`
        )}
            onClick={!item ? onInstallClick : undefined}
        >
            {/* Header / Icon */}
            <div className="absolute top-4 left-4">
                <Icon className={cn("w-6 h-6", item ? "text-gray-400" : "text-current")} />
            </div>

            {/* Label */}
            <div className="absolute top-4 right-4 text-xs font-bold tracking-wider opacity-50">
                {type}
            </div>

            {/* Content */}
            {item ? (
                <div className="flex flex-col items-center gap-2 p-4 text-center w-full">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-1">
                        <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div>
                        <h3 className="text-md font-bold text-white leading-tight">{item.name}</h3>
                        <div className="text-[10px] text-cyan-400 font-mono mb-1">Lv.{item.level}</div>
                        <p className="text-xs text-gray-400">{item.description}</p>
                        <div className="text-sm font-bold text-green-400 mt-1">{getStatString()}</div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2 w-full px-2">
                        {/* Upgrade Btn */}
                        <button
                            onClick={(e) => { e.stopPropagation(); upgrade(item.id); }}
                            className="w-full px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-200 text-xs font-bold rounded-lg border border-yellow-500/30 transition-colors flex items-center justify-center gap-1"
                        >
                            <Coins className="w-3 h-3" />
                            {cost.toLocaleString()}
                        </button>

                        {/* Remove Btn */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="w-full px-3 py-1 bg-red-500/10 hover:bg-red-500/30 text-red-400 text-[10px] rounded-lg transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <Plus className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-bold">Install</span>
                </div>
            )}
        </div>
    );
}
