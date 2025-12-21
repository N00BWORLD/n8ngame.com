import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import type { AppNode } from '../types';
import { useFlowStore } from '@/store/flowStore';

export function TriggerNode({ id, data, selected }: NodeProps<AppNode>) {
    const onHandleClick = useFlowStore((state) => state.onHandleClick);
    const executionStatus = useFlowStore((state) => state.nodeExecStatus[id]);

    return (
        <NodeWrapper
            id={id}
            title="Trigger"
            icon={<Play className="h-4 w-4 fill-white" />}
            colorClass={selected ? "border-orange-500" : "border-slate-100"}
            selected={selected}
            executionStatus={executionStatus}
        >
            <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-700 tracking-tight">{data.label}</span>
                <p className="text-[10px] text-slate-400 leading-tight">Wait for event to start workflow</p>
                <div className="mt-1 px-2 py-1 rounded bg-orange-50 border border-orange-100 text-[10px] font-bold text-orange-600 w-fit">
                    on_click
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-white"
                onClick={(e) => {
                    e.stopPropagation();
                    onHandleClick(id, null, 'source');
                }}
            />
        </NodeWrapper>
    );
}
