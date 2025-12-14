import { Blueprint } from '../graph/types';
import { analyzeGraph } from '../graph/analyzer';
import { ExecutionConfig, ExecutionContext, NodeRuntime } from './types';
import { triggerRuntime, actionRuntime, variableRuntime, getGasCost } from './runtimes';

// Registry for Node Runtimes
const runtimeRegistry: Record<string, NodeRuntime> = {
    'trigger': triggerRuntime,
    'action': actionRuntime,
    'variable': variableRuntime,
};

export function registerRuntime(kind: string, runtime: NodeRuntime) {
    runtimeRegistry[kind] = runtime;
}

export async function executeBlueprint(
    blueprint: Blueprint,
    config: ExecutionConfig
): Promise<ExecutionContext> {
    // 1. Analyze Graph
    const analysis = analyzeGraph(blueprint);

    // Initialize Context
    const context: ExecutionContext = {
        variables: { ...config.initialVariables },
        logs: [],
        gasRemaining: config.maxGas ?? 100, // Default to 100 if not provided
        status: 'running',
    };

    if (!analysis.success || !analysis.order) {
        context.status = 'failed';
        context.logs.push({
            nodeId: 'system',
            nodeKind: 'system',
            timestamp: Date.now(),
            gasUsed: 0,
            error: analysis.error?.message || 'Graph analysis failed',
        });
        return context;
    }

    // 2. Execution Loop
    for (const nodeId of analysis.order) {
        // Gas Check
        if (context.gasRemaining <= 0) {
            context.status = 'out_of_gas';
            break;
        }

        const node = blueprint.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        const runtime = runtimeRegistry[node.kind];
        if (!runtime) {
            context.status = 'failed';
            context.logs.push({
                nodeId: node.id,
                nodeKind: node.kind,
                timestamp: Date.now(),
                gasUsed: 0,
                error: `No runtime found for node kind: ${node.kind}`,
            });
            break;
        }

        try {
            // Check Gas Cost BEFORE execution? Or After? 
            // Usually we might check if we have enough gas to START.
            // But requirement says "Gas Budget exceeded -> Stop".

            const gasCost = getGasCost(node.kind);
            if (context.gasRemaining < gasCost) {
                context.status = 'out_of_gas';
                // Log the attempt failure
                context.logs.push({
                    nodeId: node.id,
                    nodeKind: node.kind,
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `Out of gas. Required: ${gasCost}, Remaining: ${context.gasRemaining}`
                });
                break;
            }

            // Execute Node
            // const startTime = Date.now();
            const outputs = await runtime.execute(node, context);
            // const duration = Date.now() - startTime;

            // Deduct Gas
            context.gasRemaining -= gasCost;

            // Log Success
            context.logs.push({
                nodeId: node.id,
                nodeKind: node.kind,
                timestamp: Date.now(),
                inputs: {},
                outputs,
                gasUsed: gasCost,
            });

            // Update Variables
            Object.assign(context.variables, outputs);

        } catch (error: any) {
            context.status = 'failed';
            context.logs.push({
                nodeId: node.id,
                nodeKind: node.kind,
                timestamp: Date.now(),
                gasUsed: 0,
                error: error.message || 'Unknown execution error',
            });
            break;
        }
    }

    if (context.status === 'running') {
        context.status = 'completed';
    }

    return context;
}
