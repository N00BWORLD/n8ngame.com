import { Node } from '@xyflow/react';

export type NodeData = {
    label: string;
};

export type TriggerNodeData = NodeData & {
    interval?: number;
};

export type ActionNodeData = NodeData & {
    actionType?: string;
};

export type VariableNodeData = NodeData & {
    value?: unknown;
};

export type AppNode =
    | Node<TriggerNodeData, 'trigger'>
    | Node<ActionNodeData, 'action'>
    | Node<VariableNodeData, 'variable'>;
