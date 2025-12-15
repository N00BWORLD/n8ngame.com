import { useReactFlow } from '@xyflow/react';
import { Play, Zap, Database } from 'lucide-react';
import type { AppNode } from './types';
import { useFlowStore } from '@/store/flowStore';

const NODE_TYPES = [
    { type: 'trigger', label: 'Trigger', icon: <Play className="h-3 w-3" />, color: 'text-green-500 bg-green-500/10' },
    { type: 'action', label: 'Action', icon: <Zap className="h-3 w-3" />, color: 'text-blue-500 bg-blue-500/10' },
    { type: 'variable', label: 'Variable', icon: <Database className="h-3 w-3" />, color: 'text-orange-500 bg-orange-500/10' },
    // Mission 13
    { type: 'generator', label: 'Generator', icon: <Zap className="h-3 w-3" />, color: 'text-yellow-500 bg-yellow-500/10' },
    { type: 'booster', label: 'Booster', icon: <Zap className="h-3 w-3" />, color: 'text-purple-500 bg-purple-500/10' },
    { type: 'sink', label: 'Sink', icon: <Zap className="h-3 w-3" />, color: 'text-red-500 bg-red-500/10' },
] as const;

export function NodePalette() {
    const { screenToFlowPosition } = useReactFlow<AppNode>();
    // Removed unused setNodes hook usage since we use getState inside handler
    // const setNodes = useFlowStore((state) => state.setNodes);

    const addNodeCenter = (type: 'trigger' | 'action' | 'variable' | 'generator' | 'booster' | 'sink', label: string) => {
        const id = `${type}-${Date.now()}`;
        const center = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        const newNode: AppNode = {
            id,
            type,
            position: center,
            data: { label: `New ${label}` },
            selected: true,
        };

        const { addNode, nodes, setNodes } = useFlowStore.getState();
        // Deselect others first
        const updatedNodes = nodes.map((n) => ({ ...n, selected: false } as AppNode));
        setNodes(updatedNodes);

        // Add new node
        addNode(newNode);
    };

    return (
        <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full glass-panel p-2">
            {NODE_TYPES.map((type) => (
                <button
                    key={type.type}
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', type.type);
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => addNodeCenter(type.type, type.label)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 cyber-button ${type.color} cursor-grab active:cursor-grabbing`}
                >
                    {type.icon}
                    <span className="text-sm font-medium">{type.label}</span>
                </button>
            ))}
        </div>
    );
}
