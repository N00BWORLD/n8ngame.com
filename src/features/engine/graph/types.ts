export type NodeKind = 'trigger' | 'action' | 'variable';

export interface EngineNode {
    id: string;
    kind: NodeKind;
    // config: Record<string, any>; // Reserved for future use
}

export interface EngineEdge {
    id: string;
    source: string;
    target: string;
}

export interface Blueprint {
    nodes: EngineNode[];
    edges: EngineEdge[];
}

export interface EngineError {
    code: string;
    message: string;
    context?: any;
}

export interface TopoResult {
    success: boolean;
    order?: string[]; // Node IDs in execution order
    error?: EngineError;
}
