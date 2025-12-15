import { useFlowStore } from '@/store/flowStore';
import { PRESETS, Preset } from './presets';
import { X, BookTemplate, Lock } from 'lucide-react'; // Using BookTemplate as icon
import { useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';

export function PresetModal() {
    const { isPresetOpen, setPresetOpen, setNodes, setEdges, nodes, setViewport } = useFlowStore();
    const { setViewport: flowSetViewport } = useReactFlow();

    if (!isPresetOpen) return null;

    const handleApply = (preset: Preset) => {
        // Safety Check
        if (nodes.length > 0) {
            const confirmed = window.confirm("Applying a preset will overwrite your current graph. Continue?");
            if (!confirmed) return;
        }

        // Apply Nodes and Edges
        // To avoid ID collisions if we weren't overwriting, we'd regenerate IDs. 
        // Since we are overwriting, we can use preset IDs directly.
        setNodes(preset.nodes);
        setEdges(preset.edges);

        // Apply Viewport
        if (preset.viewport) {
            // Update ReactFlow instance
            flowSetViewport(preset.viewport);
            // Update Store if needed (store handles sync usually, but explicit set helps)
            setViewport(preset.viewport);
        }

        setPresetOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full sm:w-[500px] h-[70vh] sm:h-auto max-h-[85vh] bg-[#0a0a0f] border-t sm:border border-white/20 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <BookTemplate className="h-5 w-5 text-cyan-400" />
                        <span className="font-bold text-white">Node Presets</span>
                    </div>
                    <button
                        onClick={() => setPresetOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {PRESETS.map(preset => (
                        <div
                            key={preset.id}
                            className={cn(
                                "group relative p-4 rounded-lg border transition-all cursor-pointer",
                                preset.locked
                                    ? "bg-gray-900/50 border-white/5 opacity-70"
                                    : "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10"
                            )}
                            onClick={() => !preset.locked && handleApply(preset)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={cn("font-bold", preset.locked ? "text-gray-500" : "text-white group-hover:text-cyan-300")}>
                                    {preset.name}
                                </h3>
                                {preset.locked && <Lock className="h-4 w-4 text-gray-600" />}
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">
                                {preset.description}
                            </p>

                            {/* Tags or Meta */}
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 border border-white/5">
                                    {preset.nodes.length} Nodes
                                </span>
                                {preset.priceGems && (
                                    <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">
                                        {preset.priceGems} Gems
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer (Optional info) */}
                <div className="p-3 bg-white/5 border-t border-white/10 text-[10px] text-gray-500 text-center">
                    Applying a preset will replace your current workflow.
                </div>
            </div>
        </div>
    );
}
