import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

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

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            className={cn(
                "group relative flex min-w-[150px] flex-col rounded-md border bg-card text-card-foreground shadow-sm transition-all duration-200",
                selected ? "ring-2 ring-primary" : "border-border",
                executionStatus === 'running' && "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400 animate-pulse",
                executionStatus === 'success' && "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] ring-1 ring-green-400 scale-105",
                executionStatus === 'error' && "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400",
                colorClass
            )}
        >
            {/* Delete Button (Mission 21-C) */}
            <button
                onClick={handleDelete}
                className="absolute -top-3 -right-3 z-50 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 sm:opacity-0 focus:opacity-100 active:opacity-100"
                title="Delete Node"
                aria-label="Delete Node"
            >
                <X className="h-3 w-3" />
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
