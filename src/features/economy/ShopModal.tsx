import { X, ShoppingCart, Zap, Timer, Layout } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

const UPGRADE_INFO = {
    maxGas: {
        label: 'Gas Tank',
        icon: <Zap className="h-5 w-5 text-cyan-400" />,
        desc: 'Increases max execution steps.',
        effect: (lvl: number) => `Cap: ${100 + (lvl * 50)}`,
        config: { baseCost: 100, mult: 1.6 }
    },
    tickSpeed: {
        label: 'Overclock',
        icon: <Timer className="h-5 w-5 text-purple-400" />,
        desc: 'Faster Auto Run interval.',
        effect: (lvl: number) => {
            const speed = 2000 - (lvl * 200);
            return `${speed < 800 ? 800 : speed}ms`;
        },
        config: { baseCost: 150, mult: 1.7 }
    },
    nodeLimit: {
        label: 'Mainboard',
        icon: <Layout className="h-5 w-5 text-orange-400" />,
        desc: 'Increase max node capacity.',
        effect: (lvl: number) => `Slots: ${20 + (lvl * 5)}`,
        config: { baseCost: 200, mult: 1.8 }
    }
};

export function ShopModal() {
    const { isShopOpen, setShopOpen, upgrades, buyUpgrade, credits } = useFlowStore();

    if (!isShopOpen) return null;

    const getCost = (type: keyof typeof UPGRADE_INFO, currentLvl: number) => {
        const config = UPGRADE_INFO[type].config;
        return Math.floor(config.baseCost * Math.pow(config.mult, currentLvl));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-yellow-500/20 p-2">
                            <ShoppingCart className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Component Shop</h2>
                            <p className="text-xs text-gray-400">Upgrade your local runtime environment</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShopOpen(false)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Balance */}
                <div className="px-6 py-4 bg-yellow-500/5 border-b border-white/5 flex justify-between items-center">
                    <span className="text-sm text-gray-400">Current Balance</span>
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-bold font-mono text-xl">{credits.toLocaleString()} CR</span>
                    </div>
                </div>

                {/* Upgrade List */}
                <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-3">
                    {(Object.keys(UPGRADE_INFO) as Array<keyof typeof UPGRADE_INFO>).map((key) => {
                        const item = UPGRADE_INFO[key];
                        const level = upgrades[key];
                        const cost = getCost(key, level);
                        const canAfford = credits >= cost;

                        // Limit check for tickSpeed
                        const isMaxed = key === 'tickSpeed' && (2000 - (level * 200)) <= 800;

                        return (
                            <div key={key} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="rounded-lg bg-black/40 p-2 border border-white/5">
                                        {item.icon}
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">Lv.{level}</span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-white">{item.label}</h3>
                                    <p className="text-xs text-gray-400 min-h-[2.5em]">{item.desc}</p>
                                </div>

                                <div className="bg-black/20 rounded p-2 text-center my-1">
                                    <span className="text-xs text-cyan-400 font-mono block">Current: {item.effect(level)}</span>
                                    <span className="text-[10px] text-gray-500 block">Next: {item.effect(level + 1)}</span>
                                </div>

                                <button
                                    onClick={() => buyUpgrade(key)}
                                    disabled={!canAfford || isMaxed}
                                    className={`mt-auto w-full py-2 px-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all
                                        ${isMaxed
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : canAfford
                                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg active:scale-95'
                                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isMaxed ? 'MAXED' : `${cost.toLocaleString()} CR`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
