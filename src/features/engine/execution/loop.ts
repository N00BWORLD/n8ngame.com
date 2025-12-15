import { Blueprint } from '../graph/types';
import { analyzeGraph } from '../graph/analyzer';
import { DEFAULT_ENGINE_CONFIG, EngineResult, ExecutionConfig, ExecutionContext, NodeRuntime } from './types';
import { triggerRuntime, actionRuntime, variableRuntime, generatorRuntime, boosterRuntime, sinkRuntime, getGasCost } from './runtimes';

// Registry for Node Runtimes
const runtimeRegistry: Record<string, NodeRuntime> = {
    'trigger': triggerRuntime,
    'action': actionRuntime,
    'variable': variableRuntime,
    'generator': generatorRuntime,
    'booster': boosterRuntime,
    'sink': sinkRuntime,
};

export function registerRuntime(kind: string, runtime: NodeRuntime) {
    runtimeRegistry[kind] = runtime;
}

export async function executeBlueprint(
    blueprint: Blueprint,
    config: ExecutionConfig = DEFAULT_ENGINE_CONFIG
): Promise<EngineResult> {
    // 1. Analyze Graph
    const analysis = analyzeGraph(blueprint);

    // Initialize Context
    const context: ExecutionContext = {
        variables: { ...config.initialVariables },
        logs: [],
        gasRemaining: config.maxGas ?? DEFAULT_ENGINE_CONFIG.maxGas,
        status: 'running',
        creditsDelta: 0,
        multiplier: 1,
    };

    if (!analysis.success || !analysis.order) {
        return {
            logs: [{
                nodeId: 'system',
                nodeKind: 'system',
                timestamp: Date.now(),
                gasUsed: 0,
                error: analysis.error?.message || 'Graph analysis failed',
            }],
            finalState: context.variables,
            error: analysis.error?.message || 'Graph analysis failed'
        };
    }

    let executionError: string | undefined;

    // 2. Execution Loop
    for (const nodeId of analysis.order) {
        // Gas Check
        if (context.gasRemaining <= 0) {
            context.status = 'out_of_gas';
            executionError = 'Out of gas';
            break;
        }

        const node = blueprint.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        const runtime = runtimeRegistry[node.kind];
        if (!runtime) {
            context.status = 'failed';
            executionError = `No runtime found for node kind: ${node.kind}`;
            context.logs.push({
                nodeId: node.id,
                nodeKind: node.kind,
                timestamp: Date.now(),
                gasUsed: 0,
                error: executionError,
            });
            break;
        }

        try {
            const gasCost = getGasCost(node.kind);
            if (context.gasRemaining < gasCost) {
                context.status = 'out_of_gas';
                executionError = `Out of gas. Required: ${gasCost}, Remaining: ${context.gasRemaining}`;
                context.logs.push({
                    nodeId: node.id,
                    nodeKind: node.kind,
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: executionError
                });
                break;
            }

            // Execute Node
            const outputs = await runtime.execute(node, context);

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
            executionError = error.message || 'Unknown execution error';
            context.logs.push({
                nodeId: node.id,
                nodeKind: node.kind,
                timestamp: Date.now(),
                gasUsed: 0,
                error: executionError,
            });
            break;
        }
    }

    return {
        logs: context.logs,
        finalState: context.variables,
        error: executionError,
        creditsDelta: context.creditsDelta
    };
}
