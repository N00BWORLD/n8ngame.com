import { SlotItem } from './types';

export interface LoadoutStats {
    dps: number;
    goldBonusPct: number;
    intervalSec: number;
}

/**
 * Calculate upgrade cost: ceil(baseCost * 1.45^level)
 * Defaults: Trigger 50, Boost 80, Output 60
 */
export function getUpgradeCost(item: SlotItem): number {
    let baseCost = item.baseCost;
    if (!baseCost) {
        switch (item.slotType) {
            case 'TRIGGER': baseCost = 50; break;
            case 'BOOST': baseCost = 80; break;
            case 'OUTPUT': baseCost = 60; break;
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
    const baseVal = item.baseValue || 0;

    switch (item.effectType) {
        case 'interval':
            // baseInterval - 30s per level
            const baseInterval = item.baseInterval || 600;
            const intervalSec = Math.max(60, baseInterval - (level * 30));
            return { intervalSec };

        case 'dps_flat':
            // DPS * 1.2^level
            const dps = Math.floor((baseVal || 1) * Math.pow(1.20, level));
            return { dps };

        case 'gold_pct':
            // base + (level * 5)
            const goldBonusPct = baseVal + (level * 5);
            return { goldBonusPct };

        case 'dps_mult':
            // base + (level * 2)
            const dpsBoostPct = baseVal + (level * 2);
            return { dpsBoostPct };

        case 'none':
            if (item.slotType === 'TRIGGER') return { intervalSec: 999999 };
            return {};

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
    let intervalSec = 600;
    let dpsMultiplier = 1;

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
            if (stats.intervalSec > 0 && stats.intervalSec < 999999) {
                // Take specific interval if multiple? Assuming only 1 trigger.
                intervalSec = stats.intervalSec;
                hasTrigger = true;
            } else if (stats.intervalSec >= 999999) {
                intervalSec = 999999;
                hasTrigger = true;
            }
        }
    });

    if (!hasDamage && dps === 0) dps = 0; // Don't force 1 if user equipped nothing. Base loadout from blueprint handles base. 
    // Wait, previous logic forced 1. 26-B logic adds blueprint dps + slot dps.
    // So 0 is fine.

    // Apply Multiplier
    dps = Math.floor(dps * dpsMultiplier);

    // If trigger missing, default 600
    if (!hasTrigger) intervalSec = 600;

    return {
        dps,
        goldBonusPct,
        intervalSec
    };
}

