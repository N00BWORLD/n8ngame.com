import { useState, useRef } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { ChevronUp, ChevronDown, Terminal, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MineLogsPanel() {
    const { n8nLogs, n8nStatus, clearN8nLogs } = useFlowStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter to last 30 logs as requested
    const visibleLogs = n8nLogs.slice(0, 30);

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f] border-t border-white/10 transition-all duration-300 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] flex flex-col md:left-auto md:right-0 md:w-[600px] md:border-l md:rounded-tl-xl",
                isCollapsed ? "h-9" : "h-[22vh]"
            )}
        >
            {/* Header / Toolbar */}
            <div
                className="flex items-center justify-between px-3 h-9 bg-[#141419] cursor-pointer hover:bg-[#1c1c22] transition-colors select-none border-b border-white/5"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Terminal</span>
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
                    {isCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-white/50" /> : <ChevronDown className="w-3.5 h-3.5 text-white/50" />}
                </div>
            </div>

            {/* Logs Content */}
            {!isCollapsed && (
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 bg-black/90 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    {visibleLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/20 italic">
                            // Ready for connection...
                        </div>
                    ) : (
                        visibleLogs.map((log, i) => {
                            const isClear = log.includes("Stage") && log.includes("Clear");
                            const isBroken = log.includes("broken") || log.includes("defeated");
                            const isError = log.includes("Error");
                            const isSuccess = log.includes("Success");

                            return (
                                <div key={i} className={cn(
                                    "text-white/70 border-b border-white/5 pb-0.5 last:border-0 break-all leading-tight flex",
                                    isClear ? "text-green-400 font-bold py-0.5" :
                                        isBroken ? "text-yellow-400" :
                                            isError ? "text-red-400" :
                                                isSuccess ? "text-cyan-300" : ""
                                )}>
                                    <span className="text-cyan-500/50 mr-2 select-none opacity-50">{'>'}</span>
                                    <span>{log}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
