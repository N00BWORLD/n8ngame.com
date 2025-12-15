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
            // No value change for now
            return {};

        default:
            return {};
    }
}

/**
 * Compute total loadout stats from equipped items.
 */
export function computeLoadout(equippedItems: (SlotItem | undefined)[]): LoadoutStats {
    let dps = 0; // Base DPS starts at 0 for slots (additive to Node DPS? No, spec says "Basic 1")
    // Wait, computeLoadout logic:
    // If we have damage item, use its dps. If not, default is 1.
    // If we have multiple damage items (unlikely with slots), sum them.

    let goldBonusPct = 0;
    let intervalSec = 600; // Base default 600s

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
        if (stats.intervalSec !== undefined) {
            // If multiple triggers, take min? or max? or last?
            // "Slots" implies 1 per type usually.
            // Let's assume replacement.
            intervalSec = stats.intervalSec;
            hasTrigger = true;
        }
    });

    // Defaults per Spec 22-B
    if (!hasDamage && dps === 0) dps = 1;
    if (!hasTrigger) intervalSec = 600;

    return {
        dps,
        goldBonusPct,
        intervalSec
    };
}
