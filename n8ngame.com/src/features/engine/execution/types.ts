import { EngineNode } from '../graph/types';

export interface ExecutionLog {
    nodeId: string;
    nodeKind: string;
    timestamp: number;
    inputs?: any;
    outputs?: any;
    gasUsed: number;
    error?: string;
}

export interface ExecutionContext {
    variables: Record<string, any>; // Global execution state
    logs: ExecutionLog[];
    gasRemaining: number;
    status: 'running' | 'completed' | 'failed' | 'out_of_gas';
}

export interface ExecutionConfig {
    maxGas: number;
    initialVariables?: Record<string, any>;
}

export type NodeRuntime = {
    execute: (
        node: EngineNode,
        context: ExecutionContext
    ) => Promise<Record<string, any>>; // Returns outputs
};
