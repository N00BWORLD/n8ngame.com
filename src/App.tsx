import { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, NodeTypes, ReactFlowProvider, useReactFlow, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TriggerNode } from '@/features/editor/nodes/TriggerNode';
import { ActionNode } from '@/features/editor/nodes/ActionNode';
import { VariableNode } from '@/features/editor/nodes/VariableNode';
import { NodePalette } from '@/features/editor/NodePalette';
import { RunToolbar } from '@/features/editor/RunToolbar';
import { StorageControls } from '@/features/storage/StorageControls';
import { useFlowStore } from '@/store/flowStore';
import { InventoryModal } from '@/features/inventory/InventoryModal';
import { MissionPanel } from '@/features/missions/MissionPanel';
import { HelpModal } from '@/features/help/HelpModal';
import { initUiSettings } from '@/store/uiStore';
import { ResultCard } from '@/components/ResultCard';
import { ShopModal } from '@/features/economy/ShopModal';
import { BlueprintsModal } from '@/features/storage/BlueprintsModal';
import { SlotsScreen } from '@/features/slots/SlotsScreen';
import { MiningHUD } from '@/features/mining/MiningHUD';
import { MineLogsPanel } from '@/features/mining/MineLogsPanel';
import { ShopPanel } from '@/features/shop/ShopPanel';
import { SlotMode } from '@/features/slots/SlotMode';
import { RockPanel } from '@/features/mining/RockPanel';
import { AdPlaceholder } from '@/features/ads/AdPlaceholder';
import { LayoutGrid, Network, Play } from 'lucide-react';
import { SelectionToolbar } from '@/features/editor/SelectionToolbar';

const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    variable: VariableNode,
    generator: ActionNode,
    booster: VariableNode,
    sink: ActionNode,
};

function Flow() {
    const {
        nodes, edges, onNodesChange, onEdgesChange, onConnect, onPaneClick, addNode,
        editorMode, setEditorMode // Mission 25-C
    } = useFlowStore();
    const { screenToFlowPosition } = useReactFlow();

    const [viewMode, setViewMode] = useState<'GRAPH' | 'STATION'>('GRAPH');

    useEffect(() => {
        initUiSettings();

        // Mission 25-D: Offline Progress Check
        useFlowStore.getState().processOfflineProgress();
        const startInterval = setInterval(() => {
            useFlowStore.getState().refreshLastSeen();
        }, 30000); // Checkpoint every 30s

        const handleVisibilityValues = () => {
            if (document.visibilityState === 'hidden') {
                useFlowStore.getState().refreshLastSeen();
            } else {
                useFlowStore.getState().processOfflineProgress();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityValues);
        window.addEventListener('beforeunload', () => useFlowStore.getState().refreshLastSeen());

        return () => {
            clearInterval(startInterval);
            document.removeEventListener('visibilitychange', handleVisibilityValues);
            window.removeEventListener('beforeunload', () => useFlowStore.getState().refreshLastSeen());
        }
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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                event.shiftKey ? useFlowStore.getState().redo() : useFlowStore.getState().undo();
                return;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screenToFlowPosition]);

    // RENDER STATION MODE (Full Screen)
    if (viewMode === 'STATION') {
        return (
            <div className="relative w-screen h-screen bg-slate-950">
                <SlotsScreen />

                <MiningHUD />
                <MineLogsPanel />

                <button
                    onClick={() => setViewMode('GRAPH')}
                    className="fixed bottom-32 right-6 z-[60] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2"
                >
                    <Network className="w-4 h-4" />
                    Open Workflow Editor
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-blue-500/20">
            {/* 1. Fixed Header (n8n Style) */}
            <div className="flex-none h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-6">
                    {/* Logo / Branding */}
                    <div className="flex items-center gap-2 mr-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black text-xl italic shadow-orange-500/20 shadow-lg">
                            n
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight hidden sm:inline">Automata</span>
                    </div>

                    {/* Mode Toggles */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setEditorMode('SLOT')}
                            className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all flex items-center gap-2 ${editorMode === 'SLOT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Slot View
                        </button>
                        <button
                            onClick={() => setEditorMode('GRAPH')}
                            className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all flex items-center gap-2 ${editorMode === 'GRAPH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Network className="w-3.5 h-3.5" />
                            Canvas
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    <button
                        onClick={() => setViewMode('STATION')}
                        className="px-4 py-1.5 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Play className="w-3.5 h-3.5 fill-slate-600" />
                        Run Game
                    </button>
                </div>

                <RunToolbar />
            </div>

            {/* 2. Main Content Body */}
            <div className="flex-1 relative pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]" onDragOver={onDragOver} onDrop={onDrop}>
                {/* Adsense Slot (Desktop Only) - Right Side */}


                {editorMode === 'SLOT' ? (
                    <SlotMode />
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        onPaneClick={onPaneClick}
                        deleteKeyCode={['Backspace', 'Delete']}
                        proOptions={{ hideAttribution: true }}
                        colorMode="light"
                        fitView
                    >
                        <Background color="#e2e8f0" variant={BackgroundVariant.Dots} gap={20} />

                        {/* Controls moved to top-right to avoid bottom log panel overlap */}
                        <Controls position="top-right" className="bg-white border-gray-200 text-gray-600 shadow-sm mt-14 mr-2" />

                        <NodePalette />
                        <StorageControls />
                        <InventoryModal />
                        <MissionPanel />
                        <ResultCard />
                        <HelpModal />
                        <ShopModal />
                        <BlueprintsModal />
                        <SelectionToolbar />
                    </ReactFlow>
                )}

                {/* UI Overlay: Ad + HUD + RockPanel */}
                <div className="absolute inset-0 z-30 pointer-events-none flex flex-col overflow-hidden">
                    {/* Ad Placeholder (Top) */}
                    <AdPlaceholder slotId="ad-top" />

                    {/* Stats & HUD Row */}
                    <div className="grid grid-cols-3 gap-2 px-2 pt-2 items-start w-full max-w-6xl mx-auto">
                        <div className="flex justify-start pointer-events-auto">
                            <MiningHUD />
                        </div>
                        <div className="flex justify-center pointer-events-auto mt-8 sm:mt-0">
                            <RockPanel />
                        </div>
                        <div className="flex justify-end pointer-events-auto">
                            {/* Future Right Controls */}
                        </div>
                    </div>
                </div>

                <ShopPanel />
                <MineLogsPanel />
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
