import { Blueprint, TopoResult } from './types';

export function analyzeGraph(blueprint: Blueprint): TopoResult {
    const { nodes, edges } = blueprint;

    // 1. Build Adjacency List & In-Degree Map
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach(node => {
        adj.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    // Build Graph
    edges.forEach(edge => {
        // Ignore edges connecting to non-existent nodes (safety check)
        if (!adj.has(edge.source) || !adj.has(edge.target)) return;

        adj.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // 2. Kahn's Algorithm for Topological Sort
    const queue: string[] = [];
    const order: string[] = [];

    // Find all nodes with 0 in-degree
    inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id);
    });

    while (queue.length > 0) {
        const u = queue.shift()!;
        order.push(u);

        const neighbors = adj.get(u) || [];
        for (const v of neighbors) {
            inDegree.set(v, (inDegree.get(v) || 0) - 1);
            if (inDegree.get(v) === 0) {
                queue.push(v);
            }
        }
    }

    // 3. Cycle Detection
    // If we haven't visited all nodes, there is a cycle
    if (order.length !== nodes.length) {
        // Find nodes involved in the cycle (remaining nodes with in-degree > 0)
        const cycleNodes: string[] = [];
        inDegree.forEach((degree, id) => {
            if (degree > 0) cycleNodes.push(id);
        });

        return {
            success: false,
            error: {
                code: 'CYCLE_DETECTED',
                message: 'Cycle detected in the graph',
                context: { nodeIds: cycleNodes }
            }
        };
    }

    // 4. Trigger Validation
    // Check if at least one Trigger node exists
    const hasTrigger = nodes.some(n => n.kind === 'trigger');
    if (!hasTrigger) {
        return {
            success: false,
            error: {
                code: 'NO_TRIGGER',
                message: 'No Trigger node found',
            }
        };
    }

    return {
        success: true,
        order,
    };
}

