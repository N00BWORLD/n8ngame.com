import React from 'react';
import { cn } from '@/lib/utils';

interface NodeWrapperProps {
    children: React.ReactNode;
    title: string;
    icon?: React.ReactNode;
    colorClass?: string;
    selected?: boolean;
    executionStatus?: 'idle' | 'running' | 'success' | 'error';
}

export function NodeWrapper({ children, title, icon, colorClass, selected, executionStatus }: NodeWrapperProps) {
    return (
        <div
            className={cn(
                "flex min-w-[150px] flex-col rounded-md border bg-card text-card-foreground shadow-sm transition-all duration-200",
                selected ? "ring-2 ring-primary" : "border-border",
                executionStatus === 'running' && "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400 animate-pulse",
                executionStatus === 'success' && "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] ring-1 ring-green-400 scale-105",
                executionStatus === 'error' && "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400",
                colorClass
            )}
        >
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
