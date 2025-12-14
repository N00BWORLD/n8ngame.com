import { Play, Square } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export function RunToolbar() {
    const runGraph = useFlowStore((state) => state.runGraph);
    const isRunning = useFlowStore((state) => state.isRunning);

    return (
        <div className="absolute top-4 right-4 z-50">
            <button
                onClick={runGraph}
                disabled={isRunning}
                className={cn(
                    "flex items-center gap-2 rounded-lg glass-panel px-4 py-2 text-sm font-medium cyber-button",
                    isRunning && "opacity-50 cursor-not-allowed border-red-500 text-red-500"
                )}
            >
                {isRunning ? (
                    <>
                        <Square className="h-4 w-4 animate-pulse fill-current" />
                        Running...
                    </>
                ) : (
                    <>
                        <Play className="h-4 w-4 fill-current" />
                        Run Flow
                    </>
                )}
            </button>
        </div>
    );
}
