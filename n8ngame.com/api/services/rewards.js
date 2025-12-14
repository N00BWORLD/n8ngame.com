
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

/**
 * Calculate rewards based on Blueprint and Execution Result
 */
export function computeRewards(blueprint, result) {
    const rewards = [];
    const { nodes = [], connections = [] } = blueprint;
    const isSuccess = result?.ok || result?.success;

    // 1. Always Grant: node_fragment (if successful)
    if (isSuccess) {
        rewards.push({ itemType: 'node_fragment', qty: 1, level: 1 });
    }

    // 2. Conditional: logic_circuit (Nodes >= 3)
    if (isSuccess && nodes.length >= 3) {
        rewards.push({ itemType: 'logic_circuit', qty: 1, level: 1 });
    }

    // 3. Probability: pure_core (Edges >= 5, 10% Chance)
    if (isSuccess && connections.length >= 5) {
        if (Math.random() < 0.1) {
            rewards.push({ itemType: 'pure_core', qty: 1, level: 1 });
        }
    }

    return rewards;
}

/**
 * Grant rewards to User's Inventory (Server Authoritative)
 * Uses Service Role to bypass RLS, but strictly filters by user_id.
 * MVP Strategy: Read -> Calculate -> Upsert to handle accumulation.
 */
export async function grantRewards(userId, rewards) {
    if (!rewards || rewards.length === 0) return [];
    if (!serviceRoleKey) throw new Error("Reward Service: Missing Service Key");

    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Group by itemType+level to minimize DB calls
    // (Simpler: just iterate for MVP, or Promise.all)

    const results = [];

    for (const reward of rewards) {
        const { itemType, qty, level = 1 } = reward;

        // 1. Fetch current quantity
        const { data: existing, error: fetchError } = await sb
            .from('inventory')
            .select('*')
            .eq('user_id', userId)
            .eq('item_type', itemType)
            .eq('level', level)
            .maybeSingle(); // Returns null if not found

        if (fetchError) {
            console.error('[GrantReward] Fetch Error:', fetchError);
            continue; // Skip this item on error (Fail partial)
        }

        const currentQty = existing ? existing.quantity : 0;
        const newQty = currentQty + qty;

        // 2. Upsert
        const payload = {
            user_id: userId,
            item_type: itemType,
            level: level,
            quantity: newQty,
            updated_at: new Date()
        };
        // If existing, keep metadata, else empty
        if (existing) payload.metadata = existing.metadata;

        const { data: saved, error: saveError } = await sb
            .from('inventory')
            .upsert(payload, { onConflict: 'user_id, item_type, level' })
            .select()
            .single();

        if (saveError) {
            console.error('[GrantReward] Save Error:', saveError);
        } else {
            results.push(saved);
        }
    }

    return results;
}
