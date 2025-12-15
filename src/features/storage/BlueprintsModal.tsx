import { useEffect, useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { useReactFlow } from '@xyflow/react';
import { X, Save, FolderOpen, Trash2, HardDrive } from 'lucide-react';
import { StorageSlot, STORAGE_KEY_V1 } from './types';

export function BlueprintsModal() {
    const { isBlueprintModalOpen, setBlueprintModalOpen, toBlueprint, loadBlueprint } = useFlowStore();
    const { getViewport, setViewport } = useReactFlow();
    const [slots, setSlots] = useState<StorageSlot[]>([]);

    useEffect(() => {
        if (!isBlueprintModalOpen) return;
        loadSlots();
    }, [isBlueprintModalOpen]);

    const loadSlots = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_V1);
            let loadedSlots: StorageSlot[] = [];
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.slots)) {
                    loadedSlots = parsed.slots;
                }
            }

            // Ensure 20 slots exist
            const finalSlots: StorageSlot[] = [];
            for (let i = 1; i <= 20; i++) {
                const existing = loadedSlots.find(s => s.id === i);
                if (existing) {
                    finalSlots.push(existing);
                } else {
                    finalSlots.push({ id: i, name: `Slot ${i}`, updatedAt: 0 });
                }
            }
            setSlots(finalSlots);
        } catch (e) {
            console.error('Failed to load slots', e);
        }
    };

    const saveToLocalStorage = (newSlots: StorageSlot[]) => {
        localStorage.setItem(STORAGE_KEY_V1, JSON.stringify({ slots: newSlots }));
        setSlots(newSlots);
    };

    const handleSave = (id: number) => {
        const blueprint = toBlueprint();
        blueprint.graph.viewport = getViewport(); // Capture current viewport

        const newSlots = slots.map(slot => {
            if (slot.id === id) {
                return {
                    ...slot,
                    updatedAt: Date.now(),
                    blueprint
                };
            }
            return slot;
        });

        saveToLocalStorage(newSlots);
        console.log(`Saved to Slot ${id}`);
    };

    const handleLoad = (slot: StorageSlot) => {
        if (!slot.blueprint) return;

        try {
            loadBlueprint(slot.blueprint);
            if (slot.blueprint.graph.viewport) {
                setViewport(slot.blueprint.graph.viewport);
            }
            setBlueprintModalOpen(false);
            console.log(`Loaded from Slot ${slot.id}`);
        } catch (e) {
            console.error('Failed to load blueprint', e);
        }
    };

    const handleClear = (id: number) => {
        const newSlots = slots.map(slot => {
            if (slot.id === id) {
                return { id, name: `Slot ${id}`, updatedAt: 0, blueprint: undefined };
            }
            return slot;
        });
        saveToLocalStorage(newSlots);
    };

    if (!isBlueprintModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-[#111] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <HardDrive className="text-cyan-400 h-5 w-5" />
                        <h2 className="text-lg font-bold text-white">Storage Slots</h2>
                    </div>
                    <button
                        onClick={() => setBlueprintModalOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body - Grid of Slots */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.map((slot) => {
                        const hasData = !!slot.blueprint;
                        return (
                            <div key={slot.id} className={`
                                relative p-4 rounded-lg border transition-all group
                                ${hasData ? 'border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/50' : 'border-white/5 bg-white/5 hover:bg-white/10'}
                            `}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${hasData ? 'text-cyan-400' : 'text-gray-500'}`}>
                                            {slot.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                            {hasData ? new Date(slot.updatedAt).toLocaleString() : 'Empty'}
                                        </span>
                                    </div>
                                    {hasData && (
                                        <div className="text-[10px] text-gray-500 bg-black/50 px-2 py-1 rounded">
                                            {slot.blueprint?.graph.nodes.length || 0} Nodes
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => handleSave(slot.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs py-2 rounded transition-colors"
                                        title="Overwrite Slot"
                                    >
                                        <Save className="h-3 w-3" />
                                        Save
                                    </button>

                                    {hasData ? (
                                        <>
                                            <button
                                                onClick={() => handleLoad(slot)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/30 text-xs py-2 rounded transition-colors"
                                            >
                                                <FolderOpen className="h-3 w-3" />
                                                Load
                                            </button>
                                            <button
                                                onClick={() => handleClear(slot.id)}
                                                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                title="Clear Slot"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex-1 opacity-0 pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 bg-black/20 text-center">
                    <p className="text-[10px] text-gray-500">
                        Local Storage • Data persists in browser only
                    </p>
                </div>
            </div>
        </div>
    );
}
