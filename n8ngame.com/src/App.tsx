import { useEffect } from 'react';
import { ReactFlow, Background, Controls, NodeTypes, ReactFlowProvider } from '@xyflow/react';
import { TriggerNode } from '@/features/editor/nodes/TriggerNode';
import { ActionNode } from '@/features/editor/nodes/ActionNode';
import { VariableNode } from '@/features/editor/nodes/VariableNode';
import { NodePalette } from '@/features/editor/NodePalette';
import { RunToolbar } from '@/features/editor/RunToolbar';
import { StorageControls } from '@/features/storage/StorageControls';
import { Terminal } from '@/features/ui/Terminal';
import { useFlowStore } from '@/store/flowStore';

const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    variable: VariableNode,
};

const initialNodes = [
    { id: '1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Start' } },
    { id: '2', type: 'action', position: { x: 100, y: 300 }, data: { label: 'Process' } },
    { id: '3', type: 'variable', position: { x: 400, y: 200 }, data: { label: 'Data' } },
];

function Flow() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onPaneClick, setNodes } = useFlowStore();

    useEffect(() => {
        // Initialize nodes
        setNodes(initialNodes as any);
    }, [setNodes]);

    return (
        <div style={{ height: '100vh', width: '100vw', backgroundColor: '#050510' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#ccc" gap={20} />
                <Controls />
                <NodePalette />
                <RunToolbar />
                <StorageControls />
                <Terminal />
            </ReactFlow>
        </div>
    );
}

export default function App() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}
