import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import type { AppNode } from '../types';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export function VariableNode({ id, data, selected }: NodeProps<AppNode>) {
    const onHandleClick = useFlowStore((state) => state.onHandleClick);
    const pendingConnection = useFlowStore((state) => state.pendingConnection);
    const executionStatus = useFlowStore((state) => state.nodeExecStatus[id]);

    const isTargetPending = pendingConnection?.nodeId !== id && pendingConnection?.type === 'source'; // Valid target if source is pending? 
    // Simplified logic for handles

    return (
        <NodeWrapper
            id={id}
            title="Variable"
            icon={<Database className="h-4 w-4" />}
            colorClass="border-purple-500/50 hover:border-purple-500"
            selected={selected}
            executionStatus={executionStatus}
        >
            <div className="flex flex-col gap-1">
                <span className="text-xs">{data.label}</span>
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">count = 0</code>
            </div>
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-orange-500"
                onClick={(e) => {
                    e.stopPropagation();
                    onHandleClick(id, null, 'target');
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className={cn("!bg-purple-500", isTargetPending && "pending")}
                onClick={(e) => {
                    e.stopPropagation();
                    onHandleClick(id, null, 'source');
                }}
            />
        </NodeWrapper>
    );
}
