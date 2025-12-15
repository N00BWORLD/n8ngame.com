import { Zap } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { toNumber } from '@/lib/bigNum';
import { useSlotStore } from '@/store/slotStore';
import { computeLoadout } from '@/features/slots/utils';
import { formatShort } from '@/lib/format';

export function TopBar() {
    const { mineState, toggleN8nPanel, n8nStatus } = useFlowStore();
    const { getEquippedItem } = useSlotStore();

    const equippedItems = ['TRIGGER', 'DAMAGE', 'GOLD', 'UTILITY'].map(type =>
        getEquippedItem(type as any)
    );
    const { dps, goldBonusPct, intervalSec } = computeLoadout(equippedItems);

    return (
        <div className="flex-none h-12 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50">
            {/* Left: Logo/Title */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={toggleN8nPanel}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6D5A] to-[#FF4D4D] flex items-center justify-center relative shadow-[0_0_10px_rgba(255,109,90,0.3)]">
                    <Zap className="w-5 h-5 text-white fill-current" />
                    {/* Status Dot */}
                    <div className={`absolute - top - 1 - right - 1 w - 2.5 h - 2.5 rounded - full border - 2 border - [#1a1a20] ${n8nStatus === 'running' ? 'bg-yellow-400 animate-pulse' :
                        n8nStatus === 'error' ? 'bg-red-500' :
                            n8nStatus === 'ok' ? 'bg-green-500' : 'bg-gray-500'
                        } `} />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white tracking-wider text-sm leading-none">N8N</span>
                    <span className="text-[10px] text-[#FF6D5A] font-mono leading-none">CONNECTED</span>
                </div>
            </div>

            {/* Center: Loadout Stats (Small) */}
            <div className="hidden sm:flex items-center gap-4 bg-white/5 rounded-full px-4 py-1 border border-white/5">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-red-400 font-bold">DPS</span>
                    <span className="text-xs font-mono text-white">{formatShort(dps)}</span>
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
                        {formatShort(toNumber(mineState.gold))}
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
