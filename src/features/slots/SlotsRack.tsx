import { useSlotStore } from '@/store/slotStore';
import { SlotCard } from './SlotCard';
import { SlotType } from './types';

export function SlotsRack() {
    const { getEquippedItem } = useSlotStore();

    // Ordered Slots
    const SLOT_ORDER: SlotType[] = ['TRIGGER', 'BOOST', 'OUTPUT'];

    return (
        <div className="flex-1 w-full max-w-md mx-auto p-4 overflow-y-auto pb-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SLOT_ORDER.map(type => {
                    const item = getEquippedItem(type);
                    return (
                        <SlotCard
                            key={type}
                            slotType={type}
                            item={item || undefined} // Force undefined if null
                        />
                    );
                })}
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">Tap empty slot to install items</p>
            </div>
        </div>
    );
}
