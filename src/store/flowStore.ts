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
    Viewport
} from '@xyflow/react';
import { AppNode } from '@/features/editor/types';
import { executeBlueprint } from '@/features/engine/execution/loop';
import { executeRemote } from '@/features/engine/remote/RemoteExecutor';
import { ExecutionLog } from '@/features/engine/execution/types';
import { ProjectBlueprint, CURRENT_BLUEPRINT_VERSION, StorageSlot } from '@/features/storage/types';

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

const GOLD_UPGRADE_CONFIG = {
    dps: { baseCost: 50, growth: 1.15, effectInc: 0.1 },             // +10% linear base per level
    gold: { baseCost: 80, growth: 1.13, effectInc: 5 },              // +5% additive
    auto: { baseCost: 200, growth: 1.20 }                            // UI only
};

export interface GoldUpgrades {
    dpsLevel: number;
    goldBonusLevel: number;
    autoLevel: number;
}

interface FlowState {
    nodes: AppNode[];
    edges: Edge[];
    mineState: MineState;

    // Mission 24-E: Gold Upgrades
    goldUpgrades: GoldUpgrades;
    buyGoldUpgrade: (type: 'dps' | 'gold' | 'auto') => void;

    // Mission 25-C: Editor Mode
    editorMode: 'GRAPH' | 'SLOT';
    setEditorMode: (mode: 'GRAPH' | 'SLOT') => void;

    // Mission 25-A: Presets & Unlocks
    unlockedPresets: string[];
    unlockPreset: (id: string, price: number) => { ok: boolean; reason?: string };

    // Mission 26-C: Save Slots
    saveSlots: StorageSlot[];
    saveToSlot: (slotId: number, name: string) => void;
    loadSlot: (slotId: number) => void;
    clearSlot: (slotId: number) => void;

    // Legacy/Existing Props
    n8nLogs: string[];
    n8nStatus: 'idle' | 'running' | 'error' | 'ok';
    lastN8nResult: any;
    isN8nPanelOpen: boolean;
    clearN8nLogs: () => void;
    toggleN8nPanel: () => void;

