import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '@/store/flowStore';

interface NodeWrapperProps {
    children: React.ReactNode;
    id: string; // Mission 21-C: ID required for delete
    title: string;
    icon?: React.ReactNode;
    colorClass?: string;
    selected?: boolean;
    executionStatus?: 'idle' | 'running' | 'success' | 'error';
}

export function NodeWrapper({ children, id, title, icon, colorClass, selected, executionStatus }: NodeWrapperProps) {
    const { deleteElements } = useReactFlow();
    // Mission 23-C: Visual Highlight
    const isVisualActive = useFlowStore((s) => s.visualNodeId === id);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            className={cn(
                "group relative flex min-w-[180px] flex-col rounded-xl border-2 bg-white text-slate-900 shadow-lg transition-all duration-200 overflow-hidden",
                selected ? "border-blue-500 shadow-blue-500/20" : "border-slate-100",
                // Mission 23-C: Visual Execution Highlight (Highest Priority)
                isVisualActive && "border-cyan-400 ring-4 ring-cyan-400/30 scale-105 z-50 transition-all duration-75",
                colorClass
            )}
        >
            {/* Delete Button */}
            <button
                onClick={handleDelete}
                className={cn(
                    "absolute top-1 right-1 z-[60] p-1.5 bg-slate-50 text-slate-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 border border-slate-100",
                    selected && "opacity-100"
                )}
                title="Delete Node"
            >
                <X className="h-3.5 w-3.5" />
            </button>

            {/* n8n Style Header */}
            <div className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-white",
                title === 'Trigger' ? "bg-orange-500" :
                    title === 'Action' ? "bg-blue-600" : "bg-purple-600"
            )}>
                {icon && <span className="h-4 w-4 drop-shadow-sm">{icon}</span>}
                <span className="truncate">{title}</span>
            </div>

            {/* Execution Status Indicators (Subtle) */}
            {executionStatus && executionStatus !== 'idle' && (
                <div className={cn(
                    "absolute top-2 left-2 w-2 h-2 rounded-full animate-pulse z-50",
                    executionStatus === 'running' ? "bg-blue-400" :
                        executionStatus === 'success' ? "bg-green-500" : "bg-red-500"
                )} />
            )}

            <div className="p-4 text-xs font-medium text-slate-600 bg-white">
                {children}
            </div>
        </div>
    );
}
