import { useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { ShoppingCart, Package } from 'lucide-react';

interface ShopResponse {
    ok: boolean;
    sku: string;
    spent: number;
    newCredits: number;
    drop: {
        nodeId: string;
        rarity: string;
        mode: 'unlocked' | 'duplicate_fragment';
        fragmentQty?: number;
    };
    error?: string;
    message?: string;
}

export function ShopPanel() {
    const { refreshInventory } = useFlowStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const handleBuy = async (sku: string) => {
        setLoading(sku);
        try {
            const token = localStorage.getItem('sb-access-token');
            const res = await fetch('/api/shop/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sku })
            });

            const data: ShopResponse = await res.json();

            if (res.ok && data.ok) {
                // Formatting Log
                const timestamp = new Date().toLocaleTimeString([], { hour12: false });
                let msg = `[${timestamp}] [SHOP] Spent ${data.spent}, `;

                if (data.drop.mode === 'unlocked') {
                    msg += `Unlocked node ${data.drop.nodeId} (${data.drop.rarity.toUpperCase()})`;
                } else {
                    msg += `Duplicate ${data.drop.nodeId} -> +${data.drop.fragmentQty} fragments`;
                }

                setLogs(prev => [msg, ...prev].slice(0, 5)); // Keep last 5 logs
                console.log(msg); // Also log to console as requested

                refreshInventory(); // Refresh Inventory & Credits HUD
            } else {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] Error: ${data.message || 'Purchase Failed'}`, ...prev].slice(0, 5));
            }
        } catch (e) {
            console.error(e);
            setLogs(prev => [`Error: Connection Failed`, ...prev].slice(0, 5));
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="absolute top-[80px] left-[200px] z-50 flex flex-col gap-2 rounded-lg glass-panel p-4 shadow-lg border border-white/10 bg-black/60 backdrop-blur-md w-[300px]">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-purple-400" />
                <span className="font-bold text-sm text-white">Node Shop</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleBuy('basic_pack')}
                    disabled={!!loading}
                    className="flex flex-col items-center justify-center gap-1 p-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition"
                >
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-bold">Basic Pack</span>
                    <span className="text-[10px] text-yellow-500">100 CR</span>
                </button>

                <button
                    onClick={() => handleBuy('advanced_pack')}
                    disabled={!!loading}
                    className="flex flex-col items-center justify-center gap-1 p-2 bg-gray-800 hover:bg-gray-700 rounded border border-purple-900/50 hover:border-purple-500 transition"
                >
                    <Package className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-200">Adv Pack</span>
                    <span className="text-[10px] text-yellow-500">300 CR</span>
                </button>
            </div>

            {/* Mini Log Console */}
            {logs.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-gray-400 bg-black/50 p-2 rounded max-h-[100px] overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
