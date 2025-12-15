import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import { ExecutionLog } from '@/features/engine/execution/types';
import { ProjectBlueprint, CURRENT_BLUEPRINT_VERSION } from '@/features/storage/types';
import { Viewport } from '@xyflow/react';
import { deriveConnectionState } from '@/features/engine/connectionLogic';

import { BALANCE_CONFIG } from '@/config/balance';
import { compileBlueprintToLoadout } from '@/features/engine/mining/loadoutCompiler';
import { BigNum, fromNumber, add, sub, cmp, formatBigNum } from '@/lib/bigNum';

export interface MineState {
    rockHp: BigNum;
    rockMaxHp: BigNum;
    rockLevel: number; // Level stays number
    gold: BigNum;
    lastTs: number;
}

const UPGRADE_CONFIG = {
    // Mission 15-C: Shop Balance (Hardcore)
    // 1. Node Limit: Cost 50, x2, +1
    nodeLimit: {
        baseCost: 50,
        mult: 2,
        baseVal: BALANCE_CONFIG.BASE_MAX_NODES,
        inc: 1 // +1 Node
    },
    // 2. Gas Unit: Cost 80, x2, +5
    maxGas: {
        baseCost: 80,
        mult: 2,
        baseVal: BALANCE_CONFIG.BASE_MAX_GAS,
        inc: 5 // +5 Gas
    },
    // 3. AutoRun: Cost 100, x2, -1 minute
    tickSpeed: {
        baseCost: 100,
        mult: 2,
        baseVal: BALANCE_CONFIG.BASE_AUTORUN_INTERVAL_MS,
        dec: 60 * 1000, // -1 Minute
        min: 60 * 1000  // Cap at 1m minimum
    },
};

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
    // Mission 12-A: Result Card
    isResultOpen: boolean;
    setResultOpen: (isOpen: boolean) => void;
    lastExecutionResult: any;
    setLastExecutionResult: (result: any) => void;

    // Mission 13: Credits & AutoRun
    credits: BigNum;
    setCredits: (credits: BigNum) => void;
    isAutoRun: boolean;
    toggleAutoRun: () => void;
    setAutoRun: (active: boolean) => void;

    // Mission 13: Shop & Upgrades
    isShopOpen: boolean;
    setShopOpen: (isOpen: boolean) => void;
    upgrades: {
        maxGas: number;
        tickSpeed: number;
        nodeLimit: number;
    };
    buyUpgrade: (type: keyof typeof UPGRADE_CONFIG) => void;

    // Mission API-UI-1: Text Game
    textState: {
        lastInput: string;
        lastOutput: string;
        isLoading: boolean;
    };
    runText: (input: string) => Promise<void>;

    // Mission API-UI-MINE-1: Mining
    mineState: MineState;
    isMiningAuto: boolean;
    toggleMiningAuto: () => void;
    runMine: (elapsedSec: number) => Promise<void>;

    // Mission 14-A: Node Highlight
    nodeExecStatus: Record<string, 'idle' | 'running' | 'success' | 'error'>;
    setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;

    // Undo/Redo (Mission 12-B)
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
    past: { nodes: AppNode[]; edges: Edge[] }[];
    future: { nodes: AppNode[]; edges: Edge[] }[];
}

