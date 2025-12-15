import { useState } from 'react';
import { useSlotStore } from '@/store/slotStore';
import { SlotCard } from './SlotCard';
import { InventoryList } from './InventoryList';
import { SlotType } from './types';
import { cn } from '@/lib/utils';
import { X, Menu } from 'lucide-react';

export function SlotStation() {
    const { equip, getEquippedItem } = useSlotStore();
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [targetSlot, setTargetSlot] = useState<SlotType | null>(null);

    const SLOTS: SlotType[] = ['TRIGGER', 'BOOST', 'OUTPUT'];

    const handleInstallClick = (type: SlotType) => {
        setTargetSlot(type);
        setInventoryOpen(true);
    };

    const handleEquip = (itemId: string) => {
        equip(itemId);
        setInventoryOpen(false);
    };

    return (
        <div className="flex h-full w-full bg-[#0a0a0f] text-white overflow-hidden relative">

            {/* Main Area: Slots */}
            <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                    {SLOTS.map(type => (
                        <SlotCard
                            key={type}
                            slotType={type}
                            item={getEquippedItem(type)}
                            isLocked={false}
                            onClick={() => handleInstallClick(type)}
                        />
                    ))}
                </div>

                {/* Mobile FAB to open Inventory if closed */}
                <button
                    onClick={() => { setTargetSlot(null); setInventoryOpen(true); }}
                    className="fixed bottom-6 right-6 sm:hidden p-4 bg-cyan-600 text-white rounded-full shadow-lg z-50 hover:bg-cyan-500"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Inventory Sidebar / Drawer */}
            <div className={cn(
                "absolute inset-y-0 right-0 w-full sm:w-80 bg-[#111] border-l border-white/10 shadow-2xl transition-transform duration-300 z-[60]",
                isInventoryOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#15151a]">
                    <h3 className="font-bold">Inventory {targetSlot && <span className="text-cyan-400">({targetSlot})</span>}</h3>
                    <button onClick={() => setInventoryOpen(false)} className="p-2 hover:bg-white/10 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <InventoryList targetSlot={targetSlot} onEquip={handleEquip} />
            </div>

            {/* Backdrop for Mobile */}
            {isInventoryOpen && (
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[55] sm:hidden"
                    onClick={() => setInventoryOpen(false)}
                />
            )}
        </div>
    );
}
