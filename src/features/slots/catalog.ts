import { SlotItem } from './types';

export const CATALOG: SlotItem[] = [
    // TRIGGERS
    {
        id: 'trigger-manual', name: 'Manual Run', slotType: 'TRIGGER', rarity: 'common', level: 1,
        description: 'No auto-run. Manual only.', unlocked: true,
        baseCost: 0, baseInterval: 0 // 0 means no auto-tick
    },
    {
        id: 'trigger-auto-10m', name: 'AutoTick (10m)', slotType: 'TRIGGER', rarity: 'common', level: 1,
        description: 'Runs every 10 minutes', unlocked: true,
        baseCost: 100, baseInterval: 600
    },

    // OUTPUTS (DAMAGE)
    {
        id: 'out-miner', name: 'Miner', slotType: 'DAMAGE', rarity: 'common', level: 1,
        description: 'Basic mining operation', unlocked: true,
        baseCost: 150, baseValue: 1 // 1 DPS (Base)
    },
    {
        id: 'out-boss-breaker', name: 'Boss Breaker', slotType: 'DAMAGE', rarity: 'rare', level: 1,
        description: 'High damage mining', unlocked: true,
        baseCost: 600, baseValue: 5 // Higher Base DPS
    },

    // MODS (GOLD)
    {
        id: 'mod-gold-bonus', name: 'Gold Bonus', slotType: 'GOLD', rarity: 'common', level: 1,
        description: '+10% Gold Yield', unlocked: true,
        baseCost: 200, baseValue: 10
    },

    // MODS (UTILITY - Using as DPS Boost for this mission as requested "Mod: DPS Boost")
    // Wait, SlotType 'UTILITY' doesn't currently support DPS boost in utils.ts.
    // I need to update utils.ts if I want UTILITY to give DPS boost, OR map DPS Boost to DAMAGE?
    // User requested: "Mod: DPS Boost(+% dps), Gold Bonus(+% goldBonus)".
    // "Process 1, Process 2" slots.
    // If I use UTILITY for DPS Boost, I need to update getItemStats in utils.ts.
    {
        id: 'mod-dps-boost', name: 'DPS Boost', slotType: 'UTILITY', rarity: 'rare', level: 1,
        description: '+20% DPS', unlocked: true,
        baseCost: 500, baseValue: 20
    }
];
