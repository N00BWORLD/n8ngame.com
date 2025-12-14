import { create } from 'zustand';
import {
    Edge,
    NodeChange,
    EdgeChange,
    Connection,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import { AppNode } from '@/features/editor/types';
import { executeBlueprint } from '@/features/engine/execution/loop';
import { executeRemote } from '@/features/engine/remote/RemoteExecutor';
import { Blueprint } from '@/features/engine/graph/types';
import { ExecutionLog, DEFAULT_ENGINE_CONFIG } from '@/features/engine/execution/types';
import { ProjectBlueprint, CURRENT_BLUEPRINT_VERSION } from '@/features/storage/types';
import { Viewport } from '@xyflow/react';
import { deriveConnectionState } from '@/features/engine/connectionLogic';

interface FlowState {
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: AppNode) => void;
    setNodes: (nodes: AppNode[]) => void;

    // Execution State
    executionMode: 'local' | 'remote';
    setExecutionMode: (mode: 'local' | 'remote') => void;
    isRunning: boolean;
    executionLogs: ExecutionLog[];
    runGraph: () => Promise<void>;
    clearLogs: () => void;

    // Tap-to-Connect State
    pendingConnection: { nodeId: string; handleId: string | null; type: 'source' | 'target' } | null;
    onHandleClick: (nodeId: string, handleId: string | null, type: 'source' | 'target') => void;
    onPaneClick: () => void;

    // Storage Actions
    toBlueprint: () => ProjectBlueprint;
    loadBlueprint: (blueprint: ProjectBlueprint) => void;
    setViewport: (viewport: Viewport) => void;

    // Inventory State (Mission 11-E)
    isInventoryOpen: boolean;
    setInventoryOpen: (isOpen: boolean) => void;
    inventoryTrigger: number; // Increment to signal refresh
    refreshInventory: () => void;

    // Mission State (Mission 11-F)
    isMissionOpen: boolean;
    setMissionOpen: (isOpen: boolean) => void;
    missions: Array<{
        id: number;
        title: string;
        desc: string;
        status: 'locked' | 'active' | 'completed';
        justCompleted?: boolean;
    }>;
    setMissions: (missions: any[]) => void;

    // Help State (Mission 11-H)
    isHelpOpen: boolean;
    setHelpOpen: (isOpen: boolean) => void;

    // Result State (Mission 12-A)
    isResultOpen: boolean;
    setResultOpen: (isOpen: boolean) => void;
    lastExecutionResult: any; // Using any for MVP flexibility as per requirement
    setLastExecutionResult: (result: any) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    executionMode: 'local',
    setExecutionMode: (mode) => set({ executionMode: mode }),
    isRunning: false,
    executionLogs: [],
    pendingConnection: null,

    // Inventory Defaults
    isInventoryOpen: false,
    setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
    inventoryTrigger: 0,
    refreshInventory: () => set((state) => ({ inventoryTrigger: state.inventoryTrigger + 1 })),

    // Mission Defaults
    isMissionOpen: false,
    setMissionOpen: (isOpen) => set({ isMissionOpen: isOpen }),
    missions: [],
    setMissions: (missions) => set({ missions }),

    // Help Defaults
    isHelpOpen: false,
    setHelpOpen: (isOpen) => set({ isHelpOpen: isOpen }),

    // Result Card State (Mission 12-A)
    isResultOpen: false,
    setResultOpen: (isOpen) => set({ isResultOpen: isOpen }),
    lastExecutionResult: null,
    setLastExecutionResult: (result) => set({ lastExecutionResult: result }),


    onPaneClick: () => {
        set({ pendingConnection: null });
    },

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection) => {
        set({
            edges: addEdge({ ...connection, animated: true }, get().edges),
            pendingConnection: null, // Reset on drag connect too
        });
    },
    onHandleClick: (nodeId, handleId, type) => {
        const { pendingConnection, edges } = get();
        const action = { nodeId, handleId, type };

        // Use pure logic for state transition
        const result = deriveConnectionState(pendingConnection, action);

        if (result.status === 'pending') {
            set({ pendingConnection: result.payload });
        } else if (result.status === 'cancelled') {
            set({ pendingConnection: null });
        } else if (result.status === 'completed') {
            const { source, target } = result.payload;
            const connection = {
                source: source.nodeId,
                sourceHandle: source.handleId,
                target: target.nodeId,
                targetHandle: target.handleId,
                animated: true,
            };
            set({
                edges: addEdge(connection as Connection, edges),
                pendingConnection: null,
            });
        }
    },
    addNode: (node) => {
        set({
            nodes: get().nodes.concat(node),
        });
    },
    setNodes: (nodes) => {
        set({ nodes });
    },

    runGraph: async () => {
        const { nodes, edges } = get();
        if (get().isRunning) return;

        set({ isRunning: true, executionLogs: [] });

        // Map to Blueprint
        // Note: We need to map 'type' to 'kind' strictly.
        // Assuming AppNode['type'] matches NodeKind for now, but explicit is better.
        const blueprint: Blueprint = {
            nodes: nodes.map(n => ({
                id: n.id,
                kind: n.type as 'trigger' | 'action' | 'variable',
            })),
            edges: edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
        };

        try {
            const { executionMode } = get();
            const config = { maxGas: DEFAULT_ENGINE_CONFIG.maxGas };

            let result;
            if (executionMode === 'remote') {
                result = await executeRemote(blueprint, config);
            } else {
                result = await executeBlueprint(blueprint, config);
            }

            set({ executionLogs: result.logs });
        } catch (e: any) {
            set({
                executionLogs: [{
                    nodeId: 'system',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: e.message || 'Unknown error'
                }]
            });
        } finally {
            set({ isRunning: false });
        }
    },

    clearLogs: () => set({ executionLogs: [] }),

    // Storage Actions
    toBlueprint: () => {
        const { nodes, edges } = get();
        // Viewport handling would typically require a separate hook or accessing reactFlowInstance.
        // For now we will return a default viewport or need to track it.
        // Zustand alone doesn't track viewport unless we sync it. 
        // We will assume 0,0,1 for now or user should sync it via onMoveEnd.
        // Let's rely on ReactFlow's 'useReactFlow' in components for viewport getting, 
        // OR simply store it here if we want.
        // Actually, the best place to get viewport is component level when saving.
        // BUT, `get` here doesn't have it.
        // Let's return the part we know: nodes and edges.

        return {
            meta: {
                version: CURRENT_BLUEPRINT_VERSION,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                name: 'Untitled Project',
            },
            graph: {
                nodes,
                edges,
                viewport: { x: 0, y: 0, zoom: 1 } // Placeholder, will be overridden by component
            },
            config: { maxGas: 100 }
        };
    },

    loadBlueprint: (blueprint: ProjectBlueprint) => {
        // Validation check could go here
        if (blueprint.meta.version !== CURRENT_BLUEPRINT_VERSION) {
            console.warn('Version mismatch, attempting load anyway');
        }
        set({
            nodes: blueprint.graph.nodes,
            edges: blueprint.graph.edges,
            // setViewport needs to be handled by component
        });
    },

    setViewport: (_viewport) => {
        // Only if we were tracking it in store, but mostly we let ReactFlow handle it
    }
}));
