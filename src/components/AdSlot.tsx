

export function AdSlot({ width = 300, height = 250 }: { width?: number; height?: number }) {
    const isEnabled = import.meta.env.VITE_AD_SLOTS === 'true';

    if (!isEnabled) return null;

    return (
        <div
            className="bg-gray-800/50 border border-white/5 flex items-center justify-center text-gray-600 text-[10px] font-mono select-none pointer-events-none"
            style={{ width, height }}
        >
            AD SLOT ({width}x{height})
        </div>
    );
}
