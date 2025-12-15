import { useFlowStore } from '@/store/flowStore';
import { X, Save, FolderOpen, HardDrive } from 'lucide-react';


export function BlueprintsModal() {
    const {
        isBlueprintModalOpen, setBlueprintModalOpen,
        saveSlots, saveToSlot, loadSlot, clearSlot
    } = useFlowStore();

    const handleLoad = (id: number) => {
        loadSlot(id);
        setBlueprintModalOpen(false);
    };

    // Actually, let's implement Rename by re-saving with new name? No that overwrites.
    // I'll stick to: Save (prompts for name or uses generic), Load, Clear.
    // "Rename" isn't critical if "Save" allows naming.
    // Let's make "Save" prompt for name.

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
                    {saveSlots.map((slot) => {
                        const hasData = !!slot.blueprint;
                        return (
                            <div key={slot.id} className={`
                                relative p-4 rounded-lg border transition-all group
                                ${hasData ? 'border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/50' : 'border-white/5 bg-white/5 hover:bg-white/10'}
                            `}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold truncate max-w-[150px] ${hasData ? 'text-cyan-400' : 'text-gray-500'}`}>
                                                {slot.name}
                                            </span>
                                            {/* Edit Name Button? */}
                                        </div>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                                            {hasData ? new Date(slot.updatedAt).toLocaleString() : 'Empty'}
                                        </span>
                                    </div>
                                    {hasData && (
                                        <div className="text-[10px] text-gray-500 bg-black/50 px-2 py-1 rounded">
                                            {slot.blueprint?.graph.nodes.length || 0} Nodes
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            const name = window.prompt("Save as:", slot.name) || slot.name;
                                            saveToSlot(slot.id, name);
                                        }}
                                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs py-2 rounded transition-colors"
                                    >
                                        <Save className="h-3 w-3" />
                                        Save
                                    </button>

                                    {hasData ? (
                                        <button
                                            onClick={() => handleLoad(slot.id)}
                                            className="flex items-center justify-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/30 text-xs py-2 rounded transition-colors"
                                        >
                                            <FolderOpen className="h-3 w-3" />
                                            Load
                                        </button>
                                    ) : <div />}

                                    {hasData && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Clear this slot?")) clearSlot(slot.id);
                                            }}
                                            className="col-span-2 text-[10px] text-gray-600 hover:text-red-400 flex justify-center py-1"
                                        >
                                            Clear Slot
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 border-t border-white/10 bg-black/20 text-center">
                    <p className="text-[10px] text-gray-500">
                        Slots are saved to your browser's local storage.
                    </p>
                </div>
            </div>
        </div>
    );
}
