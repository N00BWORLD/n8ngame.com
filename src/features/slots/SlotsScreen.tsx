import { TopBar } from './TopBar';
import { SlotStation } from './SlotStation';
import { N8nPanel } from './N8nPanel';

export function SlotsScreen() {
    return (
        <div className="flex flex-col h-screen w-full bg-black overflow-hidden font-sans">
            <TopBar />

            <div className="flex-1 overflow-hidden relative">
                <SlotStation />
            </div>

            {/* Mission 22-D: n8n Panel Overlay */}
            <N8nPanel />
        </div>
    );
}
