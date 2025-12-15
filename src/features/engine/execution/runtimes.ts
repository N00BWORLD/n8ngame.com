import { NodeRuntime } from './types';

export const triggerRuntime: NodeRuntime = {
    execute: async (_node, _context) => {
        return {
            startedAt: Date.now(),
            triggeredBy: 'manual'
        };
    }
};

export const actionRuntime: NodeRuntime = {
    execute: async (_node, _context) => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
            processed: true,
            timestamp: Date.now()
        };
    }
};

export const variableRuntime: NodeRuntime = {
    execute: async (_node, context) => {
        // Determine variable name/value from node data (mocked for now)
        return {
            count: (context.variables.count || 0) + 1
        };
    }
};

// Mission 13: New Nodes
export const generatorRuntime: NodeRuntime = {
    execute: async (_node, context) => {
        const generated = 10 * context.multiplier;
        context.creditsDelta += generated;
        context.multiplier = 1; // Reset multiplier after use
        return { generated };
    }
};

export const boosterRuntime: NodeRuntime = {
    execute: async (_node, context) => {
        context.multiplier = 1.5;
        return { boosted: true };
    }
};

export const sinkRuntime: NodeRuntime = {
    execute: async (_node, context) => {
        const cost = 5;
        context.creditsDelta -= cost;
        return { consumed: cost };
    }
};

export function getGasCost(kind: string): number {
    switch (kind) {
        case 'action': return 10;
        case 'variable': return 1;
        case 'trigger': return 0;
        case 'generator': return 5;
        case 'booster': return 2;
        case 'sink': return 1;
        default: return 1;
    }
}
