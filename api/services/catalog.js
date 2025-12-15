
// Minimal Node Catalog for MVP Shop
export const NODE_CATALOG = [
    // Common
    { id: 'n_trigger_1', rarity: 'common', type: 'trigger' },
    { id: 'n_variable_1', rarity: 'common', type: 'variable' },

    // Rare
    { id: 'n_action_1', rarity: 'rare', type: 'action' },

    // Legendary (Hidden/Bonus for MVP)
    { id: 'n_special_1', rarity: 'legendary', type: 'action' }
];

export const SHOP_ITEMS = {
    basic_pack: {
        sku: 'basic_pack',
        title: 'Basic Node Pack',
        price: 100,
        odds: { common: 0.9, rare: 0.1, legendary: 0 }
    },
    advanced_pack: {
        sku: 'advanced_pack',
        title: 'Advanced Node Pack',
        price: 300,
        odds: { common: 0.6, rare: 0.35, legendary: 0.05 }
    }
};
