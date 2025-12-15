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
                "group relative flex min-w-[150px] flex-col rounded-md border bg-card text-card-foreground shadow-sm transition-all duration-200",
                selected ? "ring-2 ring-primary" : "border-border",
                // Existing Execution Status Styles
                executionStatus === 'running' && "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400 animate-pulse",
                executionStatus === 'success' && "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] ring-1 ring-green-400 scale-105",
                executionStatus === 'error' && "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400",
                // Mission 23-C: Visual Execution Highlight (Highest Priority)
                isVisualActive && "border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105 z-50 transition-all duration-75",
                colorClass
            )}
        >
            {/* Delete Button */}
            <button
                onClick={handleDelete}
                className={cn(
                    "absolute -top-3 -right-3 z-50 p-1 bg-red-500 text-white rounded-full transition-all shadow-md hover:bg-red-600 focus:outline-none scroll-m-2",
                    // Mobile: Always visible if selected, otherwise opacity-0 but accessible
                    // Desktop: group-hover visible
                    selected ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100"
                )}
                title="Delete Node"
                aria-label="Delete Node"
            >
                <X className="h-4 w-4" />
            </button>
            {/* Mobile Touch Target for Delete (Always visible or larger hit area on mobile? For now, standard button but ensuring z-index) */}

            <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2 text-sm font-medium">
                {icon && <span className="h-4 w-4">{icon}</span>}
                {title}
            </div>
            <div className="p-3 text-xs">
                {children}
            </div>
        </div>
    );
}
