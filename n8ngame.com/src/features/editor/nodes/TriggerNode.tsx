import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import type { AppNode } from '../types';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export function TriggerNode({ id, data, selected }: NodeProps<AppNode>) {
    const onHandleClick = useFlowStore((state) => state.onHandleClick);
    const pendingConnection = useFlowStore((state) => state.pendingConnection);

    const isPending = pendingConnection?.nodeId === id && pendingConnection?.type === 'source';

    return (
        <NodeWrapper
            title="Start"
            icon={<Play className="h-4 w-4" />}
            colorClass="border-green-500/50 hover:border-green-500"
            selected={selected}
        >
            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-muted-foreground uppercase">{data.label}</label>
                <button className="rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 hover:bg-green-500/20">
                    Run Workflow
                </button>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className={cn("!bg-green-500", isPending && "pending")}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent node selection
                    onHandleClick(id, null, 'source');
                }}
            />
        </NodeWrapper>
    );
}
