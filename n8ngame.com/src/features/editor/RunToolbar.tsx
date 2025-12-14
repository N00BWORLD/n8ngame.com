import { Play, RotateCcw, Settings, Globe, Cpu, Zap } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useState } from 'react';
import { SettingsModal } from '@/features/settings/SettingsModal';

export function RunToolbar() {
    const { isRunning, executionLogs, runGraph, clearLogs, executionMode, setExecutionMode, toBlueprint } = useFlowStore();
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

            // Direct Store Update (using internal setState would be better but we only have public API)
            // We need to inject logs. 'executionLogs' is readonly in store interface? 
            // set({ executionLogs }) is internal.
            // Oh right, we can't set logs directly from here via `useFlowStore` returned object unless we expose a setter.
            // `runGraph` sets logs. 
            // We might need to extend the store.
            // OR: Hack: Just use `useFlowStore.setState({ executionLogs: ... })` which is available on the store instance itself.
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
                        <span>{isRunning ? 'Run' : 'Run'}</span>
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
