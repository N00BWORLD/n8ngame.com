import { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, NodeTypes, ReactFlowProvider, useReactFlow } from '@xyflow/react';
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
import { TopLeftControls } from '@/components/TopLeftControls';
import { ResultCard } from '@/components/ResultCard';
import { ShopModal } from '@/features/economy/ShopModal';
import { BlueprintsModal } from '@/features/storage/BlueprintsModal';
import { SlotsScreen } from '@/features/slots/SlotsScreen';
import { MiningHUD } from '@/features/mining/MiningHUD';
import { MineLogsPanel } from '@/features/mining/MineLogsPanel';
import { ShopPanel } from '@/features/shop/ShopPanel';
import { SlotMode } from '@/features/slots/SlotMode';
import { RockPanel } from '@/features/mining/RockPanel'; // Mission 25-E
import { LayoutGrid, Network } from 'lucide-react';

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

    const [viewMode, setViewMode] = useState<'GRAPH' | 'STATION'>('STATION');

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
                // On resume, we could check offline again if gap was huge, 
                // but typically reload triggers process. 
                // Simple resume logic: just refresh last seen to avoid "offline" calc for active bg tab time effectively?
                // Or do we WANT bg tab to count?
                // Spec: "visibilitychange -> hidden일 때 lastSeenMs 저장".
                // If we close tab, it saves.
                // If we switch tab, it saves.
                // If we return 5 hours later (tab was suspended), we might want to claim.
                // If tab was alive, it might have auto-run?
                // Let's stick to simple: check on mount.
                // If user wants offline gains, they reload.
                // Or we can manually trigger process if gap > X?
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
            <div className="relative w-screen h-screen bg-black">
                <SlotsScreen />

                <MiningHUD />
                <MineLogsPanel />

                {/* Mode Switcher also available in Station? Maybe distinct? keeping simple */}
                <button
                    onClick={() => setViewMode('GRAPH')}
                    className="fixed bottom-32 right-4 z-[60] bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20"
                >
                    Dev: Graph
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-black overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* 1. Fixed Header */}
            <div className="flex-none h-12 sm:h-14 bg-[#111] border-b border-white/10 z-50 flex items-center justify-between px-2 sm:px-4 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-4">
                    <TopLeftControls />

                    {/* Mission 25-C: Mode Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setEditorMode('SLOT')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${editorMode === 'SLOT' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <LayoutGrid className="w-3 h-3" />
                            Slot
                        </button>
                        <button
                            onClick={() => setEditorMode('GRAPH')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${editorMode === 'GRAPH' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Network className="w-3 h-3" />
                            Graph
                        </button>
                    </div>

                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 ml-2">
                        <button
                            disabled
                            className="px-3 py-1 rounded text-xs font-bold transition-all bg-gray-800 text-white/50 shadow cursor-default"
                        >
                            Dev
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
                {/* Adsense Slot (Desktop Only) - Right Side */}
                <div id="ad-slot-side" className="hidden md:block absolute top-[60px] right-2 w-[160px] h-[600px] pointer-events-none z-0 border border-white/5 bg-white/5 border-dashed rounded-lg opacity-20 hover:opacity-100 transition-opacity">
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs uppercase -rotate-90">Ad Space</div>
                </div>

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
                        colorMode="dark"
                        fitView
                    >
                        <Background color="#111" gap={16} />

                        {/* Controls moved to top-right to avoid bottom log panel overlap */}
                        <Controls position="top-right" className="bg-gray-800/80 border-gray-700 text-white fill-white mt-14 mr-2" />

                        <NodePalette />
                        <StorageControls />
                        <InventoryModal />
                        <MissionPanel />
                        <ResultCard />
                        <HelpModal />
                        <ShopModal />
                        <BlueprintsModal />
                    </ReactFlow>
                )}

                <RockPanel /> {/* Mission 25-E: Rock Visuals */}
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
