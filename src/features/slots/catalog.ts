import { SlotItem } from './types';

export const CATALOG: SlotItem[] = [
    // TRIGGERS
    {
        id: 'trigger-manual', name: 'Manual Run', slotType: 'TRIGGER', effectType: 'none', rarity: 'common', level: 1,
        description: 'No auto-run. Manual only.', unlocked: true,
        baseCost: 0, baseValue: 0, baseInterval: 0
    },
    {
        id: 'trigger-auto-10m', name: 'AutoTick (10m)', slotType: 'TRIGGER', effectType: 'interval', rarity: 'common', level: 1,
        description: 'Runs every 10 minutes', unlocked: true,
        baseCost: 100, baseValue: 0, baseInterval: 600
    },

    // OUTPUTS (Yields)
    {
        id: 'out-miner', name: 'Miner', slotType: 'OUTPUT', effectType: 'dps_flat', rarity: 'common', level: 1,
        description: 'Basic mining operation (+1 Base DPS)', unlocked: true,
        baseCost: 150, baseValue: 1
    },
    {
        id: 'out-boss-breaker', name: 'Boss Breaker', slotType: 'OUTPUT', effectType: 'dps_flat', rarity: 'rare', level: 1,
        description: 'High damage mining (+5 Base DPS)', unlocked: true,
        baseCost: 600, baseValue: 5
    },
    {
        id: 'mod-gold-bonus', name: 'Gold Bonus', slotType: 'OUTPUT', effectType: 'gold_pct', rarity: 'common', level: 1,
        description: '+10% Gold Yield', unlocked: true,
        baseCost: 200, baseValue: 10
    },

    // BOOSTS (Modifiers)
    {
        id: 'mod-dps-boost', name: 'DPS Boost', slotType: 'BOOST', effectType: 'dps_mult', rarity: 'rare', level: 1,
        description: '+20% DPS Multiplier', unlocked: true,
        baseCost: 500, baseValue: 20
    }
];
