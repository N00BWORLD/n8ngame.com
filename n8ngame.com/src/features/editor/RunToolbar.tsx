
import { Play, RotateCcw, Settings, Globe, Cpu, Zap, Package, Trophy, HelpCircle } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useState } from 'react';
import { SettingsModal } from '@/features/settings/SettingsModal';

export function RunToolbar() {
    const { isRunning, executionLogs, runGraph, clearLogs, executionMode, setExecutionMode, toBlueprint, setInventoryOpen, refreshInventory, setMissionOpen, setMissions, setHelpOpen } = useFlowStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isN8NRunning, setIsN8NRunning] = useState(false);

    // Status text
    const statusText = (isRunning || isN8NRunning) ? 'Running...' : (executionLogs.length > 0 ? 'Completed' : 'Ready');

    const handleRunN8N = async () => {
        if (isN8NRunning) return;
        setIsN8NRunning(true);
        clearLogs();

        try {
            const blueprint = toBlueprint();

            // Temporary Token Handling (Mission 11-C)
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

            // Map string logs to ExecutionLog format
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
                // Refresh Inventory
                refreshInventory();

                data.rewards.forEach((r: any) => {
                    n8nLogs.push({
                        nodeId: 'REWARD',
                        nodeKind: 'variable',
                        timestamp: Date.now() + logOffset++,
                        gasUsed: 0,
                        error: `Acquired: ${r.itemType} x${r.qty}`
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
                            nodeKind: 'trigger', // Highlight color?
                            timestamp: Date.now() + logOffset++,
                            gasUsed: 0,
                            error: `COMPLETED: ${m.title}`
                        });
                    }
                });
            }
            if (data.missionRewards) {
                // Mission rewards are already combined in data.rewards in our API logic.
                // So we don't need to iterate them again for logging if we logged data.rewards.
                // data.missionRewards is mostly for specific UI handling if needed.
            }

            // Direct Store Update
            useFlowStore.setState({ executionLogs: n8nLogs });

        } catch (error: any) {
            useFlowStore.setState({
                executionLogs: [{
                    nodeId: 'n8n',
                    nodeKind: 'system',
                    timestamp: Date.now(),
                    gasUsed: 0,
                    error: `Failed: ${error.message}`
                }]
            });
        } finally {
            setIsN8NRunning(false);
        }
    };

    return (
        <>
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 rounded-lg glass-panel p-2">
                <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
                    <div className="flex rounded-lg bg-black/40 p-1">
                        <button
                            onClick={() => setExecutionMode('local')}
                            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${executionMode === 'local'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Cpu className="h-3.5 w-3.5" />
                            Local
                        </button>
                        <button
                            onClick={() => setExecutionMode('remote')}
                            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${executionMode === 'remote'
                                ? 'bg-cyan-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Globe className="h-3.5 w-3.5" />
                            Remote
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
                        <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>

                    {/* Mission 11-C: Run via n8n */}
                    <button
                        onClick={handleRunN8N}
                        disabled={isRunning || isN8NRunning}
                        className={`flex items-center gap-2 rounded px-4 py-2 font-bold text-white transition-all
                            ${isN8NRunning
                                ? 'bg-orange-800 cursor-not-allowed'
                                : 'bg-gradient-to-r from-orange-600 to-red-500 hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/20'
                            }`}
                        title="Execute via n8n Webhook"
                    >
                        <Zap className={`h-4 w-4 ${isN8NRunning ? 'animate-pulse' : 'fill-current'}`} />
                        <span>{isN8NRunning ? 'n8n...' : 'n8n'}</span>
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    {/* Mission 11-E: Inventory */}
                    <button
                        onClick={() => setInventoryOpen(true)}
                        className="rounded p-2 text-purple-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="Inventory"
                    >
                        <Package className="h-4 w-4" />
                    </button>

                    {/* Mission 11-F: Missions */}
                    <button
                        onClick={() => setMissionOpen(true)}
                        className="rounded p-2 text-yellow-500 hover:bg-white/10 hover:text-white transition-colors"
                        title="Missions"
                    >
                        <Trophy className="h-4 w-4" />
                    </button>

                    {/* Mission 11-H: Help */}
                    <button
                        onClick={() => setHelpOpen(true)}
                        className="rounded p-2 text-blue-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="Help"
                    >
                        <HelpCircle className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="rounded p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="Configuration"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`h-2 w-2 rounded-full ${(isRunning || isN8NRunning) ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-gray-400">{statusText}</span>
                    </div>

                    {executionLogs.length > 0 && (
                        <button
                            onClick={clearLogs}
                            className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
