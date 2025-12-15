import { X, Lock, Check } from 'lucide-react';
import { useSlotStore } from '@/store/slotStore';
import { cn } from '@/lib/utils';
import { SlotType } from './types';

export function InventorySheet() {
    const {
        inventory,
        ui,
        setInventoryOpen,
        equip,
        equipped
    } = useSlotStore();

    if (!ui.inventoryOpen) return null;

    // Filter available items? Or show all?
    // "Inventor 패널... 인벤토리에서 아이템을 골라..."
    // Let's Group by type? Or just list all?
    // Mobile friendly: Full width cards.
    // Let's group by Slot Type for clarity.

    const slotTypes: SlotType[] = ['TRIGGER', 'BOOST', 'OUTPUT'];

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={() => setInventoryOpen(false)}
            />

            {/* Sheet */}
            <div className="pointer-events-auto w-full bg-[#15151a] border-t border-white/10 rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white tracking-wide">Inventory</h2>
                    <button
                        onClick={() => setInventoryOpen(false)}
                        className="p-2 -mr-2 text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 space-y-6 pb-safe">
                    {slotTypes.map(type => {
                        const items = inventory.filter(i => i.slotType === type);
                        if (items.length === 0) return null;

                        return (
                            <div key={type} className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{type}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {items.map(item => {
                                        const isEquipped = equipped[type] === item.id;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    if (item.unlocked) {
                                                        equip(item.id);
                                                        setInventoryOpen(false);
                                                    }
                                                }}
                                                className={cn(
                                                    "relative rounded-xl border p-3 flex flex-col gap-2 transition-all active:scale-95",
                                                    item.unlocked
                                                        ? isEquipped
                                                            ? "bg-green-500/10 border-green-500/50 cursor-default"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                                                        : "bg-black/20 border-white/5 opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={cn(
                                                        "text-sm font-bold truncate",
                                                        isEquipped ? "text-green-400" : "text-white"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                    {isEquipped && <Check className="w-4 h-4 text-green-400" />}
                                                    {!item.unlocked && <Lock className="w-3 h-3 text-gray-500" />}
                                                </div>

                                                <div className="text-[10px] text-gray-400 leading-tight h-8 overflow-hidden">
                                                    {item.description}
                                                </div>

                                                {/* Mini Stat Badge */}
                                                <div className="mt-auto pt-2 flex items-center justify-between">
                                                    <div className="text-[10px] font-mono text-cyan-400">Lv.{item.level}</div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {item.unlocked ? "Tap to Equip" : "Locked"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
