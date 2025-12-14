import React from 'react';
import { cn } from '@/lib/utils';

interface NodeWrapperProps {
    children: React.ReactNode;
    title: string;
    icon?: React.ReactNode;
    colorClass?: string;
    selected?: boolean;
}

export function NodeWrapper({ children, title, icon, colorClass, selected }: NodeWrapperProps) {
    return (
        <div
            className={cn(
                "flex min-w-[150px] flex-col rounded-md border bg-card text-card-foreground shadow-sm transition-all",
                selected ? "ring-2 ring-primary" : "border-border",
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
