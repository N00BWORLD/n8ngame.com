import { useReactFlow } from '@xyflow/react';
import { Play, Zap, Database } from 'lucide-react';
import type { AppNode } from './types';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

const NODE_TYPES = [
    { type: 'trigger', label: 'Trigger', icon: <Play className="h-3 w-3 fill-orange-500" />, color: 'text-orange-600 bg-orange-50 border-orange-100' },
    { type: 'action', label: 'Action', icon: <Zap className="h-3 w-3 fill-blue-600" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { type: 'variable', label: 'Variable', icon: <Database className="h-3 w-3 fill-purple-600" />, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { type: 'generator', label: 'Generator', icon: <Zap className="h-3 w-3 fill-blue-600" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { type: 'booster', label: 'Booster', icon: <Zap className="h-3 w-3 fill-purple-600" />, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { type: 'sink', label: 'Sink', icon: <Zap className="h-3 w-3 fill-blue-600" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
] as const;

export function NodePalette() {
    const { screenToFlowPosition } = useReactFlow<AppNode>();

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
        const updatedNodes = nodes.map((n) => ({ ...n, selected: false } as AppNode));
        setNodes(updatedNodes);
        addNode(newNode);
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 rounded-full bg-white border border-slate-200 p-1.5 shadow-xl ring-4 ring-black/5 animate-in slide-in-from-bottom-4 duration-300">
            {NODE_TYPES.map((type) => (
                <button
                    key={type.type}
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', type.type);
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => addNodeCenter(type.type, type.label)}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 border",
                        type.color
                    )}
                >
                    {type.icon}
                    <span>{type.label}</span>
                </button>
            ))}
        </div>
    );
}
