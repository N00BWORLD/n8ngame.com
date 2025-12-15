import { SlotItem } from './types';

export const CATALOG: SlotItem[] = [
    {
        id: 'trigger-basic', name: 'Basic Timer', slotType: 'TRIGGER', rarity: 'common', level: 1,
        description: 'Triggers every 6s', unlocked: true,
        baseCost: 100, baseInterval: 600
    },
    {
        id: 'trigger-fast', name: 'Fast Timer', slotType: 'TRIGGER', rarity: 'rare', level: 1,
        description: 'Triggers every 3s', unlocked: true,
        baseCost: 500, baseInterval: 300
    },

    {
        id: 'dmg-pickaxe', name: 'Rusty Pickaxe', slotType: 'DAMAGE', rarity: 'common', level: 1,
        description: 'Deals 1 Damage', unlocked: true,
        baseCost: 150, baseValue: 1
    },
    {
        id: 'dmg-drill', name: 'Power Drill', slotType: 'DAMAGE', rarity: 'rare', level: 1,
        description: 'Deals 3 Damage', unlocked: true,
        baseCost: 600, baseValue: 3
    },

    {
        id: 'gold-pouch', name: 'Gold Pouch', slotType: 'GOLD', rarity: 'common', level: 1,
        description: '+10% Gold', unlocked: true,
        baseCost: 200, baseValue: 10
    },
    {
        id: 'gold-magnet', name: 'Gold Magnet', slotType: 'GOLD', rarity: 'rare', level: 1,
        description: '+50% Gold', unlocked: true,
        baseCost: 800, baseValue: 50
    },

    {
        id: 'util-repair', name: 'Auto Repair', slotType: 'UTILITY', rarity: 'common', level: 1,
        description: 'Restores Health', unlocked: true, // Unlocked for testing
        baseCost: 300
    },
    {
        id: 'util-overclock', name: 'Overclocker', slotType: 'UTILITY', rarity: 'rare', level: 1,
        description: '2x Speed for 10s', unlocked: true, // Unlocked for testing
        baseCost: 1000, baseValue: 2
    },
];
