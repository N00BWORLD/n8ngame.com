import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';
import { X, ExternalLink, Activity, Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatBigNum } from '@/lib/bigNum';

export function N8nPanel() {
    const {
        isN8nPanelOpen,
        toggleN8nPanel,
        n8nLogs,
        n8nStatus,
        lastN8nResult
    } = useFlowStore();

    // We want logs to scroll naturally, but they are prepended.
    // So the top of the list is the newest log.
    // A simple list is fine.

    if (!isN8nPanelOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
                onClick={toggleN8nPanel}
            />

            {/* Panel */}
            <div className="relative bg-[#1a1a20] w-full max-h-[80vh] rounded-t-2xl flex flex-col pointer-events-auto border-t border-white/10 shadow-2xl overflow-hidden pb-8 animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1a1a20] z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">n8n Live View</h2>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    n8nStatus === 'running' ? "bg-yellow-400 animate-pulse" :
                                        n8nStatus === 'error' ? "bg-red-500" :
                                            n8nStatus === 'ok' ? "bg-green-500" : "bg-gray-500"
                                )} />
                                <span className={cn(
                                    "text-xs font-medium uppercase tracking-wider",
                                    n8nStatus === 'running' ? "text-yellow-400" :
                                        n8nStatus === 'error' ? "text-red-400" :
                                            n8nStatus === 'ok' ? "text-green-400" : "text-gray-400"
                                )}>
                                    {n8nStatus === 'running' ? 'EXECUTING...' :
                                        n8nStatus === 'error' ? 'CONNECTION ERROR' :
                                            n8nStatus === 'ok' ? 'OPERATIONAL' : 'IDLE'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={toggleN8nPanel}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Connection Info Card */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Server className="w-3.5 h-3.5" />
                            Connection Details
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                <span className="text-white/40 text-sm">Proxy Endpoint</span>
                                <code className="text-orange-400 text-xs font-mono bg-orange-950/30 px-2 py-1 rounded">
                                    POST /api/mine
                                </code>
                            </div>

                            {import.meta.env.VITE_N8N_STUDIO_URL && (
                                <a
                                    href={import.meta.env.VITE_N8N_STUDIO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors rounded-lg px-3 py-2 group cursor-pointer border border-blue-500/20"
                                >
                                    <span className="text-blue-400 text-sm font-medium">Open n8n Studio</span>
                                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Last Execution Summary */}
                    {n8nStatus === 'ok' && lastN8nResult && (
                        <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-500/20">
                            <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Last Execution
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/20 p-2 rounded-lg">
                                    <div className="text-white/40 text-[10px]">GOLD EARNED</div>
                                    <div className="text-emerald-400 font-mono text-sm">
                                        +{lastN8nResult.rewards?.gold?.m ? formatBigNum(lastN8nResult.rewards.gold) : '0'}
                                    </div>
                                </div>
                                <div className="bg-black/20 p-2 rounded-lg">
                                    <div className="text-white/40 text-[10px]">STAGE</div>
                                    <div className="text-white font-mono text-sm">
                                        {lastN8nResult.newState?.stageId || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {n8nStatus === 'error' && (
                        <div className="bg-red-950/20 rounded-xl p-4 border border-red-500/20 animate-pulse">
                            <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Connection Failed
                            </h3>
                            <p className="text-red-300/80 text-sm">
                                Unable to reach n8n workflow. Retrying in background...
                            </p>
                        </div>
                    )}

                    {/* Logs Console */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">Live Logs</h3>
                            <span className="text-white/20 text-[10px] font-mono">{n8nLogs.length} EVENTS</span>
                        </div>
                        <div className="bg-black rounded-xl p-3 h-48 overflow-y-auto font-mono text-xs border border-white/10 space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {n8nLogs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-white/20 italic">
                                    Waiting for workflow execution...
                                </div>
                            ) : (
                                n8nLogs.map((log, i) => (
                                    <div key={i} className="text-white/70 border-b border-white/5 pb-1 last:border-0 last:pb-0 break-all">
                                        <span className="text-white/30 mr-2 select-none">&gt;</span>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
