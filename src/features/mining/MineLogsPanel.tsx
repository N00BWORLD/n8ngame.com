import { useState, useRef } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { ChevronUp, ChevronDown, Terminal, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MineLogsPanel() {
    const { n8nLogs, n8nStatus, clearN8nLogs } = useFlowStore();
    const [isCollapsed, setIsCollapsed] = useState(false); // Default open on desktop, maybe closed on mobile?
    const scrollRef = useRef<HTMLDivElement>(null);

    // Merge n8n logs and execution logs? Or just n8n logs as requested "Lines from n8n"?
    // The previous N8nPanel used `n8nLogs`. Let's stick to that for "Mine Logs".
    // Or maybe combine? The user said "Logs Panel (Terminal) Improvement".
    // I will primarily show n8nLogs (Live) but maybe executionLogs are system errors. 
    // Let's show n8nLogs as they are the "Mining" feedback.

    // Auto-scroll to top (since we prepend logs usually, scroll to top is natural if prepended. 
    // If we append, we scroll bottom. flowStore implementation of n8nLogs prepends: `[newLog, ...state.n8nLogs]`.
    // So "Top" is newest.

    // UI Constraint: height 18-24%.

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f] border-t border-white/10 transition-all duration-300 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] flex flex-col md:left-auto md:right-0 md:w-[600px] md:border-l md:rounded-tl-xl",
                isCollapsed ? "h-9" : "h-[22vh]"
            )}
        >
            {/* Header / Toolbar */}
            <div
                className="flex items-center justify-between px-3 h-9 bg-[#141419] cursor-pointer hover:bg-[#1c1c22] transition-colors select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">System Terminal</span>
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full ml-1",
                        n8nStatus === 'running' ? "bg-yellow-400 animate-pulse" :
                            n8nStatus === 'error' ? "bg-red-500" : "bg-green-500"
                    )} />
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); clearN8nLogs(); }}
                        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors"
                        title="Clear Logs"
                    >
                        <Eraser className="w-3 h-3" />
                    </button>
                    <div className="w-px h-3 bg-white/10 mx-1" />
                    {isCollapsed ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                </div>
            </div>

            {/* Logs Content */}
            {!isCollapsed && (
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-2 font-mono text-[10px] sm:text-xs space-y-1 bg-black/50 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    {n8nLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/20 italic">
                            // Ready for connection...
                        </div>
                    ) : (
                        n8nLogs.map((log, i) => (
                            <div key={i} className="text-white/70 border-b border-white/5 pb-0.5 last:border-0 break-all leading-relaxed">
                                <span className="text-cyan-500/50 mr-2 select-none">$</span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
