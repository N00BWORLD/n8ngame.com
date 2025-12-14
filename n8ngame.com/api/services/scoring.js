export function calculateScore(blueprint, n8nResponse, justCompletedCount = 0) {
    const nodesLen = (blueprint.nodes || []).length;
    const edges = blueprint.edges || blueprint.connections || [];
    const edgesLen = edges.length;

    // Gas Used (simulated) - Ensure safely accessed
    const gasUsed = (n8nResponse.result && n8nResponse.result.simulatedGasUsed) ? n8nResponse.result.simulatedGasUsed : 0;

    const base = 100;
    const nodesScore = nodesLen * 10;
    const edgesScore = edgesLen * 15;

    // Check Success
    const isOk = n8nResponse.ok === true || n8nResponse.status === 'success';

    let finalBonus = 0;
    let finalGasPenalty = 0;
    let total = 0;

    if (isOk) {
        finalBonus = justCompletedCount * 25;
        finalGasPenalty = gasUsed;
        total = base + nodesScore + edgesScore + finalBonus - finalGasPenalty;
    } else {
        // Requirement C: ok=false => bonus=0, total = base + nodesScore + edgesScore
        total = base + nodesScore + edgesScore;
    }

    // Rank
    let rank = 'C';
    if (total >= 250) rank = 'S';
    else if (total >= 200) rank = 'A';
    else if (total >= 150) rank = 'B';

    return {
        score: total,
        rank,
        scoreBreakdown: {
            base,
            nodes: nodesScore,
            edges: edgesScore,
            gasPenalty: finalGasPenalty,
            bonus: finalBonus,
            total
        }
    };
}
