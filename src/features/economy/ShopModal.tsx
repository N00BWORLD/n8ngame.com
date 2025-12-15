import { X, ShoppingCart, TrendingUp, Zap, Clock, Cpu } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { fromNumber, cmp, formatBigNum } from '@/lib/bigNum';

const UPGRADE_LABELS = {
    nodeLimit: { name: 'Max Nodes', icon: Cpu, desc: '+1 Node Capacity' },
    maxGas: { name: 'Gas Unit', icon: Zap, desc: '+5 Max Gas' },
    tickSpeed: { name: 'Auto Run', icon: Clock, desc: '-1 Min Interval' },
} as const;

export function ShopModal() {
    const { isShopOpen, setShopOpen, credits, upgrades, buyUpgrade } = useFlowStore();

    if (!isShopOpen) return null;

    // Helper to calculate cost dynamically based on store logic
    // We replicate the formula here or just use a helper if we exposed it. 
    // Since we didn't expose getCost, we replicate standard formula: base * (mult ^ level)
    // CAUTION: Must match flowStore.ts UPGRADE_CONFIG exactly or use store getter.
    // For MVP, we will assume the store handles validation and we just display "Buy".
    // Better: let's calc cost here for display.

    // Hardcoded Config Mirror (Ideally imported, but Config is internal to store currently)
    // We should export UPGRADE_CONFIG from store or config file. 
    // For now, mirroring values from Mission 15-C spec.
    const getCost = (type: keyof typeof upgrades, level: number) => {
        let base = 0, mult = 2;
        if (type === 'nodeLimit') base = 50;
        if (type === 'maxGas') base = 80;
        if (type === 'tickSpeed') base = 100;
        const val = Math.floor(base * Math.pow(mult, level));
        return fromNumber(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 border-b border-white/5">
                    <div className="flex items-center gap-2 text-yellow-500">
                        <ShoppingCart className="h-5 w-5" />
                        <h2 className="font-bold">Upgrade Shop</h2>
                    </div>
                    <button
                        onClick={() => setShopOpen(false)}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Credits Display */}
                <div className="p-4 bg-black/20 text-center border-b border-white/5">
                    <span className="text-gray-400 text-sm uppercase tracking-widest">Available Credits</span>
                    <div className="text-3xl font-bold text-yellow-400 font-mono mt-1">
                        {formatBigNum(credits)} <span className="text-sm">CR</span>
                    </div>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3">
                    {(Object.keys(UPGRADE_LABELS) as Array<keyof typeof upgrades>).map((key) => {
                        const info = UPGRADE_LABELS[key];
                        const level = upgrades[key];
                        const cost = getCost(key, level);
                        const canAfford = cmp(credits, cost) >= 0;

                        return (
                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p - 2 rounded bg - gray - 800 ${canAfford ? 'text-cyan-400' : 'text-gray-600'} `}>
                                        <info.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{info.name} <span className="text-xs text-gray-500 ml-1">Lv.{level}</span></div>
                                        <div className="text-xs text-gray-400">{info.desc}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => buyUpgrade(key)}
                                    disabled={!canAfford}
                                    className={`flex items - center gap - 1.5 px - 3 py - 1.5 rounded text - xs font - bold transition - all
                                        ${canAfford
                                            ? 'bg-yellow-600 text-white hover:bg-yellow-500 active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        }
`}
                                >
                                    <span>{formatBigNum(cost)} CR</span>
                                    {canAfford && <TrendingUp className="h-3 w-3" />}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 text-center text-[10px] text-gray-600 bg-black/20">
                    Prices double after every purchase.
                </div>
            </div>
        </div>
    );
}
