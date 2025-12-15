import { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Terminal } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';
import { useSlotStore } from '@/store/slotStore';

export function LogsPanel() {
    const { executionLogs } = useFlowStore();
    const { ui, toggleLogs } = useSlotStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (scrollRef.current && ui.logsOpen) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [executionLogs, ui.logsOpen]);

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-white/10 transition-all duration-300 z-30 flex flex-col",
                ui.logsOpen ? "h-[35vh]" : "h-12"
            )}
        >
            {/* Header / Toggle */}
            <button
                onClick={toggleLogs}
                className="flex items-center justify-between px-4 h-12 w-full hover:bg-white/5"
            >
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <Terminal className="w-3 h-3" />
                    <span>SYSTEM LOGS</span>
                    <span className="bg-white/10 px-1.5 rounded-full text-[10px]">{executionLogs.length}</span>
                </div>
                {ui.logsOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
            </button>

            {/* Content */}
            {ui.logsOpen && (
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 pt-0 font-mono text-xs space-y-1"
                >
                    {executionLogs.length === 0 && (
                        <div className="text-gray-600 italic">No logs yet...</div>
                    )}
                    {executionLogs.map((log, i) => (
                        <div key={i} className={cn(
                            "break-words",
                            log.error ? "text-red-400" : "text-green-400/80"
                        )}>
                            <span className="opacity-30 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            {log.error || "Executed successfully"}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
