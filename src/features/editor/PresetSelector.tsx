import { useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { PRESETS, Preset } from './presets';
import { AppNode } from './types';
import { Edge, useReactFlow } from '@xyflow/react';
import { Lock, Unlock, Check, X, BookTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresetSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PresetSelector({ isOpen, onClose }: PresetSelectorProps) {
    const {
        unlockedPresets, unlockPreset, setNodes, setEdges, mineState
    } = useFlowStore();
    const { setViewport } = useReactFlow();
    const [confirmId, setConfirmId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUnlock = (preset: Preset) => {
        const result = unlockPreset(preset.id, preset.pricePremium);
        if (!result.ok) {
            alert(result.reason || "Unlock failed");
        }
    };

    const handleApply = (preset: Preset) => {
        const hasContent = useFlowStore.getState().nodes.length > 0;

        if (hasContent && confirmId !== preset.id) {
            setConfirmId(preset.id);
            return;
        }

        setConfirmId(null);
        setNodes(preset.nodes as AppNode[]);
        setEdges(preset.edges as Edge[]);

        if (preset.viewport) {
            setViewport(preset.viewport);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#141419] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] m-4">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1c1c21]">
                    <div className="flex items-center gap-2">
                        <BookTemplate className="w-5 h-5 text-cyan-400" />
                        <span className="font-bold text-white tracking-wide">Blueprints (Presets)</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PRESETS.map(preset => {
                            const isUnlocked = unlockedPresets.includes(preset.id);
                            const canAfford = mineState.premiumCredits >= preset.pricePremium;
                            const isConfirming = confirmId === preset.id;

                            return (
                                <div key={preset.id} className={cn(
                                    "flex flex-col bg-[#202025] rounded-lg border transition-all relative overflow-hidden group",
                                    isUnlocked ? "border-white/10 hover:border-cyan-500/50" : "border-white/5 opacity-80"
                                )}>
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-white">{preset.name}</h3>
                                            {!isUnlocked && (
                                                <div className="bg-black/50 px-2 py-0.5 rounded text-[10px] text-yellow-400 font-mono flex items-center gap-1 border border-yellow-500/20">
                                                    <Lock className="w-3 h-3" />
                                                    {preset.pricePremium}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4 h-10 line-clamp-2">{preset.description}</p>

                                        <div className="mt-2 text-[10px] text-white/30 font-mono">
                                            Nodes: {preset.nodes.length} | Edges: {preset.edges.length}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-black/20 border-t border-white/5">
                                        {isUnlocked ? (
                                            <button
                                                onClick={() => handleApply(preset)}
                                                className={cn(
                                                    "w-full py-2 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all",
                                                    isConfirming
                                                        ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                                                        : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                                                )}
                                            >
                                                {isConfirming ? (
                                                    <span>Overwrite? Click again</span>
                                                ) : (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Apply Blueprint</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUnlock(preset)}
                                                disabled={!canAfford}
                                                className={cn(
                                                    "w-full py-2 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all",
                                                    canAfford
                                                        ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20"
                                                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                                )}
                                            >
                                                <Unlock className="w-3.5 h-3.5" />
                                                <span>Unlock ({preset.pricePremium})</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 bg-[#18181b] flex justify-between items-center text-xs text-white/50">
                    <div>
                        Balance: <span className="text-yellow-400 font-bold">{mineState.premiumCredits} Premium Credits</span>
                    </div>
                    <div>
                        Unlocks are permanent.
                    </div>
                </div>
            </div>
        </div>
    );
}
