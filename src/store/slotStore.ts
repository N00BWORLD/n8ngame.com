import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SlotType, SlotItem } from '@/features/slots/types';
import { CATALOG } from '@/features/slots/catalog';
import { useFlowStore } from '@/store/flowStore';
import { getUpgradeCost } from '@/features/slots/utils';
import { fromNumber, sub, cmp } from '@/lib/bigNum';

interface SlotState {
    inventory: SlotItem[];
    equipped: Record<SlotType, string | null>;
    ui: {
        inventoryOpen: boolean;
        logsOpen: boolean;
    };

    // Actions
    equip: (itemId: string) => void;
    unequip: (slotType: SlotType) => void;
    unlock: (itemId: string) => void;
    upgrade: (slotType: SlotType) => void; // Changed signature to (slotType: SlotType)
    getEquippedItem: (slotType: SlotType) => SlotItem | undefined;

    // UI Actions
    toggleInventory: () => void;
    toggleLogs: () => void;
    setInventoryOpen: (open: boolean) => void;
}

export const useSlotStore = create<SlotState>()(
    persist(
        (set, get) => ({
            inventory: CATALOG,
            equipped: {
                TRIGGER: null,
                DAMAGE: null,
                GOLD: null,
                UTILITY: null,
            },
            ui: {
                inventoryOpen: false,
                logsOpen: false
            },

            equip: (itemId) => {
                const item = get().inventory.find(i => i.id === itemId);
                if (!item || !item.unlocked) return;

                set((state) => ({
                    equipped: {
                        ...state.equipped,
                        [item.slotType]: itemId
                    }
                }));
            },

            unequip: (slotType) => {
                set((state) => ({
                    equipped: {
                        ...state.equipped,
                        [slotType]: null
                    }
                }));
            },

            unlock: (itemId) => {
                set((state) => ({
                    inventory: state.inventory.map(i =>
                        i.id === itemId ? { ...i, unlocked: true } : i
                    )
                }));
            },

            upgrade: (slotType) => { // Changed signature to (slotType: SlotType)
                const { inventory, equipped } = get();
                const itemId = equipped[slotType];
                if (!itemId) {
                    console.warn(`No item equipped in slot: ${slotType}`);
                    return;
                }

                const itemIndex = inventory.findIndex(i => i.id === itemId);
                if (itemIndex === -1) return;

                const item = inventory[itemIndex];
                const cost = getUpgradeCost(item);
                const costBn = fromNumber(cost);

                // Access FlowStore for GOLD
                const { mineState } = useFlowStore.getState() as any;
                const currentGold = mineState.gold;

                if (cmp(currentGold, costBn) >= 0) {
                    const nextGold = sub(currentGold, costBn);
                    useFlowStore.setState({
                        mineState: { ...mineState, gold: nextGold }
                    });

                    // Upgrade Item
                    const newItem = { ...item, level: item.level + 1 };
                    const newInventory = [...inventory];
                    newInventory[itemIndex] = newItem;

                    set({ inventory: newInventory });
                }
            },

            getEquippedItem: (slotType) => {
                const { equipped, inventory } = get();
                const itemId = equipped[slotType];
                if (!itemId) return undefined;
                return inventory.find(i => i.id === itemId);
            },

            toggleInventory: () => set(state => ({
                ui: { ...state.ui, inventoryOpen: !state.ui.inventoryOpen }
            })),
            toggleLogs: () => set(state => ({
                ui: { ...state.ui, logsOpen: !state.ui.logsOpen }
            })),
            setInventoryOpen: (open) => set(state => ({
                ui: { ...state.ui, inventoryOpen: open }
            }))
        }),
        {
            name: 'n8ngame:slots:v1',
        }
    )
);
