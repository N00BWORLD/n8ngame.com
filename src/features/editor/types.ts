import { Node } from '@xyflow/react';

// Update NodeData to be a union or intersection that allows specific properties
export type NodeData = {
    label: string;
    [key: string]: any; // Allow loose typing for now to avoid comprehensive refactor
};

export type AppNode = Node<NodeData, 'trigger' | 'action' | 'variable' | 'generator' | 'booster' | 'sink'>;
