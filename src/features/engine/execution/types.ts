import { EngineNode } from '../graph/types';

export interface ExecutionLog {
    nodeId: string;
    nodeKind: string;
    /** Timestamp of the Tick execution */
    timestamp: number;
    /** Data Token received as input */
    inputs?: any;
    /** Data Token produced as output */
    outputs?: any;
    /** Amount of Execution Budget (Gas) consumed by this Tick */
    gasUsed: number;
    error?: string;
}

export interface ExecutionContext {
    variables: Record<string, any>; // Global execution state
    logs: ExecutionLog[];
    /** Current remaining Execution Budget */
    gasRemaining: number;
    status: 'running' | 'completed' | 'failed' | 'out_of_gas';
}

export interface ExecutionConfig {
    /** 
     * The Execution Budget (in 'Gas' units) for this run.
     * Prevents infinite loops.
     */
    maxGas: number;
    initialVariables?: Record<string, any>;
}

export type NodeRuntime = {
    execute: (
        node: EngineNode,
        context: ExecutionContext
    ) => Promise<Record<string, any>>; // Returns outputs
};

/**
 * Standardized Engine Result Contract
 */
export interface EngineResult {
    logs: ExecutionLog[];
    finalState: Record<string, any>;
    error?: string;
}

export const DEFAULT_ENGINE_CONFIG: ExecutionConfig = {
    maxGas: 100,
    initialVariables: {},
};
