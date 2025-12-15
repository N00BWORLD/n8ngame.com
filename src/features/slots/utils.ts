import { SlotItem } from './types';

export interface LoadoutStats {
    dps: number;
    goldBonusPct: number;
    intervalSec: number;
}

/**
 * Calculate upgrade cost: ceil(baseCost * 1.45^level)
 */
export function getUpgradeCost(item: SlotItem): number {
    return Math.ceil(item.baseCost * Math.pow(1.45, item.level));
}

/**
 * Calculate item stats based on level.
 */
export function getItemStats(item: SlotItem) {
    const level = item.level;

    // Default values if undefined
    const baseVal = item.baseValue || 0;
    const baseInt = item.baseInterval || 10000;

    switch (item.slotType) {
        case 'TRIGGER':
            // "intervalSec = max(60, baseInterval - level*30)"
            // baseInterval is 600 (= 6.0s). 
            // Level 1: 600 - 30 = 570 (5.7s)
            // Level 10: 600 - 300 = 300 (3.0s)
            // Min 60 (= 0.6s)

            const rawVal = Math.max(60, baseInt - (level * 30));

            return {
                intervalMs: rawVal * 10, // 600 -> 6000ms
                intervalSec: rawVal / 100 // 600 -> 6.0s
            };

        case 'DAMAGE':
            // "value = baseValue * 1.20^level"
            return {
                dps: Math.floor(baseVal * Math.pow(1.20, level))
            };

        case 'GOLD':
            // "value = baseValue + (level * 5)"
            return {
                goldBonusPct: baseVal + (level * 5)
            };

        default:
            return {};
    }
}

/**
 * Compute total loadout stats from equipped items.
 */
export function computeLoadout(equippedItems: (SlotItem | undefined)[]): LoadoutStats {
    let dps = 0; // Base DPS starts at 0 for slots (additive)
    let goldBonusPct = 0;
    let intervalMs = 600000; // Base 600s (10 min) if no timer

    equippedItems.forEach(item => {
        if (!item) return;
        const stats = getItemStats(item);

        if (stats.dps) dps += stats.dps;
        if (stats.goldBonusPct) goldBonusPct += stats.goldBonusPct;
        if (stats.intervalMs) intervalMs = stats.intervalMs;
    });

    // Defaults per Spec 22-B
    // "장착 없으면 dps 기본 1"
    const finalDps = dps > 0 ? dps : 1;

    // "장착 없으면 intervalSec 기본 600"
    // intervalMs was initialized to 600000 (600s * 1000)
    // Wait, initial logic: let intervalMs = 600000;
    // But let's check the loop above.
    // If no trigger equipped, intervalMs remains default.

    return {
        dps: finalDps,
        goldBonusPct,
        intervalSec: intervalMs / 1000
    };
}
