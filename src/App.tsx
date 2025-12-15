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
import { ShopModal } from '@/features/economy/ShopModal';
import { MiningPanel } from '@/features/ui/MiningPanel';

// import { InventoryDrawer } from '@/features/inventory/InventoryDrawer'; // If this doesn't exist, don't import it. Assuming InventoryModal is the one.

const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    variable: VariableNode,
    // Mission 13: Reuse ActionNode for now
    generator: ActionNode,
    booster: VariableNode, // Reuse Variable for visual distinction
    sink: ActionNode,
};

function Flow() {
    const {
        nodes, edges, onNodesChange, onEdgesChange, onConnect, onPaneClick, addNode
    } = useFlowStore();
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

    // Mission 13-EDIT-CORE-1: Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Input Guard: Don't trigger if typing in an input or textarea
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Undo/Redo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                if (event.shiftKey) {
                    useFlowStore.getState().redo();
                } else {
                    useFlowStore.getState().undo();
                }
                return; // Stop processing
            } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
                event.preventDefault();
                useFlowStore.getState().redo();
                return; // Stop processing
            }

            // Node Creation Shortcuts (T, A, V, G, B, S)
            if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                let type: 'trigger' | 'action' | 'variable' | 'generator' | 'booster' | 'sink' | null = null;
                let label = '';

                switch (event.key.toLowerCase()) {
                    case 't': type = 'trigger'; label = 'Trigger'; break;
                    case 'a': type = 'action'; label = 'Action'; break;
                    case 'v': type = 'variable'; label = 'Variable'; break;
                    case 'g': type = 'generator'; label = 'Generator'; break;
                    case 'b': type = 'booster'; label = 'Booster'; break;
                    case 's': type = 'sink'; label = 'Sink'; break;
                }

                if (type) {
                    const id = `${type}-${Date.now()}`;
                    // Spawn at center of viewport
                    const position = screenToFlowPosition({
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                    });

                    const newNode = {
                        id,
                        type,
                        position,
                        data: { label: `New ${label}` },
                        selected: true,
                    };

                    // Deselect others to highlight new node
                    const checkState = useFlowStore.getState();
                    if (checkState.nodes.length > 0) {
                        const deselected = checkState.nodes.map(n => ({ ...n, selected: false }));
                        checkState.setNodes(deselected);
                    }

                    useFlowStore.getState().addNode(newNode as any);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screenToFlowPosition]);

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden font-sans selection:bg-cyan-500/30" onDragOver={onDragOver} onDrop={onDrop}>
            {/* Context/Store Providers could wrap this */}
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
                <Background color="#111" gap={16} />
                <Controls className="bg-gray-800/80 border-gray-700 text-white fill-white" />

                {/* Top Bar Container for responsive layout */}
                <div className="absolute top-0 left-0 right-0 z-50 flex flex-wrap items-start justify-between p-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <TopLeftControls />
                    </div>
                    <div className="pointer-events-auto">
                        <RunToolbar />
                    </div>
                </div>

                <NodePalette />
                <StorageControls />
                <Terminal />
                <InventoryModal />
                <MissionPanel />
                <MiningPanel />
                <ResultCard />

                {/* Modals rendered via state */}
                <HelpModal />
                <ShopModal />

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