    lastDamage: number;
    lastDamageTs: number;

    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: AppNode) => void;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;

    executionMode: 'local' | 'remote';
    setExecutionMode: (mode: 'local' | 'remote') => void;
    isRunning: boolean;
    executionLogs: ExecutionLog[];
    runGraph: () => Promise<void>;
    clearLogs: () => void;

    pendingConnection: { nodeId: string; handleId: string | null; type: 'source' | 'target' } | null;
    onHandleClick: (nodeId: string, handleId: string | null, type: 'source' | 'target') => void;
    onPaneClick: () => void;

    toBlueprint: () => ProjectBlueprint;
    loadBlueprint: (blueprint: ProjectBlueprint) => void;
    setViewport: (viewport: Viewport) => void;

    isInventoryOpen: boolean;
    setInventoryOpen: (isOpen: boolean) => void;
    inventoryTrigger: number;
    refreshInventory: () => void;

    isMissionOpen: boolean;
    setMissionOpen: (isOpen: boolean) => void;
    missions: any[];
    setMissions: (missions: any[]) => void;

    isHelpOpen: boolean;
    setHelpOpen: (isOpen: boolean) => void;

    isTerminalOpen: boolean;
    setTerminalOpen: (isOpen: boolean) => void;

    isResultOpen: boolean;
    setResultOpen: (isOpen: boolean) => void;
    lastExecutionResult: any;
    setLastExecutionResult: (result: any) => void;

    isBlueprintModalOpen: boolean;
    setBlueprintModalOpen: (isOpen: boolean) => void;
    isPresetOpen: boolean;
    setPresetOpen: (isOpen: boolean) => void;

    credits: BigNum;
    setCredits: (credits: BigNum) => void;
    isAutoRun: boolean;
    toggleAutoRun: () => void;
    setAutoRun: (active: boolean) => void;

    isShopOpen: boolean;
    setShopOpen: (isOpen: boolean) => void;
    upgrades: { maxGas: number; tickSpeed: number; nodeLimit: number; };
    buyUpgrade: (type: keyof typeof UPGRADE_CONFIG) => void;

    textState: { lastInput: string; lastOutput: string; isLoading: boolean; };
    runText: (input: string) => Promise<void>;

    isMiningAuto: boolean;
    toggleMiningAuto: () => void;
    runMine: (elapsedSec?: number) => Promise<void>;

    nodeExecStatus: Record<string, 'idle' | 'running' | 'success' | 'error'>;
    setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;

    premiumUpgrades: { dpsLvl: number; goldLvl: number; autoLvl: number; };
    buyPremiumUpgrade: (type: 'dps' | 'gold' | 'auto') => void;

    visualNodeId: string | null;
    triggerVisualExecution: (nodeIds: string[]) => Promise<void>;

    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
    today: { nodes: AppNode[]; edges: Edge[] }[];
    past: { nodes: AppNode[]; edges: Edge[] }[];
    future: { nodes: AppNode[]; edges: Edge[] }[];

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

    editorMode: 'SLOT',
    setEditorMode: (mode) => set({ editorMode: mode }),

    // Mission 25-A: Presets & Unlocks
    unlockedPresets: ['basic-miner'],
    unlockPreset: (id: string, price: number) => {
        const state = get();
        if (state.unlockedPresets.includes(id)) return { ok: true };
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

    // Mission 26-C: Save Slots
    saveSlots: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Slot ${i + 1}`,
        updatedAt: 0,
        blueprint: undefined
    } as StorageSlot)),

    saveToSlot: (slotId: number, name: string) => {
        const state = get();
        const blueprint = state.toBlueprint();
        // Update meta name
        blueprint.meta.name = name;

        const newSlots = state.saveSlots.map(s => {
            if (s.id === slotId) {
                return {
                    ...s,
                    name,
                    updatedAt: Date.now(),
                    blueprint
                };
            }
            return s;
        });

        set({ saveSlots: newSlots });
    },

    loadSlot: (slotId: number) => {
        const slot = get().saveSlots.find(s => s.id === slotId);
        if (slot && slot.blueprint) {
            get().loadBlueprint(slot.blueprint);
            // Also execute notification or log?
            set(s => ({
                executionLogs: [...s.executionLogs, {
                    nodeId: 'SYS', nodeKind: 'system', timestamp: Date.now(), gasUsed: 0,
                    error: `[SYSTEM] Loaded "${slot.name}"`
                }]
            }));
        }
    },

    clearSlot: (slotId: number) => {
        set(state => ({
            saveSlots: state.saveSlots.map(s =>
                s.id === slotId
                    ? { id: slotId, name: `Slot ${slotId}`, updatedAt: 0, blueprint: undefined }
                    : s
            )
        }));
    },

    executionMode: 'local',
    setExecutionMode: (mode) => set({ executionMode: mode }),
    isRunning: false,
    executionLogs: [],
    pendingConnection: null,

    today: [],
    past: [],
    future: [],

    takeSnapshot: () => {
        set((state) => {
            const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
            if (newPast.length > 30) newPast.shift();
            return { past: newPast, future: [] };
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

    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
    onConnect: (connection) => {
        const { edges } = get();
        if (edges.some((e) => e.source === connection.source && e.target === connection.target)) return;
        set({ edges: addEdge(connection, edges) });
        get().takeSnapshot();
    },

    addNode: (node) => {
        const state = get();
        const { upgrades, nodes } = state;
        const limitConfig = UPGRADE_CONFIG.nodeLimit;
        const maxNodes = limitConfig.baseVal + (upgrades.nodeLimit * limitConfig.inc);

        if (nodes.length >= maxNodes) {
            set({ executionLogs: [...state.executionLogs, { nodeId: 'SYS', nodeKind: 'system', timestamp: Date.now(), gasUsed: 0, error: `[LIMIT] Max Nodes ${maxNodes}` }] });
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
        const engineNodes = nodes.map(n => ({ ...n, kind: n.type })) as any[];

        get().triggerVisualExecution(nodes.map(n => n.id));

        if (executionMode === 'local') {
            const result = await executeBlueprint(
                { nodes: engineNodes, edges },
                { maxGas, onNodeExecution: (id, status) => get().setNodeStatus(id, status) }
            );
            set((s) => ({
                executionLogs: [...s.executionLogs, ...result.logs],
                credits: add(s.credits, fromNumber(result.creditsDelta || 0))
            }));
        } else {
            const result = await executeRemote({ nodes: engineNodes, edges }, { maxGas });
            set((s) => ({ executionLogs: [...s.executionLogs, ...result.logs] }));
        }
        set({ isRunning: false });
    },

    visualNodeId: null,
    triggerVisualExecution: async (nodeIds) => {
        const LIMIT = 30;
        for (const id of nodeIds.slice(0, LIMIT)) {
            set({ visualNodeId: id });
            await new Promise(r => setTimeout(r, 200));
        }
        set({ visualNodeId: null });
    },

    onHandleClick: (nodeId, handleId, type) => {
        const { pendingConnection, onConnect } = get();
        if (!pendingConnection) {
            set({ pendingConnection: { nodeId, handleId, type } });
            return;
        }
        if (pendingConnection.nodeId === nodeId) {
            set({ pendingConnection: null });
            return;
        }
        if (pendingConnection.type === type) return;

        const source = pendingConnection.type === 'source' ? pendingConnection : { nodeId, handleId };
        const target = pendingConnection.type === 'target' ? pendingConnection : { nodeId, handleId };
        if (source.handleId && target.handleId) {
            onConnect({ source: source.nodeId, sourceHandle: source.handleId, target: target.nodeId, targetHandle: target.handleId });
        }
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
            graph: { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } },
            config: { maxGas: upgrades.maxGas, initialVariables: {} }
        } as ProjectBlueprint;
    },
    loadBlueprint: (bp) => {
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
    setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
    inventoryTrigger: 0,
    refreshInventory: () => set((state) => ({ inventoryTrigger: state.inventoryTrigger + 1 })),

    isMissionOpen: false,
    setMissionOpen: (isOpen) => set({ isMissionOpen: isOpen }),
    missions: [],
    setMissions: (missions) => set({ missions }),

    isHelpOpen: false,
    setHelpOpen: (isOpen) => set({ isHelpOpen: isOpen }),

    isTerminalOpen: false,
    setTerminalOpen: (isOpen) => set({ isTerminalOpen: isOpen }),

    isResultOpen: false,
    setResultOpen: (isOpen) => set({ isResultOpen: isOpen }),
    lastExecutionResult: null,
    setLastExecutionResult: (result) => set({ lastExecutionResult: result }),

    credits: fromNumber(0),
    setCredits: (credits) => set({ credits }),

    isAutoRun: false,
    toggleAutoRun: () => set((state) => ({ isAutoRun: !state.isAutoRun })),
    setAutoRun: (active) => set({ isAutoRun: active }),

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
                if (newSpeed < tsConfig.min) return;
            }
            set({
                credits: sub(state.credits, cost),
                upgrades: { ...state.upgrades, [type]: level + 1 }
            });
        }
    },

    textState: { lastInput: '', lastOutput: 'Welcome.', isLoading: false },
    runText: async (input) => {
        set({ executionLogs: [...get().executionLogs, { nodeId: 'USER', nodeKind: 'trigger', timestamp: Date.now(), gasUsed: 0, error: `> ${input}` }] });
    },

    n8nLogs: [],
    n8nStatus: 'idle',
    lastN8nResult: null,
    isN8nPanelOpen: false,
    clearN8nLogs: () => set({ n8nLogs: [] }),
    toggleN8nPanel: () => set((s) => ({ isN8nPanelOpen: !s.isN8nPanelOpen })),
    lastDamage: 0,
    lastDamageTs: 0,

    mineState: {
        stageId: 1, killsInStage: 0, stageGoal: 20, rockTier: 1,
        rockHp: fromNumber(100), rockMaxHp: fromNumber(100),
        gold: fromNumber(0), tickets: 0, gems: 0, premiumCredits: 0,
        lastTs: Date.now()
    },

    goldUpgrades: { dpsLevel: 0, goldBonusLevel: 0, autoLevel: 0 },
    buyGoldUpgrade: (type) => {
        const state = get();
        const upgrades = state.goldUpgrades;
        const currentGold = state.mineState.gold;

        const config = GOLD_UPGRADE_CONFIG[type];
        const currentLevel = upgrades[type === 'dps' ? 'dpsLevel' : type === 'gold' ? 'goldBonusLevel' : 'autoLevel'];
        const costVal = Math.floor(config.baseCost * Math.pow(config.growth, currentLevel));
        const cost = fromNumber(costVal);

        if (cmp(currentGold, cost) >= 0) {
            const nextLvl = currentLevel + 1;
            const newGold = sub(currentGold, cost);
            const newUpgrades = { ...upgrades };
            if (type === 'dps') newUpgrades.dpsLevel = nextLvl;
            if (type === 'gold') newUpgrades.goldBonusLevel = nextLvl;
            if (type === 'auto') newUpgrades.autoLevel = nextLvl;

            set({
                mineState: { ...state.mineState, gold: newGold },
                goldUpgrades: newUpgrades,
                executionLogs: [...state.executionLogs, {
                    nodeId: 'SHOP',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[UPGRADE] ${type.toUpperCase()} Lv.${nextLvl}`
                }]
            });
        } else {
            set({ executionLogs: [...state.executionLogs, { nodeId: 'SHOP', nodeKind: 'system', timestamp: Date.now(), gasUsed: 0, error: `Need ${formatBigNum(cost)} Gold` }] });
        }
    },

    isMiningAuto: false,
    toggleMiningAuto: () => set((s) => ({ isMiningAuto: !s.isMiningAuto })),
    runMine: async (elapsedSec = 0) => {
        const state = get();
        // Dynamic import workaround if needed or direct access
        // We need slot store access. But zustand stores are separate.
        // We can import `useSlotStore` inside.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useSlotStore } = require('@/store/slotStore');
        const { computeLoadout } = require('@/features/slots/utils');
        const equipped = ['TRIGGER', 'DAMAGE', 'GOLD', 'UTILITY'].map(t => useSlotStore.getState().getEquippedItem(t));
        const slotLoadoutStats = computeLoadout(equipped);

        const actualElapsed = elapsedSec > 0 ? elapsedSec : slotLoadoutStats.intervalSec;

        const { nodes, upgrades, premiumUpgrades, mineState, goldUpgrades } = state;
        const loadout = compileBlueprintToLoadout(nodes, upgrades.nodeLimit);

        // Calculate DPS
        const dpsMultiplier = 1 + (goldUpgrades.dpsLevel * 0.10);
        const rawBase = loadout.dps.m + slotLoadoutStats.dps; // Assuming simple base addition
        const totalBaseDps = rawBase * dpsMultiplier;
        const premDpsMul = Math.pow(1.15, premiumUpgrades.dpsLvl);
        const finalDps = totalBaseDps * premDpsMul;

        // Gold Bonus
        const goldBonusVal = goldUpgrades.goldBonusLevel * 5;
        const totalGoldBonus = (loadout.goldBonusPct || 0) + slotLoadoutStats.goldBonusPct + goldBonusVal;

        // Payload
        const apiLoadout = {
            ...loadout,
            dps: { m: finalDps, e: loadout.dps.e },
            goldBonusPct: totalGoldBonus,
            intervalSec: slotLoadoutStats.intervalSec
        };

        set({ n8nStatus: 'running' });

        try {
            // Mocking API call logic locally if server not available or using real logic?
            // Existing logic uses fetch /api/mine.
            const res = await fetch('/api/mine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ elapsedSec: actualElapsed, state: mineState, loadout: apiLoadout })
            });

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            // State Update
            const toBN = (v: any) => (v && typeof v === 'object' && 'm' in v) ? v : fromNumber(v || 0);

            const nextState: MineState = {
                rockHp: toBN(data.newState.rockHp),
                rockMaxHp: toBN(data.newState.rockMaxHp),
                rockTier: data.newState.rockTier,
                gold: toBN(data.newState.gold),
                lastTs: Date.now(),
                stageId: data.newState.stageId,
                killsInStage: data.newState.killsInStage,
                stageGoal: data.newState.stageGoal,
                tickets: data.newState.tickets ?? mineState.tickets,
                gems: data.newState.gems ?? mineState.gems,
                premiumCredits: mineState.premiumCredits
            };

            // Calc Damage
            let damage = 0;
            const hpBefore = toNumber(mineState.rockHp);
            const hpAfter = toNumber(nextState.rockHp);
            const rockChanged = nextState.rockTier !== mineState.rockTier || nextState.killsInStage !== mineState.killsInStage;
            if (rockChanged) damage = hpBefore;
            else damage = Math.max(0, hpBefore - hpAfter);

            set((s) => ({
                mineState: nextState,
                n8nStatus: 'ok',
                lastN8nResult: data,
                lastDamage: damage,
                lastDamageTs: Date.now(),
                executionLogs: [...s.executionLogs, ...(data.lines || []).map((l: string) => ({
                    nodeId: 'MINE', nodeKind: 'system', timestamp: Date.now(), gasUsed: 0, error: l
                }))]
            }));

        } catch (e: any) {
            set({ n8nStatus: 'error', isMiningAuto: false });
        }
    },

    nodeExecStatus: {},
    setNodeStatus: (id, status) => set((s) => ({ nodeExecStatus: { ...s.nodeExecStatus, [id]: status } })),

    premiumUpgrades: { dpsLvl: 0, goldLvl: 0, autoLvl: 0 },
    buyPremiumUpgrade: (type) => {
        const state = get();
        const upgrades = state.premiumUpgrades;
        const tickets = state.mineState.tickets;
        let cost = 0, nextLvl = 0;

        if (type === 'dps') { nextLvl = upgrades.dpsLvl + 1; cost = Math.ceil(2 * Math.pow(1.6, upgrades.dpsLvl)); }
        else if (type === 'gold') { nextLvl = upgrades.goldLvl + 1; cost = Math.ceil(3 * Math.pow(1.7, upgrades.goldLvl)); }
        else { nextLvl = upgrades.autoLvl + 1; cost = Math.ceil(5 * Math.pow(2.0, upgrades.autoLvl)); }

        if (tickets >= cost) {
            set({
                mineState: { ...state.mineState, tickets: tickets - cost },
                premiumUpgrades: { ...upgrades, [type === 'dps' ? 'dpsLvl' : type === 'gold' ? 'goldLvl' : 'autoLvl']: nextLvl }
            });
        }
    },

    processOfflineProgress: async () => {
        const now = Date.now();
        const lastSeen = parseInt(localStorage.getItem('n8ngame:lastSeenMs') || '0');
        localStorage.setItem('n8ngame:lastSeenMs', now.toString());
        if (lastSeen === 0 || lastSeen > now) return;

        const elapsedSec = Math.floor((now - lastSeen) / 1000);
        if (elapsedSec < 60) return;

        const CAP = 21600;
        const capped = Math.min(elapsedSec, CAP);

        const { runMine } = get();
        await runMine(capped);

        set((s) => ({ executionLogs: [...s.executionLogs, { nodeId: 'SYS', nodeKind: 'system', timestamp: now, gasUsed: 0, error: `[Offline] Processed ${Math.floor(capped / 60)}m` }] }));
    },
    refreshLastSeen: () => localStorage.setItem('n8ngame:lastSeenMs', Date.now().toString())

}), {
    name: 'flow-storage',
    version: 5,
    migrate: (persistedState: any, version: number) => {
        if (version < 5) {
            return {
                ...persistedState,
                goldUpgrades: { dpsLevel: 0, goldBonusLevel: 0, autoLevel: 0 }
            };
        }
        return persistedState;
    }
}));
