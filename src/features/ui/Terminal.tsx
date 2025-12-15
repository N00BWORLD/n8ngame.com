import { useEffect, useRef, useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export function Terminal() {
    const logs = useFlowStore((state) => state.executionLogs);
    const clearLogs = useFlowStore((state) => state.clearLogs);
    const runText = useFlowStore((state) => state.runText);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            runText(inputValue);
            setInputValue(''); // Clear input
        }
    };

    // Always render panel (even if empty, to show input)
    // if (logs.length === 0) return null; // REMOVED



    return (
        <div className="absolute bottom-0 left-0 right-0 z-40 flex h-[350px] flex-col glass-panel border-t shadow-2xl backdrop-blur-xl bg-black/80">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-white/5">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Terminal Link
                </h3>
                <button
                    onClick={clearLogs}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                    Clear Output
                </button>
            </div>

            {/* Logs Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs flex flex-col gap-1">
                {logs.length === 0 && (
                    <div className="text-muted-foreground/30 italic mt-auto">System ready. Awaiting input...</div>
                )}

                {logs.map((log, i) => (
                    <div key={i} className={cn(
                        "flex items-start gap-2 break-all",
                        log.error ? "text-red-400" : "text-gray-300"
                    )}>
                        <span className="opacity-30 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={cn(
                            "font-bold whitespace-nowrap",
                            log.nodeKind === 'trigger' && "text-green-400", // User
                            log.nodeKind === 'action' && "text-blue-400",   // Game
                            log.nodeKind === 'system' && "text-yellow-400", // System/Error
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

            {/* Input Area */}
            <div className="p-2 border-t border-white/10 bg-black/50">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-white/20 bg-white/5 focus-within:border-green-500/50 focus-within:bg-white/10 transition-all">
                    <span className="text-green-500 font-mono font-bold">{'>'}</span>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type command..."
                        className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-gray-600"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}
