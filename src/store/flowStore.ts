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
    Viewport // Added Viewport here for xyflow
} from '@xyflow/react';
import { AppNode } from '@/features/editor/types';
import { executeBlueprint } from '@/features/engine/execution/loop';
import { executeRemote } from '@/features/engine/remote/RemoteExecutor';
import { ExecutionLog } from '@/features/engine/execution/types';
import { ProjectBlueprint, CURRENT_BLUEPRINT_VERSION } from '@/features/storage/types';

import { BALANCE_CONFIG } from '@/config/balance';
import { compileBlueprintToLoadout } from '@/features/engine/mining/loadoutCompiler';
import { BigNum, fromNumber, add, sub, cmp, formatBigNum, toNumber } from '@/lib/bigNum';

export interface MineState {
    rockHp: BigNum;
    rockMaxHp: BigNum;
    rockTier: number;
    gold: BigNum;
    lastTs: number;
    stageId: number;
    killsInStage: number;
    stageGoal: number;
    tickets: number;
    gems: number;
    premiumCredits: number; // Mission 25-A
}

const UPGRADE_CONFIG = {
    nodeLimit: { baseCost: 50, mult: 2, baseVal: BALANCE_CONFIG.BASE_MAX_NODES, inc: 1 },
    maxGas: { baseCost: 80, mult: 2, baseVal: BALANCE_CONFIG.BASE_MAX_GAS, inc: 5 },
    tickSpeed: { baseCost: 100, mult: 2, baseVal: BALANCE_CONFIG.BASE_AUTORUN_INTERVAL_MS, dec: 60 * 1000, min: 60 * 1000 },
};

interface GoldUpgrades {
    dpsLevel: number;
    goldBonusLevel: number;
}

const GOLD_UPGRADE_CONFIG = {
    dps: { baseCost: 25, mult: 1.17 },
    gold: { baseCost: 40, mult: 1.20 }
};

interface FlowState {
    nodes: AppNode[];
    edges: Edge[];
    // ... existing properties
    mineState: MineState;

    // Mission 24-E: Gold Upgrades
    goldUpgrades: GoldUpgrades;
    buyGoldUpgrade: (type: 'dps' | 'gold') => void;

    // Mission 25-C: Editor Mode
    editorMode: 'GRAPH' | 'SLOT';
    setEditorMode: (mode: 'GRAPH' | 'SLOT') => void;

    // Mission 25-A: Presets & Unlocks
    unlockedPresets: string[]; // List of IDs
    unlockPreset: (id: string, price: number) => { ok: boolean; reason?: string };

    // ... existing properties continues

    // Mission 22-D: n8n Visibility
    n8nLogs: string[];
    n8nStatus: 'idle' | 'running' | 'error' | 'ok';
    lastN8nResult: any;
    isN8nPanelOpen: boolean;
    clearN8nLogs: () => void;
    toggleN8nPanel: () => void;

    // Mission 25-E: UI Polishing
    lastDamage: number;
    lastDamageTs: number;

    // Actions
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: AppNode) => void;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;

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

    // Terminal State (Mission 20-M)
    isTerminalOpen: boolean;
    setTerminalOpen: (isOpen: boolean) => void;

    // Result State
    isResultOpen: boolean;
    setResultOpen: (isOpen: boolean) => void;
    lastExecutionResult: any;
    setLastExecutionResult: (result: any) => void;

    // Blueprint Modal State (Mission 21-A)
    isBlueprintModalOpen: boolean;
    setBlueprintModalOpen: (isOpen: boolean) => void;

    // Preset Modal State (Mission 21-B)
    isPresetOpen: boolean;
    setPresetOpen: (isOpen: boolean) => void;

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

    // Mission 23-C: Visual Execution
    visualNodeId: string | null;
    triggerVisualExecution: (nodeIds: string[]) => Promise<void>;

    // Undo/Redo
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
    today: { nodes: AppNode[]; edges: Edge[] }[];
    past: { nodes: AppNode[]; edges: Edge[] }[];
    future: { nodes: AppNode[]; edges: Edge[] }[];

    // Mission 25-D: Offline
    processOfflineProgress: () => Promise<void>;
    refreshLastSeen: () => void;
}

