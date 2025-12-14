import { useEffect, useRef } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export function Terminal() {
    const logs = useFlowStore((state) => state.executionLogs);
    const clearLogs = useFlowStore((state) => state.clearLogs);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (logs.length === 0) return null;

    const reversedLogs = [...logs].reverse();

    return (
        <div className="absolute bottom-0 left-0 right-0 z-40 flex max-h-[300px] flex-col glass-panel border-t">
            <div className="flex items-center justify-between border-b px-4 py-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Execution Terminal</h3>
                <button
                    onClick={clearLogs}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                    Clear
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                {reversedLogs.length === 0 ? (
                    <div className="text-muted-foreground/50 italic">Ready to execute...</div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {reversedLogs.map((log, i) => (
                            <div key={i} className={cn(
                                "flex items-start gap-2",
                                log.error ? "text-red-500" : "text-muted-foreground"
                            )}>
                                <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={cn(
                                    "font-medium",
                                    log.nodeKind === 'trigger' && "text-green-500",
                                    log.nodeKind === 'action' && "text-blue-500",
                                    log.nodeKind === 'variable' && "text-orange-500",
                                )}>
                                    {log.nodeId}:
                                </span>
                                <span>
                                    {log.error || "Executed"}
                                    {log.gasUsed > 0 && ` (-${log.gasUsed} gas)`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