export const useFlowStore = create<FlowState>()(persist((set, get) => ({
    nodes: [],
    edges: [],
    executionMode: 'local',
    setExecutionMode: (mode) => set({ executionMode: mode }),
    isRunning: false,
    executionLogs: [],
    pendingConnection: null,

    // Undo/Redo Defaults
    past: [],
    future: [],

    takeSnapshot: () => {
        set((state) => {
            // Limit history to 30
            const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
            if (newPast.length > 30) newPast.shift();

            return {
                past: newPast,
                future: [] // Clear future on new action
            };
        });
    },

    undo: () => {
        set((state) => {
            if (state.past.length === 0) return {};

            const previous = state.past[state.past.length - 1];
            const newPast = state.past.slice(0, -1);

            return {
                past: newPast,
                future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
                nodes: previous.nodes,
                edges: previous.edges
            };
        });
    },

    redo: () => {
        set((state) => {
            if (state.future.length === 0) return {};

            const next = state.future[0];
            const newFuture = state.future.slice(1);

            return {
                past: [...state.past, { nodes: state.nodes, edges: state.edges }],
                future: newFuture,
                nodes: next.nodes,
                edges: next.edges
            };
        });
    },

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

    // Mission 13: Credits & AutoRun
    credits: fromNumber(0),
    setCredits: (credits) => set({ credits }),
    isAutoRun: false,
    toggleAutoRun: () => set((state) => ({ isAutoRun: !state.isAutoRun })),
    setAutoRun: (active: boolean) => set({ isAutoRun: active }),

    // Mission 13: Shop & Upgrades
    isShopOpen: false,
    setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
    upgrades: { maxGas: 0, tickSpeed: 0, nodeLimit: 0 }, // Initial state, persist will load
    buyUpgrade: (type) => {
        const state = get();
        const level = state.upgrades[type];

        // Config definitions (moved inside to avoid scope issues or redefined)
        const config = UPGRADE_CONFIG[type];
        const costVal = Math.floor(config.baseCost * Math.pow(config.mult, level));
        const cost = fromNumber(costVal);

        if (cmp(state.credits, cost) >= 0) { // credits >= cost
            // Limit check for TickSpeed
            if (type === 'tickSpeed') {
                const tsConfig = UPGRADE_CONFIG.tickSpeed;
                const newSpeed = tsConfig.baseVal - ((level + 1) * tsConfig.dec);
                if (newSpeed < tsConfig.min) {
                    const currentSpeed = tsConfig.baseVal - (level * tsConfig.dec);
                    if (currentSpeed <= tsConfig.min) {
                        set({
                            executionLogs: [...state.executionLogs, {
                                nodeId: 'SHOP',
                                nodeKind: 'system',
                                timestamp: Date.now(),
                                gasUsed: 0,
                                error: `[SHOP] Tick Speed is already at minimum (${tsConfig.min / 1000}s)`
                            }]
                        });
                        return;
                    }
                }
            }

            const newUpgrades = { ...state.upgrades, [type]: level + 1 };
            const newCredits = sub(state.credits, cost);

            set({
                credits: newCredits,
                upgrades: newUpgrades,
                executionLogs: [...state.executionLogs, {
                    nodeId: 'SHOP',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[SHOP] Purchased ${type} Lv.${level + 1} (cost ${formatBigNum(cost)})`
                }]
            });
        } else {
            set({
                executionLogs: [...state.executionLogs, {
                    nodeId: 'SHOP',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[SHOP] Not enough credits! Need ${formatBigNum(cost)}`
                }]
            });
        }
    },

    // Mission API-UI-1: Text Game
    textState: {
        lastInput: '',
        lastOutput: 'Welcome to the system.',
        isLoading: false
    },
    runText: async (inputText: string) => {
        const { textState, executionLogs } = get();

        // 1. Optimistic Log (User Input)
        set({
            executionLogs: [...executionLogs, {
                nodeId: 'USER',
                nodeKind: 'trigger', // Green color
                timestamp: Date.now(),
                gasUsed: 0,
                error: `> ${inputText}` // Convention for input
            }]
        });

        try {
            // 2. API Call
            const response = await fetch('/api/run-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputText, state: textState })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            // Expected: { lines: string[], nextState: string, rewards: [] }

            // 3. Process Response
            const lines = data.lines || [];
            const nextState = data.nextState || textState;

            // Log each line
            const newLogs = lines.map((line: string) => ({
                nodeId: 'GAME',
                nodeKind: 'action', // Blue color
                timestamp: Date.now(),
                gasUsed: 0,
                error: line // Using error field for message text as per existing Terminal logic
            }));

            // TODO: Handle rewards if present

            set((state) => ({
                textState: nextState,
                executionLogs: [...state.executionLogs, ...newLogs]
            }));

        } catch (err: any) {
            set((state) => ({
                executionLogs: [...state.executionLogs, {
                    nodeId: 'SYS',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[Error] ${err.message}`
                }]
            }));
        }
    },

    // Mission API-UI-MINE-1: Mining Implementation
    mineState: { rockHp: fromNumber(100), rockMaxHp: fromNumber(100), rockLevel: 1, gold: fromNumber(0), lastTs: Date.now() },
    isMiningAuto: false,
    toggleMiningAuto: () => set((state) => ({ isMiningAuto: !state.isMiningAuto })),

    // Mission 14-A: Node Highlight
    nodeExecStatus: {},
    setNodeStatus: (nodeId, status) => set((state) => ({
        nodeExecStatus: { ...state.nodeExecStatus, [nodeId]: status }
    })),

    // ... (inside FlowState interface, no change needed)

    runMine: async (elapsedSec: number) => {
        const { mineState, nodes, upgrades } = get();

        // Mission 15-B: Dynamic Loadout Compilation
        const loadout = compileBlueprintToLoadout(nodes, upgrades.nodeLimit);

        // Request Body
        const payload = {
            elapsedSec,
            state: mineState,
            loadout // { dps, goldBonusPct, critChancePct }
        };

        try {
            const response = await fetch('/api/mine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json(); // { ok, lines, rewards, nextState, error }

            if (!data.ok) {
                // Handle "Server Required" or Errors
                set((state) => ({
                    executionLogs: [...state.executionLogs, {
                        nodeId: 'MINE',
                        nodeKind: 'system',
                        timestamp: Date.now(),
                        gasUsed: 0,
                        error: `[Mine Failed] ${data.error || 'Server Required'}`
                    }],
                    isMiningAuto: false // Stop auto on error
                }));
                return;
            }

            // Success Updates
            const lines = data.lines || [];

            // Next State from API. API might send Numbers or BigNum objects.
            // If API sends numbers (legacy), we convert. If it sends {m,e}, we use.
            const rawNext = data.nextState || {};
            // Helper to safe convert
            const toBN = (val: any) => (val && typeof val === 'object' && 'm' in val) ? val : fromNumber(val || 0);

            const nextState: MineState = {
                rockHp: toBN(rawNext.rockHp),
                rockMaxHp: toBN(rawNext.rockMaxHp),
                rockLevel: rawNext.rockLevel || mineState.rockLevel,
                gold: toBN(rawNext.gold),
                lastTs: Date.now()
            };

            const rewards = data.rewards || {};

            // Handle Credits
            if (rewards.creditsGained) {
                // rewards.creditsGained might be number or BigNum
                const gain = toBN(rewards.creditsGained);
                const currentCredits = get().credits;
                set({ credits: add(currentCredits, gain) });
            }

            set({
                mineState: nextState,
                executionLogs: [...get().executionLogs, ...lines.map((line: string) => ({
                    nodeId: 'MINE',
                    nodeKind: 'action',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    output: line
                }))].slice(-50) // Keep last 50
            });

        } catch (err: any) {
            // Mission 14-B: Safe Fail (No Console Throw)
            set((state) => ({
                executionLogs: [...state.executionLogs, {
                    nodeId: 'MINE',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[Network Error] API unreachable (Check Server)`
                }],
                isMiningAuto: false
            }));
        }
    },


    onPaneClick: () => {
        set({ pendingConnection: null });
    },

    onNodesChange: (changes) => {
        // Snapshot triggers
        const isStructuralChange = changes.some(c => c.type === 'remove' || c.type === 'add' || c.type === 'replace');
        if (isStructuralChange) {
            get().takeSnapshot();
        }

        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },
    onEdgesChange: (changes) => {
        const isStructuralChange = changes.some(c => c.type === 'remove' || c.type === 'add' || c.type === 'replace');
        if (isStructuralChange) {
            get().takeSnapshot();
        }

        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection) => {
        get().takeSnapshot();
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
            get().takeSnapshot();
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
        const { nodes, upgrades } = get();
        // Node Limit Check
        const limitConfig = UPGRADE_CONFIG.nodeLimit;
        const maxNodes = limitConfig.baseVal + (upgrades.nodeLimit * limitConfig.inc);

        if (nodes.length >= maxNodes) {
            set({
                executionLogs: [...get().executionLogs, {
                    nodeId: 'system',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[LIMIT] Node limit reached (${maxNodes}). Upgrade in Shop!`
                }]
            });
            return;
        }

        get().takeSnapshot();
        set({
            nodes: get().nodes.concat(node),
        });
    },
    setNodes: (nodes) => {
        // Warning: setNodes might overwrite everything, potentially bypassing snapshot if used directly.
        // For now, we assume direct setNodes is for loading or initialization where snapshot might not be desired
        // OR we should snapshot? For 'Load', we usually clear history.
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
            const { executionMode, upgrades } = get();

            // Max Gas Calculation
            const gasConfig = UPGRADE_CONFIG.maxGas;
            const maxGas = gasConfig.baseVal + (upgrades.maxGas * gasConfig.inc);
            const config = {
                maxGas,
                // Mission 14-A: Visual Execution
                stepDelayMs: 120, // Visible delay
                onNodeExecution: (nodeId: string, status: 'running' | 'success' | 'error') => {
                    get().setNodeStatus(nodeId, status);
                    // Auto-reset success to idle after a delay for "flash" effect? 
                    // Or keep it green? Prompt says "300ms 후 idle 복귀".
                    if (status === 'success') {
                        setTimeout(() => {
                            get().setNodeStatus(nodeId, 'idle');
                        }, 300);
                    }
                    if (status === 'running') {
                        // Ensure previous success is cleared? Or just running.
                    }
                }
            };

            let result;
            if (executionMode === 'remote') {
                result = await executeRemote(blueprint, config);
            } else {
                result = await executeBlueprint(blueprint, config);

                // Mission 13: Handle Credits
                if (result.creditsDelta !== undefined) {
                    const currentCredits = get().credits;
                    const newTotal = add(currentCredits, fromNumber(result.creditsDelta));

                    if (get().isAutoRun && newTotal.m === 0 && newTotal.e === 0) {
                        set({ isAutoRun: false });
                        // Add bankruptcy log
                        result.logs.push({
                            nodeId: 'system',
                            nodeKind: 'system',
                            timestamp: Date.now(),
                            gasUsed: 0,
                            error: 'BANKRUPTCY! Auto Run stopped.'
                        });
                    } else {
                        get().setCredits(newTotal);
                    }
                }
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
            past: [], // Clear history on load
            future: []
            // setViewport needs to be handled by component
        });
    },

    setViewport: (_viewport) => {
        // Only if we were tracking it in store, but mostly we let ReactFlow handle it
    }
}), {
    name: 'n8ngame-flow-store',
    partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        credits: state.credits,
        upgrades: state.upgrades,
        mineState: state.mineState,
        isMiningAuto: state.isMiningAuto
    })
}));
