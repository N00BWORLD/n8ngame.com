import { useEffect } from 'react';
import { ReactFlow, Background, Controls, NodeTypes, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { TriggerNode } from '@/features/editor/nodes/TriggerNode';
import { ActionNode } from '@/features/editor/nodes/ActionNode';
import { VariableNode } from '@/features/editor/nodes/VariableNode';
import { NodePalette } from '@/features/editor/NodePalette';
import { RunToolbar } from '@/features/editor/RunToolbar';
import { StorageControls } from '@/features/storage/StorageControls';
import { Terminal } from '@/features/ui/Terminal';
import { useFlowStore } from '@/store/flowStore';
import { InventoryModal } from '@/features/inventory/InventoryModal';
import { MissionPanel } from '@/features/missions/MissionPanel';
import { HelpModal } from '@/features/help/HelpModal';

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

    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();

        const type = event.dataTransfer.getData('application/reactflow');
        if (!type) return;

        // Correctly project screen coordinates to flow coordinates
        // useReactFlow must be used inside ReactFlowProvider, which Flow is.
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const id = `${type}-${Date.now()}`;
        const newNode = {
            id,
            type,
            position,
            data: { label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}` },
            selected: true,
        };

        const { addNode, nodes, setNodes } = useFlowStore.getState();

        // Deselect others
        const updatedNodes = nodes.map((n) => ({ ...n, selected: false }));
        setNodes(updatedNodes as any);

        addNode(newNode as any);
    };

    // Need screenToFlowPosition from useReactFlow
    const { screenToFlowPosition } = useReactFlow();

    return (
        <div
            style={{ height: '100vh', width: '100vw', backgroundColor: '#050510' }}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
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
                <InventoryModal />
                <MissionPanel />
                <HelpModal />
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
