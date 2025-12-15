export type SlotType = 'TRIGGER' | 'BOOST' | 'OUTPUT';

export type SlotEffectType = 'dps_flat' | 'dps_mult' | 'gold_pct' | 'interval' | 'none';

export interface SlotItem {
    id: string;
    name: string;
    slotType: SlotType;
    effectType: SlotEffectType;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    level: number;
    description: string;
    unlocked: boolean;

    // Costs & Stats
    baseCost: number;
    baseValue: number; // The magnitude of the effect (e.g., 10 for 10%, 1 for 1 DPS)
    baseInterval?: number; // Specific for Trigger (Auto tick interval in ms or sec)
}

// Alias for the requirement
export type StationItem = SlotItem;
