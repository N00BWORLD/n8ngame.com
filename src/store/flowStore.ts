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
import { ExecutionLog } from '@/features/engine/execution/types';
import { ProjectBlueprint, CURRENT_BLUEPRINT_VERSION } from '@/features/storage/types';
import { Viewport } from '@xyflow/react';

import { BALANCE_CONFIG } from '@/config/balance';
import { compileBlueprintToLoadout } from '@/features/engine/mining/loadoutCompiler';
import { BigNum, fromNumber, add, sub, cmp, formatBigNum } from '@/lib/bigNum';

export interface MineState {
    rockHp: BigNum;
    rockMaxHp: BigNum;
    rockTier: number;
    gold: BigNum;
    lastTs: number;
    stageId: number;
    killsInStage: number;
    stageGoal: number;
    tickets: number; // Formerly premiumCredits (Earned)
    gems: number;   // New Premium Currency
}

const UPGRADE_CONFIG = {
    nodeLimit: { baseCost: 50, mult: 2, baseVal: BALANCE_CONFIG.BASE_MAX_NODES, inc: 1 },
    maxGas: { baseCost: 80, mult: 2, baseVal: BALANCE_CONFIG.BASE_MAX_GAS, inc: 5 },
    tickSpeed: { baseCost: 100, mult: 2, baseVal: BALANCE_CONFIG.BASE_AUTORUN_INTERVAL_MS, dec: 60 * 1000, min: 60 * 1000 },
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

    // Inventory State
    isInventoryOpen: boolean;
    setInventoryOpen: (isOpen: boolean) => void;
    inventoryTrigger: number;
    refreshInventory: () => void;

    // Mission State
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

    // Help State
    isHelpOpen: boolean;
    setHelpOpen: (isOpen: boolean) => void;

    // Result State
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

    // Mission 19-C: Premium Shop
    premiumUpgrades: {
        dpsLvl: number;
        goldLvl: number;
        autoLvl: number;
    };
    buyPremiumUpgrade: (type: 'dps' | 'gold' | 'auto') => void;

    // Undo/Redo
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
            const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
            if (newPast.length > 30) newPast.shift();

            return {
                past: newPast,
                future: []
            };
        });
    },

    undo: () => {
        set((state) => {
            if (state.past.length === 0) return {};

            const previous = state.past[state.past.length - 1];
            const newPast = state.past.slice(0, state.past.length - 1);

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

    clearLogs: () => set({ executionLogs: [] }),

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
        const { edges } = get();
        // Prevent duplicate connections
        if (edges.some((e) => e.source === connection.source && e.target === connection.target)) {
            return;
        }
        set({
            edges: addEdge(connection, edges),
        });
        get().takeSnapshot();
    },
    addNode: (node) => {
        const state = get();
        const { upgrades, nodes } = state;

        // Check Limit
        const limitConfig = UPGRADE_CONFIG.nodeLimit;
        const maxNodes = limitConfig.baseVal + (upgrades.nodeLimit * limitConfig.inc);

        if (nodes.length >= maxNodes) {
            set({
                executionLogs: [...state.executionLogs, {
                    nodeId: 'SYS',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[LIMIT] Cannot add node. Limit: ${maxNodes} (Upgrade in Shop)`
                }]
            });
            return;
        }

        set({ nodes: nodes.concat(node) });
        get().takeSnapshot();
    },
    setNodes: (nodes) => set({ nodes }),

    runGraph: async () => {
        const { nodes, edges, executionMode, upgrades } = get();
        set({ isRunning: true });

        // Calculate Max Gas
        const gasConfig = UPGRADE_CONFIG.maxGas;
        const maxGas = gasConfig.baseVal + (upgrades.maxGas * gasConfig.inc);

        // Map AppNode to EngineNode (type -> kind)
        // We cast to any to allow passing 'data' through, as runtimes likely need it
        const engineNodes = nodes.map(n => ({
            ...n,
            kind: n.type,
            // Ensure inputs/outputs if required by strictly typed EngineNode, but for now we trust runtime usage
        })) as any[];

        if (executionMode === 'local') {
            const result = await executeBlueprint(
                { nodes: engineNodes, edges },
                {
                    maxGas,
                    onNodeExecution: (nodeId, status) => get().setNodeStatus(nodeId, status)
                }
            );

            set((s) => ({
                executionLogs: [...s.executionLogs, ...result.logs],
                credits: add(s.credits, fromNumber(result.creditsDelta || 0))
            }));
        } else {
            const result = await executeRemote(
                { nodes: engineNodes, edges },
                { maxGas }
            );
            set((s) => ({ executionLogs: [...s.executionLogs, ...result.logs] }));
        }

        set({ isRunning: false });
    },

    onHandleClick: (nodeId, handleId, type) => {
        const { pendingConnection, onConnect, executionLogs } = get();

        if (!pendingConnection) {
            set({ pendingConnection: { nodeId, handleId, type } });
            return;
        }

        if (pendingConnection.nodeId === nodeId) {
            set({ pendingConnection: null });
            return;
        }

        if (pendingConnection.type === type) {
            set({
                pendingConnection: { nodeId, handleId, type },
                executionLogs: [...executionLogs, {
                    nodeId: 'UI',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[Connect] Switched selection source/target`
                }]
            });
            return;
        }

        const source = pendingConnection.type === 'source' ? pendingConnection : { nodeId, handleId };
        const target = pendingConnection.type === 'target' ? pendingConnection : { nodeId, handleId };

        if (!source.handleId || !target.handleId) return;

        onConnect({
            source: source.nodeId,
            sourceHandle: source.handleId,
            target: target.nodeId,
            targetHandle: target.handleId
        });

        set({ pendingConnection: null });
    },
    onPaneClick: () => set({ pendingConnection: null }),

    // Blueprint Storage
    toBlueprint: () => {
        const { nodes, edges, upgrades } = get();
        return {
            meta: {
                name: 'Auto-Save',
                version: CURRENT_BLUEPRINT_VERSION,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            graph: {
                nodes,
                edges,
                viewport: { x: 0, y: 0, zoom: 1 } // Default viewport, or fetch if available
            },
            config: {
                maxGas: upgrades.maxGas, // Simplified mapping or reuse logic
                initialVariables: {}
            }
        } as ProjectBlueprint;
    },
    loadBlueprint: (bp: ProjectBlueprint) => {
        set({
            nodes: bp.graph.nodes,
            edges: bp.graph.edges,
            executionLogs: [],
            past: [],
            future: []
        });
    },

    // Viewport State (Managed by ReactFlow, but we can store it slightly)
    setViewport: (_vp) => { /* Helper if needed for save/load viewport */ },

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

    // Result Card State
    isResultOpen: false,
    setResultOpen: (isOpen) => set({ isResultOpen: isOpen }),
    lastExecutionResult: null,
    setLastExecutionResult: (result) => set({ lastExecutionResult: result }),

    // Credits & AutoRun
    credits: fromNumber(0),
    setCredits: (credits) => set({ credits }),
    isAutoRun: false,
    toggleAutoRun: () => set((state) => ({ isAutoRun: !state.isAutoRun })),
    setAutoRun: (active: boolean) => set({ isAutoRun: active }),

    // Shop & Upgrades
    isShopOpen: false,
    setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
    upgrades: { maxGas: 0, tickSpeed: 0, nodeLimit: 0 },
    buyUpgrade: (type) => {
        const state = get();
        const level = state.upgrades[type];

        const config = UPGRADE_CONFIG[type];
        const costVal = Math.floor(config.baseCost * Math.pow(config.mult, level));
        const cost = fromNumber(costVal);

        if (cmp(state.credits, cost) >= 0) {
            if (type === 'tickSpeed') {
                const tsConfig = UPGRADE_CONFIG.tickSpeed;
                const newSpeed = tsConfig.baseVal - ((level + 1) * tsConfig.dec);
                if (newSpeed < tsConfig.min) {
                    // Check current speed validity logic (removed unused currentSpeed var)
                    set({
                        executionLogs: [...state.executionLogs, {
                            nodeId: 'SHOP',
                            nodeKind: 'system',
                            timestamp: Date.now(),
                            gasUsed: 0,
                            error: `[SHOP] Max Speed Reached`
                        }]
                    });
                    return;
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
                    error: `[SHOP] Not enough credits!`
                }]
            });
        }
    },

    // Text Game State
    textState: {
        lastInput: '',
        lastOutput: 'Welcome to the system.',
        isLoading: false
    },
    runText: async (inputText: string) => {
        const { textState, executionLogs } = get();

        set({
            executionLogs: [...executionLogs, {
                nodeId: 'USER',
                nodeKind: 'trigger',
                timestamp: Date.now(),
                gasUsed: 0,
                error: `> ${inputText}`
            }]
        });

        try {
            const response = await fetch('/api/run-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputText, state: textState })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const lines = data.lines || [];
            const nextState = data.nextState || textState;

            const newLogs = lines.map((line: string) => ({
                nodeId: 'GAME',
                nodeKind: 'action',
                timestamp: Date.now(),
                gasUsed: 0,
                error: line
            }));

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

    // Mining Implementation
    mineState: {
        stageId: 1,
        killsInStage: 0,
        stageGoal: 20,
        rockTier: 1,
        rockHp: fromNumber(100),
        rockMaxHp: fromNumber(100),
        gold: fromNumber(0),
        tickets: 0,
        gems: 0,
        lastTs: Date.now()
    },
    isMiningAuto: false,
    toggleMiningAuto: () => set((state) => ({ isMiningAuto: !state.isMiningAuto })),
    runMine: async (elapsedSec: number = 0) => {
        const state = get();
        const { mineState, nodes, upgrades, premiumUpgrades } = state;

        const loadout = compileBlueprintToLoadout(nodes, upgrades.nodeLimit);

        const premDpsMul = Math.pow(1.15, premiumUpgrades.dpsLvl);
        const premGoldBonus = 10 * premiumUpgrades.goldLvl;

        // Quick scaling for BigNum: 
        const scaledDps = { ...loadout.dps, m: loadout.dps.m * premDpsMul };

        const payload = {
            elapsedSec,
            state: mineState,
            loadout: {
                ...loadout,
                dps: scaledDps,
            },
            premiumBonuses: {
                goldPct: premGoldBonus
            }
        };

        try {
            const response = await fetch('/api/mine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!data.ok) {
                set((state) => ({
                    executionLogs: [...state.executionLogs, {
                        nodeId: 'MINE',
                        nodeKind: 'system',
                        timestamp: Date.now(),
                        gasUsed: 0,
                        error: `[Mine Failed] ${data.error || 'Server Required'}`
                    }],
                    isMiningAuto: false
                }));
                return;
            }

            // Success Updates
            const lines = data.lines || [];

            const rawNext = data.nextState || {};
            const toBN = (val: any) => (val && typeof val === 'object' && 'm' in val) ? val : fromNumber(val || 0);

            // Map tickets.
            const nextTickets = rawNext.tickets ?? mineState.tickets;

            const nextState: MineState = {
                rockHp: toBN(rawNext.rockHp),
                rockMaxHp: toBN(rawNext.rockMaxHp),
                rockTier: rawNext.rockTier || mineState.rockTier,
                gold: toBN(rawNext.gold),
                lastTs: Date.now(),
                stageId: rawNext.stageId || mineState.stageId,
                killsInStage: rawNext.killsInStage || mineState.killsInStage,
                stageGoal: rawNext.stageGoal || mineState.stageGoal,
                tickets: nextTickets,
                gems: rawNext.gems || mineState.gems || 0
            };

            const rewards = data.rewards || {};
            const ticketsGained = rewards.ticketsGained || 0;

            if (ticketsGained > 0) {
                lines.push(`[REWARD] +${ticketsGained} Tickets!`);
            }

            set((state) => ({
                mineState: nextState,
                executionLogs: [
                    ...state.executionLogs,
                    ...lines.map((l: string) => ({
                        nodeId: 'MINE',
                        nodeKind: 'system',
                        timestamp: Date.now(),
                        gasUsed: 0,
                        error: l
                    }))
                ]
            }));

        } catch (e: any) {
            set((state) => ({
                executionLogs: [...state.executionLogs, {
                    nodeId: 'MINE',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[Network Error] ${e.message}`
                }],
                isMiningAuto: false
            }));
        }
    },

    // Node Exec Status (Mission 14-A)
    nodeExecStatus: {},
    setNodeStatus: (nodeId, status) => set((state) => ({
        nodeExecStatus: { ...state.nodeExecStatus, [nodeId]: status }
    })),

    // Premium Upgrades (Mission 19-C)
    premiumUpgrades: {
        dpsLvl: 0,
        goldLvl: 0,
        autoLvl: 0
    },
    buyPremiumUpgrade: (type) => {
        const state = get();
        const upgrades = state.premiumUpgrades;
        const currentTickets = state.mineState.tickets;

        let cost = 0;
        let nextLvl = 0;

        if (type === 'dps') {
            nextLvl = upgrades.dpsLvl + 1;
            cost = Math.ceil(2 * Math.pow(1.6, upgrades.dpsLvl));
        } else if (type === 'gold') {
            nextLvl = upgrades.goldLvl + 1;
            cost = Math.ceil(3 * Math.pow(1.7, upgrades.goldLvl));
        } else if (type === 'auto') {
            nextLvl = upgrades.autoLvl + 1;
            cost = Math.ceil(5 * Math.pow(2.0, upgrades.autoLvl));
        }

        if (currentTickets >= cost) {
            set({
                mineState: {
                    ...state.mineState,
                    tickets: currentTickets - cost
                },
                premiumUpgrades: {
                    ...upgrades,
                    [type === 'dps' ? 'dpsLvl' : type === 'gold' ? 'goldLvl' : 'autoLvl']: nextLvl
                },
                executionLogs: [
                    ...state.executionLogs,
                    {
                        nodeId: 'SHOP',
                        nodeKind: 'system',
                        timestamp: Date.now(),
                        gasUsed: 0,
                        error: `[SHOP] Upgrade ${type} to Lv.${nextLvl} (Cost: ${cost} Tickets)`
                    }
                ]
            });
        }
    }

}), {
    name: 'flow-storage',
    version: 4,
    migrate: (persistedState: any, version) => {
        if (version < 4) {
            // Migration: Move premiumCredits to tickets if exists
            const mineState = persistedState.mineState || {};
            if (mineState.premiumCredits !== undefined && (mineState.tickets === undefined || mineState.tickets === 0)) {
                mineState.tickets = mineState.premiumCredits;
                delete mineState.premiumCredits; // Clean up legacy key
            }
            return {
                ...persistedState,
                mineState
            };
        }
        return persistedState;
    },
}));
