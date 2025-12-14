import { useEffect, useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { X, Box, Package } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

// ... (interface kept same or imported)
interface InventoryItem {
    id: string;
    item_type: string;
    quantity: number;
    level: number;
    metadata: any;
}

export function InventoryModal() {
    const { isInventoryOpen, setInventoryOpen, inventoryTrigger } = useFlowStore();
    const { t } = useUiStore();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isInventoryOpen) {
            fetchInventory();
        }
    }, [isInventoryOpen, inventoryTrigger]);

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('sb-access-token');
            if (!token) throw new Error('Not authenticated');

            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) throw new Error('Unauthorized');
                throw new Error('Failed to fetch inventory');
            }

            const data = await res.json();
            setItems(data.items || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isInventoryOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[500px] rounded-lg border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl glass-panel relative">
                <button
                    onClick={() => setInventoryOpen(false)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <Package className="h-6 w-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">{t('inventory_title')}</h2>
                </div>

                <div className="min-h-[300px]">
                    {loading && (
                        <div className="flex h-[200px] items-center justify-center text-gray-400 animate-pulse">
                            {t('inventory_loading')}
                        </div>
                    )}

                    {error && (
                        <div className="flex h-[200px] items-center justify-center text-red-400">
                            {error}
                        </div>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-gray-500">
                            <Box className="h-10 w-10 opacity-20" />
                            <p>{t('inventory_empty_state')}</p>
                        </div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded bg-white/5 p-3 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-black/30 text-purple-400">
                                            {item.item_type.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-mono text-sm font-bold text-white uppercase">{item.item_type}</div>
                                            <div className="text-[10px] text-gray-400">Level {item.level}</div>
                                        </div>
                                    </div>
                                    <div className="font-mono text-lg font-bold text-green-400">
                                        x{item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
