import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import type { AppNode } from '../types';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export function ActionNode({ id, data, selected }: NodeProps<AppNode>) {
    const onHandleClick = useFlowStore((state) => state.onHandleClick);
    const pendingConnection = useFlowStore((state) => state.pendingConnection);
    // Mission 14-A: Execution Status
    const executionStatus = useFlowStore((state) => state.nodeExecStatus[id]);

    const isSourcePending = pendingConnection?.nodeId === id && pendingConnection?.type === 'source';
    // Target doesn't usually glow as pending source, but we could highlight valid targets?
    // For now, only source glows when it is the pending start.

    return (
        <NodeWrapper
            title="Action"
            icon={<Zap className="h-4 w-4" />}
            colorClass="border-blue-500/50 hover:border-blue-500"
            selected={selected}
            executionStatus={executionStatus}
        >
            <div className="flex flex-col gap-1">
                <span className="text-xs">{data.label}</span>
                <span className="text-[10px] text-muted-foreground">Process data...</span>
            </div>
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-blue-500"
                onClick={(e) => {
                    e.stopPropagation();
                    onHandleClick(id, null, 'target');
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className={cn("!bg-blue-500", isSourcePending && "pending")}
                onClick={(e) => {
                    e.stopPropagation();
                    onHandleClick(id, null, 'source');
                }}
            />
        </NodeWrapper>
    );
}
