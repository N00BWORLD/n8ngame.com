import { Zap } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { formatBigNum } from '@/lib/bigNum';
import { useSlotStore } from '@/store/slotStore';
import { computeLoadout } from '@/features/slots/utils';

export function TopBar() {
    const { mineState } = useFlowStore();
    const { getEquippedItem } = useSlotStore();

    const equippedItems = ['TRIGGER', 'DAMAGE', 'GOLD', 'UTILITY'].map(type =>
        getEquippedItem(type as any)
    );
    const { dps, goldBonusPct, intervalSec } = computeLoadout(equippedItems);

    return (
        <div className="flex-none h-12 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50">
            {/* Left: Logo/Title */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white tracking-wider text-sm leading-none">N8N</span>
                    <span className="text-[10px] text-cyan-400 font-mono leading-none">GAME</span>
                </div>
            </div>

            {/* Center: Loadout Stats (Small) */}
            <div className="hidden sm:flex items-center gap-4 bg-white/5 rounded-full px-4 py-1 border border-white/5">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-red-400 font-bold">DPS</span>
                    <span className="text-xs font-mono text-white">{dps}</span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-yellow-400 font-bold">GOLD</span>
                    <span className="text-xs font-mono text-white">+{goldBonusPct}%</span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-blue-400 font-bold">INT</span>
                    <span className="text-xs font-mono text-white">{intervalSec.toFixed(1)}s</span>
                </div>
            </div>

            {/* Right: Currencies */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Gold</div>
                    <div className="text-sm font-mono text-white leading-none">
                        {formatBigNum(mineState.gold)}
                    </div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Tickets</div>
                    <div className="text-sm font-mono text-white leading-none">
                        {mineState.tickets.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
