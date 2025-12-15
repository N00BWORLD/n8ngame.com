import { AppNode } from "@/features/editor/types";
import { BALANCE_CONFIG } from "@/config/balance";
import { BigNum, fromNumber, add } from "@/lib/bigNum";

export interface MiningLoadout {
    dps: BigNum;
    goldBonusPct: number; // Percentage can stay number
    critChancePct: number; // Percentage can stay number
}

export function compileBlueprintToLoadout(
    nodes: AppNode[],
    nodeLimitLevel: number = 0
): MiningLoadout {
    // 1. Calculate Max Nodes based on Upgrades (or defaults)
    const maxNodes = BALANCE_CONFIG.BASE_MAX_NODES + (nodeLimitLevel * BALANCE_CONFIG.NODE_LIMIT_INC);

    // 2. Enforce Limit (Slice active nodes)
    const activeNodes = nodes.slice(0, maxNodes);

    const loadout: MiningLoadout = {
        dps: fromNumber(0),
        goldBonusPct: 0,
        critChancePct: 0
    };

    // 3. Aggregate Stats
    activeNodes.forEach(node => {
        switch (node.type) {
            case 'action':
                // Action Node = DPS source (+5)
                loadout.dps = add(loadout.dps, fromNumber(5));
                break;
            case 'variable':
                // Variable Node = Gold Bonus
                loadout.goldBonusPct += 5;
                break;
            case 'trigger':
                // Trigger Node = Crit Chance
                loadout.critChancePct += 5;
                break;
        }
    });

    return loadout;
}
