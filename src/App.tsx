import { useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, NodeTypes, ReactFlowProvider, useReactFlow, OnSelectionChangeParams } from '@xyflow/react';
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
import { BlueprintsModal } from '@/features/storage/BlueprintsModal';
import { Trash2 } from 'lucide-react';
import { SlotsScreen } from '@/features/slots/SlotsScreen';
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
    const { screenToFlowPosition, deleteElements } = useReactFlow();

    // Mission 21-C: Selection State
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

    // Mission 22-A: View Mode
    // Default to STATION unless VITE_SHOW_EDITOR is explicitly true
    const showEditor = import.meta.env.VITE_SHOW_EDITOR === 'true';
    const [viewMode, setViewMode] = useState<'GRAPH' | 'STATION'>('STATION');

    const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
        setSelectedNodes(nodes.map((n) => n.id));
        setSelectedEdges(edges.map((e) => e.id));
    }, []);

    const handleDeleteSelected = () => {
        deleteElements({
            nodes: selectedNodes.map(id => ({ id })),
            edges: selectedEdges.map(id => ({ id }))
        });
    };

    useEffect(() => {
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
            id, type, position,
            data: { label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}` },
            selected: true,
        };
        addNode(newNode as any);
    };

    // Keyboard Shortcuts (Keep them active/passive or irrelevant in Station mode? Likely irrelevant but harmless)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                event.shiftKey ? useFlowStore.getState().redo() : useFlowStore.getState().undo();
                return;
            }
            // ... Shortcuts logic ...
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screenToFlowPosition]);

    // RENDER STATION MODE (Full Screen)
    if (viewMode === 'STATION') {
        return (
            <div className="relative w-screen h-screen">
                <SlotsScreen />

                {/* Dev Toggle to go back to Graph if enabled */}
                {showEditor && (
                    <button
                        onClick={() => setViewMode('GRAPH')}
                        className="fixed bottom-4 right-4 z-[60] bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20"
                    >
                        Dev: Graph
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-black overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* 1. Fixed Header */}
            <div className="flex-none h-12 sm:h-14 bg-[#111] border-b border-white/10 z-50 flex items-center justify-between px-2 sm:px-4 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-4">
                    <TopLeftControls />

                    {/* View Mode Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                            disabled
                            className="px-3 py-1 rounded text-xs font-bold transition-all bg-cyan-600 text-white shadow cursor-default"
                        >
                            Graph
                        </button>
                        <button
                            onClick={() => setViewMode('STATION')}
                            className="px-3 py-1 rounded text-xs font-bold transition-all text-gray-400 hover:text-white"
                        >
                            Station
                        </button>
                    </div>
                </div>

                <RunToolbar />
            </div>

            {/* 2. Main Content Body */}
            <div className="flex-1 relative pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]" onDragOver={onDragOver} onDrop={onDrop}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onPaneClick={onPaneClick}
                    onSelectionChange={onSelectionChange}
                    deleteKeyCode={['Backspace', 'Delete']}
                    proOptions={{ hideAttribution: true }}
                    colorMode="dark"
                    fitView
                >
                    <Background color="#111" gap={16} />
                    <Controls position="bottom-right" className="bg-gray-800/80 border-gray-700 text-white fill-white mb-16 mr-2 sm:mb-2 sm:mr-2" />

                    <NodePalette />
                    <StorageControls />
                    <Terminal />
                    <InventoryModal />
                    <MissionPanel />
                    <ResultCard />
                    <HelpModal />
                    <ShopModal />
                    <BlueprintsModal />

                    {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 px-6 py-3 bg-red-500/90 text-white rounded-full shadow-lg border border-red-400/50 backdrop-blur-md hover:bg-red-600 hover:scale-105 active:scale-95 transition-all font-bold tracking-wide"
                            >
                                <Trash2 className="h-5 w-5 fill-current" />
                                <span>Delete ({selectedNodes.length + selectedEdges.length})</span>
                            </button>
                        </div>
                    )}
                </ReactFlow>

                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 flex flex-col items-end gap-2 pointer-events-none origin-top-right scale-90 sm:scale-100">
                    <div className="pointer-events-auto">
                        <MiningPanel />
                    </div>
                </div>
            </div>
        </div >
    );
}

export default function App() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}
