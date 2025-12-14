import { useEffect } from 'react';
import { ReactFlow, Background, Controls, NodeTypes, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
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
import { initUiSettings } from '@/store/uiStore';
import { TopLeftControls } from '@/components/TopLeftControls';
import { ResultCard } from '@/components/ResultCard';

const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    variable: VariableNode,
};

function Flow() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onPaneClick, addNode } = useFlowStore();
    const { screenToFlowPosition } = useReactFlow();

    useEffect(() => {
        // Initialize Theme and Language on Mount
        initUiSettings();
    }, []);

    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();

        const type = event.dataTransfer.getData('application/reactflow');
        if (!type) return;

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

        addNode(newNode as any);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }} onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onPaneClick={onPaneClick}
                proOptions={{ hideAttribution: true }}
                colorMode="dark"
                fitView
            >
                <Background color="#222" gap={20} />
                <Controls />
                <TopLeftControls />

                <NodePalette />
                <RunToolbar />
                <StorageControls />
                <Terminal />
                <InventoryModal />
                <MissionPanel />
                <ResultCard />
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
