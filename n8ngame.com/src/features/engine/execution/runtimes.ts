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
        // In a real app, node.data.key would hold the variable name
        return {
            count: (context.variables.count || 0) + 1
        };
    }
};

export function getGasCost(kind: string): number {
    switch (kind) {
        case 'action': return 10;
        case 'variable': return 1;
        case 'trigger': return 0;
        default: return 1;
    }
}