export const useFlowStore = create<FlowState>()(persist((set, get) => ({
    nodes: [],
    edges: [],
    setNodes: (nodes: AppNode[]) => set({ nodes }),
    setEdges: (edges: Edge[]) => set({ edges }),

    // Mission 21-B: Presets
    isPresetOpen: false,
    setPresetOpen: (isOpen: boolean) => set({ isPresetOpen: isOpen }),

    // Mission 21-A: Blueprints
    isBlueprintModalOpen: false,
    setBlueprintModalOpen: (isOpen: boolean) => set({ isBlueprintModalOpen: isOpen }),

    // Mission 25-C: Editor Mode
    editorMode: 'SLOT', // Default to SLOT as per recommendation for mobile
    setEditorMode: (mode: 'GRAPH' | 'SLOT') => set({ editorMode: mode }),

    executionMode: 'local',
    setExecutionMode: (mode: 'local' | 'remote') => set({ executionMode: mode }),
    isRunning: false,
    executionLogs: [],
    pendingConnection: null,

    // Undo/Redo Defaults
    today: [],
    past: [],
    future: [],

    takeSnapshot: () => {
        set((state: FlowState) => {
            const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
            if (newPast.length > 30) newPast.shift();

            return {
                past: newPast,
                future: []
            };
        });
    },

    undo: () => {
        set((state: FlowState) => {
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
        set((state: FlowState) => {
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

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        const { edges } = get();
        if (edges.some((e) => e.source === connection.source && e.target === connection.target)) {
            return;
        }
        set({
            edges: addEdge(connection, edges),
        });
        get().takeSnapshot();
    },
    addNode: (node: AppNode) => {
        const state = get();
        const { upgrades, nodes } = state;

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


    runGraph: async () => {
        const { nodes, edges, executionMode, upgrades } = get();
        set({ isRunning: true });

        const gasConfig = UPGRADE_CONFIG.maxGas;
        const maxGas = gasConfig.baseVal + (upgrades.maxGas * gasConfig.inc);

        const engineNodes = nodes.map(n => ({
            ...n,
            kind: n.type,
        })) as any[];

        const nodeIds = nodes.map(n => n.id);
        get().triggerVisualExecution(nodeIds);

        if (executionMode === 'local') {
            const result = await executeBlueprint(
                { nodes: engineNodes, edges },
                {
                    maxGas,
                    onNodeExecution: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => get().setNodeStatus(nodeId, status)
                }
            );

            set((s: FlowState) => ({
                executionLogs: [...s.executionLogs, ...result.logs],
                credits: add(s.credits, fromNumber(result.creditsDelta || 0))
            }));
        } else {
            const result = await executeRemote(
                { nodes: engineNodes, edges },
                { maxGas }
            );
            set((s: FlowState) => ({ executionLogs: [...s.executionLogs, ...result.logs] }));
        }

        set({ isRunning: false });
    },

    visualNodeId: null,
    triggerVisualExecution: async (nodeIds: string[]) => {
        const LIMIT = 30;
        const targetIds = nodeIds.slice(0, LIMIT);

        for (const id of targetIds) {
            set({ visualNodeId: id });
            await new Promise(r => setTimeout(r, 200));
        }
        set({ visualNodeId: null });
    },

    onHandleClick: (nodeId: string, handleId: string | null, type: 'source' | 'target') => {
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
                viewport: { x: 0, y: 0, zoom: 1 }
            },
            config: {
                maxGas: upgrades.maxGas,
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

    setViewport: (_vp) => { },

    isInventoryOpen: false,
    setInventoryOpen: (isOpen: boolean) => set({ isInventoryOpen: isOpen }),
    inventoryTrigger: 0,
    refreshInventory: () => set((state: FlowState) => ({ inventoryTrigger: state.inventoryTrigger + 1 })),

    isMissionOpen: false,
    setMissionOpen: (isOpen: boolean) => set({ isMissionOpen: isOpen }),
    missions: [],
    setMissions: (missions: any[]) => set({ missions }),

    isHelpOpen: false,
    setHelpOpen: (isOpen: boolean) => set({ isHelpOpen: isOpen }),

    isTerminalOpen: false,
    setTerminalOpen: (isOpen: boolean) => set({ isTerminalOpen: isOpen }),

    isResultOpen: false,
    setResultOpen: (isOpen: boolean) => set({ isResultOpen: isOpen }),
    lastExecutionResult: null,
    setLastExecutionResult: (result: any) => set({ lastExecutionResult: result }),

    credits: fromNumber(0),
    setCredits: (credits: BigNum) => set({ credits }),
    isAutoRun: false,
    toggleAutoRun: () => set((state: FlowState) => ({ isAutoRun: !state.isAutoRun })),
    setAutoRun: (active: boolean) => set({ isAutoRun: active }),

    isShopOpen: false,
    setShopOpen: (isOpen: boolean) => set({ isShopOpen: isOpen }),
    upgrades: { maxGas: 0, tickSpeed: 0, nodeLimit: 0 },
    buyUpgrade: (type: keyof typeof UPGRADE_CONFIG) => {
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

    textState: {
        lastInput: '',
        lastOutput: 'Welcome to the system.',
        isLoading: false
    },
    n8nLogs: [],
    n8nStatus: 'idle',
    lastN8nResult: null,
    isN8nPanelOpen: false,

    clearN8nLogs: () => set({ n8nLogs: [] }),
    toggleN8nPanel: () => set((state: FlowState) => ({ isN8nPanelOpen: !state.isN8nPanelOpen })),

    lastDamage: 0,
    lastDamageTs: 0,

    runText: async (inputText: string) => {
        // ... (implementation hidden for brevity, no changes)
        const { executionLogs } = get();
        set({ executionLogs: [...executionLogs, { nodeId: 'USER', nodeKind: 'trigger', timestamp: Date.now(), gasUsed: 0, error: `> ${inputText}` }] });
        // ...
    },

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
        premiumCredits: 0, // Mission 25-A (Default 0, user needs to earn/buy)
        lastTs: Date.now()
    },

    // Mission 24-E: Gold Upgrades State
    goldUpgrades: { dpsLevel: 0, goldBonusLevel: 0 },

    // Mission 25-A: Presets
    unlockedPresets: ['basic-miner'],
    unlockPreset: (id: string, price: number) => {
        const state = get();
        // Check if already unlocked
        if (state.unlockedPresets.includes(id)) return { ok: true };

        // Check balance (Using premiumCredits as requested)
        if (state.mineState.premiumCredits >= price) {
            set({
                mineState: {
                    ...state.mineState,
                    premiumCredits: state.mineState.premiumCredits - price
                },
                unlockedPresets: [...state.unlockedPresets, id]
            });
            return { ok: true };
        }
        return { ok: false, reason: 'Not enough Premium Credits' };
    },

    buyGoldUpgrade: (type: 'dps' | 'gold') => {
        const state = get();
        const upgrades = state.goldUpgrades;
        const currentGold = state.mineState.gold;

        let costVal = 0;
        if (type === 'dps') {
            costVal = Math.floor(GOLD_UPGRADE_CONFIG.dps.baseCost * Math.pow(GOLD_UPGRADE_CONFIG.dps.mult, upgrades.dpsLevel));
        } else {
            costVal = Math.floor(GOLD_UPGRADE_CONFIG.gold.baseCost * Math.pow(GOLD_UPGRADE_CONFIG.gold.mult, upgrades.goldBonusLevel));
        }

        const cost = fromNumber(costVal);

        if (cmp(currentGold, cost) >= 0) {
            const nextLvl = (type === 'dps' ? upgrades.dpsLevel : upgrades.goldBonusLevel) + 1;

            set({
                mineState: { ...state.mineState, gold: sub(currentGold, cost) },
                goldUpgrades: {
                    ...upgrades,
                    [type === 'dps' ? 'dpsLevel' : 'goldBonusLevel']: nextLvl
                },
                executionLogs: [...state.executionLogs, {
                    nodeId: 'SHOP',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[SHOP] Upgraded ${type === 'dps' ? 'DPS' : 'Gold Bonus'} to Lv.${nextLvl}`
                }]
            });
        }
    },


    isMiningAuto: false,
    toggleMiningAuto: () => set((state: FlowState) => ({ isMiningAuto: !state.isMiningAuto })),
    runMine: async (elapsedSec: number = 0) => {
        const state = get();
        const { useSlotStore } = require('@/store/slotStore');
        const { computeLoadout } = require('@/features/slots/utils');
        const { getEquippedItem } = useSlotStore.getState();

        const equippedItems = ['TRIGGER', 'DAMAGE', 'GOLD', 'UTILITY'].map(type => getEquippedItem(type));
        const slotLoadoutStats = computeLoadout(equippedItems);

        const actualElapsed = elapsedSec > 0 ? elapsedSec : slotLoadoutStats.intervalSec;

        const { nodes, upgrades, premiumUpgrades, mineState, goldUpgrades } = state;
        const loadout = compileBlueprintToLoadout(nodes, upgrades.nodeLimit);

        // Mission 24-E: Merge Stats
        // Base DPS (Node) + Slot DPS + Gold Upgrade DPS (1.15^lvl)
        const goldDpsVal = Math.pow(1.15, goldUpgrades.dpsLevel);
        const premDpsMul = Math.pow(1.15, premiumUpgrades.dpsLvl);

        // Final DPS = (Base + Slot + GoldUpgrade) * PremiumMult
        // Base is effectively loadout.dps.m (if we assume blueprint runs).
        // If blueprint is empty/simple, it might be low.
        // Let's assume goldDpsVal is an ADDITIVE base booster.

        const totalBaseDps = loadout.dps.m + slotLoadoutStats.dps + goldDpsVal;
        const finalDps = totalBaseDps * premDpsMul;

        // Gold Bonus
        const goldBonusVal = goldUpgrades.goldBonusLevel * 5; // +5% per level
        const totalGoldBonus = (loadout.goldBonusPct || 0) + slotLoadoutStats.goldBonusPct + goldBonusVal;

        const apiLoadout = {
            ...loadout,
            dps: {
                m: finalDps,
                e: loadout.dps.e // Keeping exponent logic simple for now (assuming similar scale)
            },
            goldBonusPct: totalGoldBonus,
            intervalSec: slotLoadoutStats.intervalSec
        };

        set({ n8nStatus: 'running' });

        try {
            const res = await fetch('/api/mine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
                },
                body: JSON.stringify({
                    elapsedSec: actualElapsed,
                    state: mineState,
                    loadout: apiLoadout
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            // ... (rest of success handler same as before)
            const lines = data.lines || [];
            const rawNext = data.newState || {};
            const toBN = (val: any) => (val && typeof val === 'object' && 'm' in val) ? val : fromNumber(val || 0);

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
                gems: rawNext.gems || mineState.gems,
                premiumCredits: mineState.premiumCredits
            };
            const rewards = data.rewards || {};

            // Mission 25-E: Calc Damage for UI
            // Damage = hpBefore - hpAfter. If Rock Changed (tier diff or kills diff), damage = hpBefore (it broke).
            let damage = 0;
            const hpBeforeVal = toNumber(mineState.rockHp);
            const hpAfterVal = toNumber(nextState.rockHp);

            const rockChanged = nextState.rockTier !== mineState.rockTier || nextState.killsInStage !== mineState.killsInStage || nextState.stageId !== mineState.stageId;

            if (rockChanged) {
                damage = hpBeforeVal; // Dealt at least remaining HP
            } else {
                damage = Math.max(0, hpBeforeVal - hpAfterVal);
            }

            set((state: FlowState) => ({
                mineState: nextState,
                n8nStatus: 'ok',
                lastN8nResult: data,

                // Mission 25-E: UI State
                lastDamage: damage,
                lastDamageTs: Date.now(),

                n8nLogs: [
                    `[${new Date().toLocaleTimeString()}] Success: +${rewards.gold?.m ? formatBigNum(rewards.gold) : '0'} Gold`,
                    ...state.n8nLogs
                ].slice(0, 50),
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
            set((state: FlowState) => ({
                n8nStatus: 'error',
                n8nLogs: [
                    `[${new Date().toLocaleTimeString()}] Error: ${e.message}`,
                    ...state.n8nLogs
                ].slice(0, 50),
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

    nodeExecStatus: {},
    setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => set((state: FlowState) => ({
        nodeExecStatus: { ...state.nodeExecStatus, [nodeId]: status }
    })),

    premiumUpgrades: { dpsLvl: 0, goldLvl: 0, autoLvl: 0 },
    buyPremiumUpgrade: (type: 'dps' | 'gold' | 'auto') => {
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
                mineState: { ...state.mineState, tickets: currentTickets - cost },
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
    },

    // Mission 25-D: Offline Idle Core
    processOfflineProgress: async () => {
        const LAST_SEEN_KEY = 'n8ngame:lastSeenMs';
        const OFFLINE_CAP_SEC = 21600; // 6 hours

        const nowMs = Date.now();
        const lastSeenStr = localStorage.getItem(LAST_SEEN_KEY);
        const lastSeenMs = lastSeenStr ? parseInt(lastSeenStr, 10) : nowMs;

        // Update Last Seen immediately for current session
        localStorage.setItem(LAST_SEEN_KEY, nowMs.toString());

        // Guards
        if (lastSeenMs > nowMs) {
            console.warn('[Offline] Future time detected. Resetting.');
            return;
        }

        const elapsedMs = nowMs - lastSeenMs;
        const offlineSec = Math.floor(elapsedMs / 1000);

        if (offlineSec < 60) return; // Ignore small gaps

        const cappedSec = Math.min(offlineSec, OFFLINE_CAP_SEC);
        const AUTO_INTERVAL = 600; // 10 mins

        const runs = Math.floor(cappedSec / AUTO_INTERVAL);

        if (runs > 0) {
            const totalElapsed = runs * AUTO_INTERVAL;

            // Log for UI
            const { executionLogs } = get();
            set({
                executionLogs: [...executionLogs, {
                    nodeId: 'SYS',
                    nodeKind: 'system',
                    timestamp: nowMs,
                    gasUsed: 0,
                    error: `[Offline] Away for ${Math.floor(offlineSec / 60)}m. Simulating ${runs} runs (${Math.floor(totalElapsed / 60)}m)...`
                }]
            });

            // Execute
            await get().runMine(totalElapsed);
        }
    },

    // Helper to update lastSeen manually (e.g. on visibility change)
    refreshLastSeen: () => {
        localStorage.setItem('n8ngame:lastSeenMs', Date.now().toString());
    },

}), {
    name: 'flow-storage',
    version: 5, // Increment version for new state
    migrate: (persistedState: any, version: number) => {
        if (version < 5) {
            return {
                ...persistedState,
                goldUpgrades: { dpsLevel: 0, goldBonusLevel: 0 }
            };
        }
        return persistedState;
    },
}));
