
import { Play, RotateCcw, Settings, Globe, Cpu, Zap, Package, Trophy, HelpCircle, Repeat, ShoppingCart, SquareTerminal, BookTemplate } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useSlotStore } from '@/store/slotStore';
import { computeLoadout } from '@/features/slots/utils';
import { useState, useEffect } from 'react';
import { SettingsModal } from '@/features/settings/SettingsModal';
import { PresetModal } from '@/features/editor/PresetModal';
import { useUiStore } from '@/store/uiStore';

import { formatBigNum } from '@/lib/bigNum';

export function RunToolbar() {
    const { isRunning, executionLogs, runGraph, clearLogs, executionMode, setExecutionMode, toBlueprint, setInventoryOpen, refreshInventory, setMissionOpen, setMissions, setHelpOpen, setLastExecutionResult, setResultOpen, credits, isMiningAuto, toggleMiningAuto, setShopOpen, upgrades, isTerminalOpen, setTerminalOpen, setPresetOpen, runMine } = useFlowStore();

    const { t } = useUiStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isN8NRunning, setIsN8NRunning] = useState(false);
    const [serverHealthy, setServerHealthy] = useState(true);

    // Status text
    const statusText = (isRunning || isN8NRunning)
        ? t('ui.status.running')
        : (executionLogs.length > 0 ? t('ui.status.completed') : t('ui.status.ready'));

    // Mission 22-B: Loadout Integration
    const { getEquippedItem } = useSlotStore();

    // Compute Interval from Loadout
    const equippedItems = ['TRIGGER', 'DAMAGE', 'GOLD', 'UTILITY'].map(type =>
        getEquippedItem(type as any)
    );
    const loadout = computeLoadout(equippedItems);
    const tickIntervalMs = loadout.intervalSec * 1000;

    // Auto Run Loop (Mission 13 + 22-B)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMiningAuto) {
            // Immediate run? Maybe.
            // runMine();
            interval = setInterval(() => {
                runMine(0);
            }, tickIntervalMs);
        }
        return () => clearInterval(interval);
    }, [isMiningAuto, tickIntervalMs, runMine]);

    // Initial Server Check (omitted for brevity, unchanged)
    useEffect(() => {
        const checkServer = async () => {
            try {
                // Determine API URL based on environment or default to relative
                // In local development (Vite), this proxies to the backend if configured
                // On Vercel (static frontend), this might fail or 404
                const res = await fetch('/api/health');
                if (res.ok) {
                    setServerHealthy(true);
                } else {
                    setServerHealthy(false);
                    setExecutionMode('local');
                }
            } catch (e) {
                setServerHealthy(false);
                setExecutionMode('local');
            }
        };
        checkServer();
    }, [setExecutionMode]);

    const handleRemoteClick = () => {
        if (!serverHealthy) return;
        setExecutionMode('remote');
    };

    // handleRunN8N omitted (unchanged)
    const handleRunN8N = async () => {
        if (isN8NRunning) return;
        setIsN8NRunning(true);
        clearLogs();

        try {
            const blueprint = toBlueprint();
            const token = localStorage.getItem('sb-access-token') || 'mock-token-if-dev';

            const response = await fetch('/api/execute-blueprint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ blueprint: blueprint.graph })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error: ${response.status} ${errText}`);
            }

            const data = await response.json();

            const n8nLogs = (data.logs || []).map((msg: string, i: number) => ({
                nodeId: 'n8n',
                nodeKind: 'system',
                timestamp: Date.now() + i,
                gasUsed: 0,
                error: msg
            }));

            let logOffset = 100;

            // Mission 11-D-2: Execution Rewards
            if (data.rewards && data.rewards.length > 0) {
                refreshInventory();

                data.rewards.forEach((r: any) => {
                    n8nLogs.push({
                        nodeId: 'REWARD',
                        nodeKind: 'variable',
                        timestamp: Date.now() + logOffset++,
                        gasUsed: 0,
                        error: `[${t('terminal.reward')}] ${r.itemType} x${r.qty}`
                    });
                });
            }

            // Mission 11-F-2: Mission Status & Special Rewards
            if (data.missions) {
                setMissions(data.missions);
                data.missions.forEach((m: any) => {
                    if (m.justCompleted) {
                        n8nLogs.push({
                            nodeId: 'MISSION',
                            nodeKind: 'trigger',
                            timestamp: Date.now() + logOffset++,
                            gasUsed: 0,
                            error: `[MISSION] Completed: ${m.title}`
                        });
                    }
                });
            }

            // Explicit Mission Rewards Logging
            if (data.missionRewards && data.missionRewards.length > 0) {
                data.missionRewards.forEach((r: any) => {
                    n8nLogs.push({
                        nodeId: 'REWARD',
                        nodeKind: 'variable',
                        timestamp: Date.now() + logOffset++,
                        gasUsed: 0,
                        error: `[REWARD] ${r.itemType} x${r.qty}`
                    });
                });
            }

            useFlowStore.setState({ executionLogs: n8nLogs });

            // Mission 12-A: Result Card
            setLastExecutionResult(data);
            setResultOpen(true);

        } catch (error: any) {
            useFlowStore.setState({
                executionLogs: [{
                    nodeId: 'n8n',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `[${t('terminal.error')}] ${error.message}`
                }]
            });
        } finally {
            setIsN8NRunning(false);
        }
    };

    return (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 max-w-full overflow-visible">
            {/* Status Indicator & Reset */}
            <div className="flex items-center gap-2 flex-shrink-0 order-1">
                <div className="flex items-center gap-2 text-xs" title={statusText}>
                    <span className={`h-2 w-2 rounded-full ${(isRunning || isN8NRunning) ? 'bg-yellow-400 animate-pulse' : (serverHealthy ? 'bg-green-500' : 'bg-red-500')}`} />
                    <span className="text-gray-400 hidden lg:inline">{statusText} {(!serverHealthy && !isRunning && !isN8NRunning) ? '(Offline)' : ''}</span>
                </div>

                {executionLogs.length > 0 && (
                    <button
                        onClick={clearLogs}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 ml-2"
                        title={t('btn.reset')}
                    >
                        <RotateCcw className="h-3 w-3" />
                    </button>
                )}
            </div>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex rounded-lg bg-white/5 p-1">
                    <button
                        onClick={() => setExecutionMode('local')}
                        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${executionMode === 'local'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Cpu className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Local</span>
                    </button>

                    <div className="relative group">
                        <button
                            onClick={handleRemoteClick}
                            disabled={!serverHealthy}
                            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${executionMode === 'remote'
                                ? 'bg-cyan-600 text-white'
                                : (!serverHealthy ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white')
                                }`}
                        >
                            <Globe className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Remote</span>
                        </button>
                        {!serverHealthy && (
                            <div className="absolute top-full right-0 mt-2 w-max px-2 py-1 bg-gray-900 text-xs text-gray-300 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none">
                                Server Required (UM890/Docker)
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1" />

                {/* Mission 13: Credits & Gas HUD */}
                <div className="flex items-center gap-3 px-3 py-1 bg-black/50 rounded-lg border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-1.5" title="Execution Budget (Variable)">
                        <Zap className="h-3 w-3 text-cyan-400 fill-cyan-400/50" />
                        <span className="text-sm font-mono font-bold text-cyan-100">
                            {15 + (upgrades.maxGas * 15)}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/20" />

                    {/* Mission 15-A: Node Count Display */}
                    <div className="flex items-center gap-1.5" title="Node Usage">
                        <Cpu className="h-3 w-3 text-purple-400" />
                        <span className="text-xs font-mono text-purple-100">
                            {useFlowStore.getState().nodes.length}/{2 + upgrades.nodeLimit}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/20" />

                    <div className="flex items-center gap-1.5" title="Project Credits">
                        <span className="text-[10px] text-yellow-500 font-bold tracking-wider">CR</span>
                        <span className="text-lg font-mono font-bold text-white is-neon tracking-wide">{formatBigNum(credits)}</span>
                    </div>

                    {/* Shop Button */}
                    <button
                        onClick={() => setShopOpen(true)}
                        className="ml-2 rounded p-1 text-yellow-500 hover:bg-yellow-500/20 hover:scale-110 transition-all border border-yellow-500/30"
                        title="Open Shop"
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1" />

                <button
                    onClick={runGraph}
                    disabled={isRunning || isN8NRunning}
                    className={`flex items-center gap-2 rounded px-4 py-2 font-bold text-white transition-all
                        ${isRunning
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:scale-105 active:scale-95 shadow-lg shadow-green-900/20'
                        }`}
                >
                    <Play className={`h-4 w-4 ${isRunning ? 'animate-pulse' : 'fill-current'}`} />
                    <span className="hidden sm:inline">{isRunning ? t('ui.status.running') : t('btn.run')}</span>
                </button>

                {/* Mission 13: Auto Run Toggle */}
                <button
                    onClick={toggleMiningAuto}
                    disabled={isRunning && !isMiningAuto}
                    className={`flex items-center gap-2 rounded px-3 py-2 font-bold text-white transition-all
                        ${isMiningAuto
                            ? 'bg-green-600 outline outline-2 outline-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    title={`Toggle Auto Run`}
                >
                    <Repeat className={`h-4 w-4 ${isMiningAuto ? 'animate-spin-slow' : ''}`} />
                    <span className="ml-1 text-[10px] font-mono">
                        {(() => {
                            const base = 600;
                            const red = upgrades.tickSpeed * 30; // 30s per upgrade
                            const final = Math.max(60, base - red);
                            return `${Math.floor(final / 60)}m`;
                        })()}
                    </span>
                </button>

                {/* Mission 11-C: Run via n8n */}
                <button
                    onClick={handleRunN8N}
                    disabled={isRunning || isN8NRunning || !serverHealthy}
                    className={`flex items-center gap-2 rounded px-4 py-2 font-bold text-white transition-all
                    ${isN8NRunning || !serverHealthy
                            ? 'bg-gray-700 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-600 to-red-500 hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/20'
                        }`}
                    title={t('btn.runViaN8n')}
                >
                    <Zap className={`h-4 w-4 ${isN8NRunning ? 'animate-pulse' : 'fill-current'}`} />
                    <span className="hidden lg:inline">{isN8NRunning ? 'n8n...' : 'n8n'}</span>
                </button>

                <div className="h-6 w-px bg-white/10 mx-1" />

                {/* Mission 21-B: Presets */}
                <button
                    onClick={() => setPresetOpen(true)}
                    className="rounded p-2 text-cyan-400 hover:bg-white/10 hover:text-white transition-colors"
                    title="Node Presets"
                >
                    <BookTemplate className="h-4 w-4" />
                </button>

                <div className="h-6 w-px bg-white/10 mx-1" />

                {/* Mission 11-E: Inventory */}
                <button
                    onClick={() => setInventoryOpen(true)}
                    className="rounded p-2 text-purple-400 hover:bg-white/10 hover:text-white transition-colors"
                    title={t('btn.inventory')}
                >
                    <Package className="h-4 w-4" />
                </button>

                {/* Mission 11-F: Missions */}
                <div className="relative group">
                    <button
                        onClick={() => { if (serverHealthy) setMissionOpen(true) }}
                        disabled={!serverHealthy}
                        className={`rounded p-2 text-yellow-500 transition-colors ${serverHealthy ? 'hover:bg-white/10 hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
                        title={t('btn.missions')}
                    >
                        <Trophy className="h-4 w-4" />
                    </button>
                </div>

                {/* Mission 11-H: Help */}
                <button
                    onClick={() => setHelpOpen(true)}
                    className="rounded p-2 text-blue-400 hover:bg-white/10 hover:text-white transition-colors"
                    title={t('btn.help')}
                >
                    <HelpCircle className="h-4 w-4" />
                </button>

                {/* Mission 20-M: Terminal Toggle */}
                <button
                    onClick={() => setTerminalOpen(!isTerminalOpen)}
                    className={`rounded p-2 transition-colors ${isTerminalOpen ? 'text-green-400 bg-white/10' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    title="Toggle Terminal"
                >
                    <SquareTerminal className="h-4 w-4" />
                </button>

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="rounded p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    title={t('btn.settings')}
                >
                    <Settings className="h-4 w-4" />
                </button>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <PresetModal />
        </div>
    );
}
