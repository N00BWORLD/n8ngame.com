import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '@/store/flowStore';
import { Save, FolderOpen } from 'lucide-react';

const STORAGE_KEY = 'n8ngame-project';

export function StorageControls() {
    const toBlueprint = useFlowStore((state) => state.toBlueprint);
    const loadBlueprint = useFlowStore((state) => state.loadBlueprint);

    // access reactFlow instance for viewport
    const { getViewport, setViewport } = useReactFlow();

    const handleSave = () => {
        try {
            const blueprint = toBlueprint();
            // Update viewport from actual state
            blueprint.graph.viewport = getViewport();

            localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
            console.log('Saved to localStorage', blueprint);
            // Visual feedback could be added here
        } catch (e) {
            console.error('Save failed', e);
        }
    };

    const handleLoad = () => {
        try {
            const item = localStorage.getItem(STORAGE_KEY);
            if (!item) {
                console.warn('No saved project found');
                return;
            }

            const json = JSON.parse(item);
            // Basic validation
            if (!json.meta || !json.graph) {
                console.error('Invalid project data');
                return;
            }

            loadBlueprint(json);

            // Restore viewport strictly
            if (json.graph.viewport) {
                setViewport(json.graph.viewport);
            }
            console.log('Loaded from localStorage');
        } catch (err) {
            console.error('Load failed', err);
        }
    };

    return (
        <div className="absolute top-4 left-4 z-50 flex gap-2">
            <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg glass-panel px-3 py-2 text-xs font-medium cyber-button"
            >
                <Save className="h-3 w-3" />
                Save (Local)
            </button>
            <button
                onClick={handleLoad}
                className="flex items-center gap-2 rounded-lg glass-panel px-3 py-2 text-xs font-medium cyber-button"
            >
                <FolderOpen className="h-3 w-3" />
                Load (Local)
            </button>
        </div>
    );
}
