import { useReactFlow } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

export function SelectionToolbar() {
    const { deleteElements } = useReactFlow();
    const { nodes, edges } = useFlowStore(); // useFlowStore syncs selection status

    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    const count = selectedNodes.length + selectedEdges.length;

    if (count === 0) return null;

    const handleDelete = () => {
        if (window.confirm(`Delete ${selectedNodes.length} nodes and ${selectedEdges.length} edges?`)) {
            deleteElements({ nodes: selectedNodes, edges: selectedEdges });
        }
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 bg-black/80 border border-white/20 rounded-full backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xs font-bold text-white mr-2">
                {count} Selected
            </span>
            <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold transition-all shadow-lg"
            >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
            </button>
        </div>
    );
}
