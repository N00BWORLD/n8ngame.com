import { TopBar } from './TopBar';
import { SlotStation } from './SlotStation';

export function SlotsScreen() {
    return (
        <div className="flex flex-col h-screen w-full bg-black overflow-hidden font-sans">
            <TopBar />

            <div className="flex-1 overflow-hidden relative">
                <SlotStation />
            </div>
        </div>
    );
}
