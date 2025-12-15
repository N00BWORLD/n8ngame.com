import { useSlotStore } from '@/store/slotStore';
import { SlotType } from './types';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface InventoryListProps {
    targetSlot: SlotType | null; // Filter logic can be added here if we only want to show relevant items
    onEquip: (itemId: string) => void;
}

export function InventoryList({ targetSlot, onEquip }: InventoryListProps) {
    const { inventory, equipped } = useSlotStore();

    // Filter items:
    // 1. Must match targetSlot (if specified) - Optional constraint, but good UX
    // 2. Or just show all? Acceptance says simple inventory list. Let's group by type.

    // For now, let's just list everything, but visual dimming if slot mismatch?
    // Actually, Goal says "Inventory에서 골라 장착".
    // Better UX: Show items relevant to the 'open' slot context, or just list all with categories.
    // Let's list all sorted by type.

    return (
        <div className="flex flex-col gap-2 p-4 pb-20 overflow-y-auto h-full">
            <h2 className="text-xl font-bold text-white mb-4">Inventory</h2>

            {inventory.map((item) => {
                // Mission 22-A: Filter by target slot if specified
                if (targetSlot && item.slotType !== targetSlot) return null;

                const isEquipped = Object.values(equipped).includes(item.id);

                return (
                    <div
                        key={item.id}
                        onClick={() => {
                            if (item.unlocked && !isEquipped) onEquip(item.id);
                        }}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                            !item.unlocked ? "bg-black/40 border-white/5 opacity-50 cursor-not-allowed" :
                                isEquipped ? "bg-green-900/20 border-green-500/30 cursor-default" :
                                    "bg-[#1a1a20] border-white/10 hover:border-cyan-500/50 hover:bg-white/5 cursor-pointer"
                        )}
                    >
                        <div className="flex flex-col">
                            <span className={cn("font-bold text-sm", item.unlocked ? "text-white" : "text-gray-500")}>
                                {item.name}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.slotType} • {item.rarity}</span>
                        </div>

                        {/* Status / Action */}
                        {!item.unlocked ? (
                            <Lock className="w-4 h-4 text-gray-600" />
                        ) : isEquipped ? (
                            <span className="text-xs text-green-400 font-bold">Equipped</span>
                        ) : (
                            <div className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100">Equip</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
