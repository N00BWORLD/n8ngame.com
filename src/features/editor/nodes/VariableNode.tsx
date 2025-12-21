import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import type { AppNode } from '../types';
import { useFlowStore } from '@/store/flowStore';

export function VariableNode({ id, data, selected }: NodeProps<AppNode>) {
    const onHandleClick = useFlowStore((state) => state.onHandleClick);
    const executionStatus = useFlowStore((state) => state.nodeExecStatus[id]);

    return (
        <NodeWrapper
            id={id}
            title="Variable"
            icon={<Database className="h-4 w-4 fill-white" />}
            colorClass={selected ? "border-purple-600" : "border-slate-100"}
            selected={selected}
            executionStatus={executionStatus}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700 tracking-tight">{data.label}</span>
                <code className="mt-1 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-purple-600 font-mono border border-purple-100 w-fit">
                    val = 0
                </code>
            </div>
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-white"
                onClick={(e) => {
                    e.stopPropagation();
                    onHandleClick(id, null, 'target');
                }}
            />
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
