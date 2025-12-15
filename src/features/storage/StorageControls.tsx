import { useFlowStore } from '@/store/flowStore';
import { FolderOpen } from 'lucide-react';

export function StorageControls() {
    const setBlueprintModalOpen = useFlowStore((state) => state.setBlueprintModalOpen);

    return (
        <div className="absolute top-4 left-4 z-50">
            <button
                onClick={() => setBlueprintModalOpen(true)}
                className="flex items-center gap-2 rounded-lg glass-panel px-3 py-2 text-xs font-medium cyber-button hover:bg-white/10 transition-colors"
            >
                <FolderOpen className="h-3 w-3" />
                Blueprints
            </button>
        </div>
    );
}
