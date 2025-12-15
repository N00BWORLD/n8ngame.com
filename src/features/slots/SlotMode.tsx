import { useSlotStore } from "@/store/slotStore";
import { CATALOG } from "./catalog";
import { SlotType } from "./types";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/store/flowStore";
import { Clock, Pickaxe, ShieldPlus, Repeat, X } from "lucide-react";
import { computeLoadout } from "./utils";

export function SlotMode() {
    const { equipped, inventory, equip, unequip } = useSlotStore();
    const { isMiningAuto, toggleMiningAuto } = useFlowStore();

    // Fixed Slots Definition
    const SLOTS: { label: string, type: SlotType, icon: any }[] = [
        { label: 'TRIGGER', type: 'TRIGGER', icon: Clock },
        { label: 'MODIFIER', type: 'BOOST', icon: ShieldPlus },
        { label: 'OUTPUT', type: 'OUTPUT', icon: Pickaxe },
    ];

    // Compute stats for UI
    const equippedItems = Object.values(equipped).map(id => inventory.find(i => i.id === id));
    const loadout = computeLoadout(equippedItems);

    return (
        <div className="relative w-full h-full bg-[#111] overflow-y-auto pb-32">
            {/* Header / Stats */}
            <div className="sticky top-0 z-10 bg-[#1a1a20]/95 backdrop-blur border-b border-white/10 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Station Rack</h2>
                        <p className="text-xs text-gray-400">Configure your mining loop</p>
                    </div>

                    {/* AutoTick Toggle */}
                    <button
                        onClick={toggleMiningAuto}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                            isMiningAuto
                                ? "bg-cyan-900/30 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                : "bg-gray-800 border-gray-700 text-gray-400"
                        )}
                    >
                        <Repeat className={cn("w-4 h-4", isMiningAuto && "animate-spin-slow")} />
                        <span className="text-xs font-bold font-mono">
                            {isMiningAuto ? "AUTO ON" : "MANUAL"}
                        </span>
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">DPS</span>
                        <span className="text-lg font-mono font-bold text-cyan-400">{loadout.dps}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gold Bonus</span>
                        <span className="text-lg font-mono font-bold text-yellow-400">+{loadout.goldBonusPct}%</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Interval</span>
                        <span className="text-lg font-mono font-bold text-gray-300">
                            {loadout.intervalSec > 9999 ? 'MANUAL' : `${Math.floor(loadout.intervalSec)}s`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Slots Grid */}
            <div className="p-4 grid gap-4 max-w-lg mx-auto">
                {SLOTS.map((slot) => {
                    const equipId = equipped[slot.type];
                    const item = inventory.find(i => i.id === equipId);

                    return (
                        <div key={slot.type} className="bg-[#1a1a20] border border-white/5 rounded-lg overflow-hidden relative group">
                            <div className="bg-black/30 px-3 py-2 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <slot.icon className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs font-bold text-gray-400">{slot.label}</span>
                                </div>
                                {item && (
                                    <button
                                        onClick={() => unequip(slot.type)}
                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                        title="Unequip"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="p-4">
                                {item ? (
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded bg-gradient-to-br flex items-center justify-center shrink-0 shadow-inner",
                                            item.rarity === 'common' && "from-gray-700 to-gray-800",
                                            item.rarity === 'rare' && "from-blue-900 to-blue-800",
                                            item.rarity === 'epic' && "from-purple-900 to-purple-800",
                                            item.rarity === 'legendary' && "from-yellow-900 to-yellow-800"
                                        )}>
                                            <slot.icon className="w-6 h-6 text-white/80" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-sm">{item.name}</h3>
                                            <p className="text-xs text-gray-400">{item.description}</p>
                                        </div>
                                        <div className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-cyan-500 border border-cyan-900/30">
                                            Lv.{item.level}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-600 mb-3">Empty Slot</p>
                                    </div>
                                )}
                            </div>

                            {/* Inventory Drawer for Slot (Simple In-place list for now) */}
                            <div className="bg-black/20 border-t border-white/5 p-2">
                                <p className="text-[10px] text-gray-500 mb-2 px-1 uppercase font-bold">Available</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {CATALOG.filter(c => c.slotType === slot.type && c.unlocked).map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => equip(c.id)}
                                            className={cn(
                                                "shrink-0 w-32 p-2 rounded border text-left transition-all",
                                                c.id === equipId
                                                    ? "bg-cyan-900/20 border-cyan-500/50"
                                                    : "bg-[#222] border-white/5 hover:bg-[#333]"
                                            )}
                                        >
                                            <div className="text-xs font-bold text-gray-200 truncate">{c.name}</div>
                                            <div className="text-[10px] text-gray-500 truncate">{c.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
