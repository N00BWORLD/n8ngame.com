import { SlotItem } from './types';

export interface LoadoutStats {
    dps: number;
    goldBonusPct: number;
    intervalSec: number;
}

/**
 * Calculate upgrade cost: ceil(baseCost * 1.45^level)
 * Defaults: Trigger 50, Damage 60, Gold 55, Utility 80
 */
export function getUpgradeCost(item: SlotItem): number {
    let baseCost = item.baseCost;
    if (!baseCost) {
        switch (item.slotType) {
            case 'TRIGGER': baseCost = 50; break;
            case 'DAMAGE': baseCost = 60; break;
            case 'GOLD': baseCost = 55; break;
            case 'UTILITY': baseCost = 80; break;
            default: baseCost = 50;
        }
    }
    return Math.ceil(baseCost * Math.pow(1.45, item.level));
}

/**
 * Calculate item stats based on level.
 */
export function getItemStats(item: SlotItem) {
    const level = item.level;

    // Base Value from Item or reasonable defaults if missing
    // Note: catalog.ts should have these baseValues.
    const baseVal = item.baseValue || 0;

    switch (item.slotType) {
        case 'TRIGGER':
            // "intervalSec = max(60, baseInterval - level*30)"
            // baseValue here is assumed to be the Interval in Seconds (e.g. 600) based on Spec 22-B.
            // If item.baseValue is 600.
            const baseInterval = baseVal || 600;
            const intervalSec = Math.max(60, baseInterval - (level * 30));
            return { intervalSec };

        case 'DAMAGE':
            // "value = baseValue * 1.20^level"
            const dps = Math.floor((baseVal || 1) * Math.pow(1.20, level));
            return { dps };

        case 'GOLD':
            // "value = baseValue + (level * 5)"
            const goldBonusPct = baseVal + (level * 5);
            return { goldBonusPct };

        case 'UTILITY':
            // Spec 25-C: Utility as DPS Boost (+%)
            const dpsBoostPct = baseVal + (level * 2); // Base + 2% per level?
            return { dpsBoostPct };

        default:
            return {};
    }
}

/**
 * Compute total loadout stats from equipped items.
 */
export function computeLoadout(equippedItems: (SlotItem | undefined)[]): LoadoutStats {
    let dps = 0;
    let goldBonusPct = 0;
    let intervalSec = 600; // Base default 600s
    let dpsMultiplier = 1; // Base multiplier

    let hasTrigger = false;
    let hasDamage = false;

    equippedItems.forEach(item => {
        if (!item) return;
        const stats = getItemStats(item);

        if (stats.dps !== undefined) {
            dps += stats.dps;
            hasDamage = true;
        }
        if (stats.goldBonusPct !== undefined) {
            goldBonusPct += stats.goldBonusPct;
        }
        if (stats.dpsBoostPct !== undefined) {
            dpsMultiplier += (stats.dpsBoostPct / 100);
        }
        if (stats.intervalSec !== undefined) {
            // "Manual Run" might return 0
            if (stats.intervalSec > 0) {
                intervalSec = stats.intervalSec;
                hasTrigger = true;
            } else {
                // Manual only (interval 0 or very high?)
                // If 0, we might strictly disable auto-run in useAutoRun.
                // For now, let's keep 600 but rely on another flag, OR set specific value.
                // If interval is 0, let's treat as Manual (very long interval)
                intervalSec = 999999;
                hasTrigger = true;
            }
        }
    });

    // Defaults per Spec
    if (!hasDamage && dps === 0) dps = 1;
    // Apply Multiplier
    dps = Math.floor(dps * dpsMultiplier);

    if (!hasTrigger) intervalSec = 600;

    // Defaults per Spec 22-B
    if (!hasDamage && dps === 0) dps = 1;
    if (!hasTrigger) intervalSec = 600;

    return {
        dps,
        goldBonusPct,
        intervalSec
    };
}
