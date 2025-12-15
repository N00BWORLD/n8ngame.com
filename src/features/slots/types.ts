export type SlotType = 'TRIGGER' | 'DAMAGE' | 'GOLD' | 'UTILITY';

export interface SlotItem {
    id: string;
    name: string;
    slotType: SlotType;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    level: number;
    description: string;
    unlocked: boolean;
    // Base Stats for Upgrades
    baseCost: number;       // Initial upgrade cost
    baseValue?: number;     // DPS or Gold%
    baseInterval?: number;  // For triggers (ms)
}

// Alias for the requirement
export type StationItem = SlotItem;
