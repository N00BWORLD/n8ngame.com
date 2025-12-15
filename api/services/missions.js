
const MISSIONS = [
    {
        id: 1,
        title: "First Spark",
        desc: "Execute any blueprint successfully",
        rewardItems: [{ itemType: 'node_fragment', qty: 10, level: 1 }],
        check: (bp, ok) => ok
    },
    {
        id: 2,
        title: "The Linker",
        desc: "Connect at least 2 nodes and execute",
        rewardItems: [{ itemType: 'node_fragment', qty: 20, level: 1 }],
        check: (bp, ok) => ok && (bp.edges || []).length >= 1
    },
    {
        id: 3,
        title: "Logic Chain",
        desc: "Create a chain with 3+ nodes and 2+ edges",
        rewardItems: [{ itemType: 'logic_circuit', qty: 1, level: 1 }],
        // MVP logic: just count
        check: (bp, ok) => ok && (bp.nodes || []).length >= 3 && (bp.edges || []).length >= 2
    },
    {
        id: 4,
        title: "Variable Hunter",
        desc: "Use a Variable node",
        rewardItems: [{ itemType: 'logic_circuit', qty: 2, level: 1 }, { itemType: 'node_fragment', qty: 30, level: 1 }],
        check: (bp, ok) => {
            if (!ok) return false;
            return (bp.nodes || []).some(n =>
                n.type === 'VariableNode' || n.type === 'variable' || n.data?.kind === 'variable'
            );
        }
    },
    {
        id: 5,
        title: "Complex System",
        desc: "Execute a graph with 5+ nodes and 5+ edges",
        rewardItems: [{ itemType: 'pure_core', qty: 1, level: 1 }],
        check: (bp, ok) => ok && (bp.nodes || []).length >= 5 && (bp.edges || []).length >= 5
    }
];

export async function evaluateMissions({ userId, blueprint, n8nResponse, inventoryBadges }) {
    const isOk = n8nResponse && n8nResponse.ok === true;
    const existingBadgeIds = new Set(inventoryBadges.map(b => {
        // badge_mission_1 -> 1
        const parts = b.item_type.split('_');
        return parseInt(parts[parts.length - 1], 10);
    }));

    const resultMissions = [];
    const newRewards = [];
    const newlyCompletedIds = [];

    // Sequential Check
    for (const mission of MISSIONS) {
        const hasBadge = existingBadgeIds.has(mission.id);

        let status = 'locked';

        // M1 is always available if not completed
        if (mission.id === 1) {
            status = hasBadge ? 'completed' : 'active';
        } else {
            // Check previous mission badge for unlock
            const prevCompleted = existingBadgeIds.has(mission.id - 1);
            if (hasBadge) {
                status = 'completed';
            } else if (prevCompleted) {
                status = 'active';
            } else {
                status = 'locked';
            }
        }

        let justCompleted = false;

        // If Active, Check Success Logic
        if (status === 'active' && isOk) {
            // Pass blueprint (assumes react-flow structure: nodes, edges)
            if (mission.check(blueprint, isOk)) {
                status = 'completed';
                justCompleted = true;
                newlyCompletedIds.push(mission.id);

                // Add Mission Rewards
                newRewards.push(...mission.rewardItems);
                // Add Badge Reward
                newRewards.push({ itemType: `badge_mission_${mission.id}`, qty: 1, level: 1 });
            }
        }

        resultMissions.push({
            id: mission.id,
            title: mission.title,
            desc: mission.desc,
            status,
            justCompleted
        });
    }

    return {
        missions: resultMissions,
        newRewards // Includes badges and items
    };
}
