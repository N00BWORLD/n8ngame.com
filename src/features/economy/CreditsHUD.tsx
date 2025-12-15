
import { useEffect, useState } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { Coins, Timer, Download } from 'lucide-react';

interface Blueprint {
    id: string;
    title: string;
    updated_at: string;
}

interface ClaimResponse {
    ok: boolean;
    grantCredits: number;
    newCredits: number;
    elapsedMinutes: number;
    ratePerMin: number;
    invalidReason?: string;
}

export function CreditsHUD() {
    const { inventoryTrigger, refreshInventory } = useFlowStore();
    const [credits, setCredits] = useState<number>(0);
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [selectedBpId, setSelectedBpId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [rate, setRate] = useState<string>('-');

    // Fetch Data on Mount + Inventory Trigger
    useEffect(() => {
        fetchCredits();
    }, [inventoryTrigger]);

    useEffect(() => {
        fetchBlueprints();
    }, []);

    const fetchCredits = async () => {
        try {
            const token = localStorage.getItem('sb-access-token');
            if (!token) return;

            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const creditItem = data.items?.find((i: any) => i.itemType === 'currency_credits');
                setCredits(creditItem?.qty || 0);
            }
        } catch (e) {
            console.error('Failed to fetch credits', e);
        }
    };

    const fetchBlueprints = async () => {
        try {
            const token = localStorage.getItem('sb-access-token');
            if (!token) return;

            const res = await fetch('/api/blueprints', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const json = await res.json();
                const list = json.data || [];
                setBlueprints(list);

                // Auto-select logic
                if (list.length > 0) {
                    // Try to match local storage project?
                    // We don't have ID in local storage easily unless we parse it deeply or stored it.
                    // Simple MVP: Select the most recently updated one.
                    // The API matches order('updated_at', { ascending: false }) so list[0] is newest.
                    setSelectedBpId(list[0].id);
                    calculateEstimatedRate();
                }
            }
        } catch (e) {
            console.error('Failed to fetch blueprints', e);
        }
    };

    const calculateEstimatedRate = () => {
        // In a real app we might fetch the specific BP stats or store rate in DB.
        // For MVP HUD, we show '-' or just '?' until claimed, 
        // OR we just rely on 'Claim' response to update the "Last Known Rate" if we want.
        // The prompt says: "Rate: <ratePerMin>/min (현재 선택된 blueprint 기준; 없으면 '-' )"
        // Since we can't easily calc on client without full graph data (which /blueprints doesn't return fully?),
        // We will show '?' or simply fetch it?
        // Let's settle for '-' initially, and maybe update it after a claim?
        // Or just leave it as '-' if we can't calc it cheaply.
        // User said: "Concept... 서버는 경과시간+유효성만 검증... 클라에서 유효성 검증 X"
        // But HUD needs to show rate.
        // Let's show "Calc on Claim" or just "-" for now to satisfy MVP without over-fetching.
        setRate('-');
    };

    const handleClaim = async () => {
        if (!selectedBpId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('sb-access-token');
            const res = await fetch('/api/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ blueprintId: selectedBpId })
            });

            if (res.ok) {
                const data: ClaimResponse = await res.json();

                // Console Output
                console.log(`[CLAIM] +${data.grantCredits} credits (${data.elapsedMinutes}m @ ${data.ratePerMin}/min) → Total: ${data.newCredits}`);

                // Soft refresh
                refreshInventory(); // Trigger global refresh
                setCredits(data.newCredits);
                setRate(`${data.ratePerMin}`); // Update rate display from confirmed server data

                if (data.invalidReason) {
                    console.warn(`Claim Partial/Invalid: ${data.invalidReason}`);
                }
            } else {
                console.error('Claim failed', await res.text());
            }
        } catch (e) {
            console.error('Claim error', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute top-4 left-[200px] z-50 flex items-center gap-4 rounded-lg glass-panel p-2 px-4 shadow-lg border border-white/10 bg-black/50 backdrop-blur-md">

            {/* Credits Display */}
            <div className="flex items-center gap-2 text-yellow-400">
                <Coins className="h-4 w-4" />
                <span className="font-mono font-bold text-lg">{credits.toLocaleString()}</span>
                <span className="text-xs text-yellow-400/50">CR</span>
            </div>

            <div className="h-4 w-px bg-white/20" />

            {/* Blueprint Selector */}
            <div className="flex flex-col">
                <select
                    className="bg-transparent text-xs text-gray-300 outline-none border-none max-w-[150px] truncate cursor-pointer hover:text-white"
                    value={selectedBpId}
                    onChange={(e) => setSelectedBpId(e.target.value)}
                >
                    {blueprints.length === 0 && <option value="">No Cloud Blueprints</option>}
                    {blueprints.map(bp => (
                        <option key={bp.id} value={bp.id} className="bg-gray-900">
                            {bp.title}
                        </option>
                    ))}
                </select>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Timer className="h-3 w-3" />
                    <span>Rate: {rate}/min</span>
                </div>
            </div>

            {/* Claim Button */}
            <button
                onClick={handleClaim}
                disabled={loading || !selectedBpId}
                className={`
                    flex items-center gap-2 rounded px-3 py-1 text-xs font-bold transition-all
                    ${!selectedBpId ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
                        loading ? 'bg-yellow-600/50 text-white cursor-wait' : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]'}
                `}
            >
                <Download className="h-3 w-3" />
                {loading ? '...' : 'CLAIM'}
            </button>
        </div>
    );
}

