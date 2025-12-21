import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import type { AppNode } from '../types';
import { useFlowStore } from '@/store/flowStore';

export function ActionNode({ id, data, selected }: NodeProps<AppNode>) {
    const onHandleClick = useFlowStore((state) => state.onHandleClick);
    const executionStatus = useFlowStore((state) => state.nodeExecStatus[id]);

    return (
        <NodeWrapper
            id={id}
            title="Action"
            icon={<Zap className="h-4 w-4 fill-white" />}
            colorClass={selected ? "border-blue-600" : "border-slate-100"}
            selected={selected}
            executionStatus={executionStatus}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700 tracking-tight">{data.label}</span>
                <p className="text-[10px] text-slate-400">Execute operation</p>
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
