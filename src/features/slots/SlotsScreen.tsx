import { TopBar } from './TopBar';
import { SlotsRack } from './SlotsRack';
import { LogsPanel } from './LogsPanel';
import { InventorySheet } from './InventorySheet';

export function SlotsScreen() {
    return (
        <div className="flex flex-col h-screen w-screen bg-[#0a0a0c] overflow-hidden text-white font-sans selection:bg-cyan-500/30">
            {/* Top Bar covers safe area */}
            <div className="pt-[env(safe-area-inset-top)] bg-black">
                <TopBar />
            </div>

            {/* Main Content: Rack */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <SlotsRack />
            </div>

            {/* Fixed Panels */}
            <LogsPanel />
            <InventorySheet />

            {/* Bottom Safe Area Spacer if needed (LogsPanel handles it visually, but structure wise good to note) */}
            <div className="h-[env(safe-area-inset-bottom)] bg-[#0a0a0c]" />
        </div>
    );
}
