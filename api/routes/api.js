import { NODE_CATALOG, SHOP_ITEMS } from '../services/catalog.js';
import { redis } from '../services/redis.js';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { computeRewards, grantRewards } from '../services/rewards.js';
import { evaluateMissions } from '../services/missions.js';
import { calculateScore } from '../services/scoring.js';

// Supabase Admin Client (Service Role)
const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

// Schema for Validation
const BlueprintSchema = z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()).optional(),
    connections: z.array(z.any()).optional()
});

// Auth Middleware: Verify JWT and inject user
async function authenticate(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return reply.code(401).send({ error: 'unauthorized', message: 'Missing Authorization Header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return reply.code(401).send({ error: 'unauthorized', message: 'Token Missing' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET missing');

        const decoded = jwt.verify(token, secret);
        // Valid JWT
        request.user = { id: decoded.sub };
    } catch (err) {
        request.log.warn(`Auth Failed: ${err.message}`);
        return reply.code(401).send({ error: 'unauthorized', message: 'Invalid Token' });
    }
}

export async function apiRoutes(fastify, options) {

    // Health Check
    fastify.get('/health', async (request, reply) => {
        return { status: 'ok', time: Date.now() };
    });

    // Authenticated Routes
    fastify.register(async function (privateRoutes) {
        privateRoutes.addHook('preHandler', authenticate);

        // GET /api/me
        privateRoutes.get('/me', async (request, reply) => {
            return { id: request.user.id, role: 'authenticated' };
        });

        // GET /api/blueprints (Own Data Only)
        privateRoutes.get('/blueprints', async (request, reply) => {
            if (!serviceRoleKey) return reply.code(500).send({ error: 'server_error', message: 'DB Config Missing' });

            const sb = createClient(supabaseUrl, serviceRoleKey);

            // STRICT FILTERING: .eq('user_id', request.user.id)
            const { data, error } = await sb
                .from('blueprints')
                .select('*')
                .eq('user_id', request.user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                request.log.error(error);
                return reply.code(500).send({ error: 'db_error', message: error.message });
            }
            return { data };
        });

        // GET /api/inventory (Mission 11-E)
        privateRoutes.get('/inventory', async (request, reply) => {
            if (!serviceRoleKey) return reply.code(500).send({ error: 'server_error', message: 'DB Config Missing' });

            const sb = createClient(supabaseUrl, serviceRoleKey);

            // Fetch User Inventory
            let items = [];
            let error = null;

            if (process.env.MOCK_DB === 'true') {
                items = [
                    { item_type: 'node_fragment', quantity: 5, level: 1, metadata: {}, updated_at: new Date().toISOString() },
                    { item_type: 'logic_circuit', quantity: 2, level: 1, metadata: {}, created_at: new Date().toISOString() }
                ];
            } else {
                const { data, error: dbErr } = await sb
                    .from('inventory')
                    .select('*')
                    .eq('user_id', request.user.id)
                    .order('item_type', { ascending: true })
                    .order('level', { ascending: true });
                items = data;
                error = dbErr;
            }

            if (error) {
                request.log.error(error);
                return reply.code(500).send({ error: 'db_error', message: error.message });
            }

            // Map to CamelCase strictly per requirements
            const mappedItems = (items || []).map(i => ({
                itemType: i.item_type,
                qty: i.quantity ?? (i.metadata?.stack || 1), // Fallback to meta.stack
                level: i.level,
                meta: i.metadata,
                updatedAt: i.updated_at || i.created_at
            }));

            return { ok: true, items: mappedItems };
        });

        // POST /api/execute-blueprint (Mission 11-B + 11-D-2)
        privateRoutes.post('/execute-blueprint', async (request, reply) => {
            try {
                // 1. Validate Body
                const body = request.body || {};
                const blueprint = body.blueprint;

                if (!blueprint) return reply.code(400).send({ error: 'bad_request', message: 'Missing blueprint in body' });

                // Zod Validation
                try {
                    BlueprintSchema.parse(blueprint);
                } catch (zodError) {
                    return reply.code(400).send({ error: 'validation_error', details: zodError.errors });
                }

                const n8nUrl = process.env.N8N_INTERNAL_WEBHOOK_URL;
                if (!n8nUrl) return reply.code(500).send({ error: 'server_error', message: 'Webhook URL Not Configured' });

                // 2. Construct Payload
                const payload = {
                    userId: request.user.id,
                    blueprint: blueprint,
                    requestId: crypto.randomUUID(),
                    sentAt: new Date().toISOString()
                };

                // 3. Forward to n8n
                const response = await fetch(n8nUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const text = await response.text();
                    return reply.code(502).send({ error: 'n8n_error', status: response.status, message: text });
                }

                const json = await response.json();

                // Mission 11-D-2: Reward Calculation & Granting
                let combinedRewards = [];
                let grantedAt = null;
                let finalMissions = [];
                let missionRewards = [];

                try {
                    // Fetch Inventory (Safe fail)
                    let inventory = [];
                    try {
                        const sb = createClient(supabaseUrl, serviceRoleKey);
                        const { data } = await sb.from('inventory').select('*').eq('user_id', request.user.id);
                        if (data) inventory = data;
                    } catch (dbErr) {
                        request.log.error(dbErr, 'Inventory Fetch Failed');
                    }

                    // 1. Calculate Execution Rewards
                    const execRewards = computeRewards(blueprint, json);
                    combinedRewards = [...execRewards];

                    // 2. Evaluate Missions (Safe fail)
                    try {
                        const { missions, newRewards } = await evaluateMissions({
                            userId: request.user.id,
                            blueprint: blueprint,
                            n8nResponse: json,
                            inventoryBadges: inventory
                        });
                        finalMissions = missions;
                        missionRewards = newRewards;
                        combinedRewards = [...combinedRewards, ...missionRewards];
                    } catch (missionErr) {
                        request.log.error(missionErr, 'Mission Eval Failed');
                        // On error, return current missions state if possible, or empty?
                        // Ideally we should re-calculate state without "justCompleted" if it failed,
                        // but here we just leave it empty or failed.
                    }

                    // 3. Grant (Safe fail)
                    if (combinedRewards.length > 0) {
                        try {
                            await grantRewards(request.user.id, combinedRewards);
                            grantedAt = new Date().toISOString();
                        } catch (grantErr) {
                            request.log.error(grantErr, 'Grant Write Failed');
                            json.rewardError = 'DB Write Failed';
                        }
                    }
                } catch (unexpectedErr) {
                    request.log.error(unexpectedErr, 'Refactored Reward Logic Error');
                }

                // Mission 12-A: Calculate Score
                const justCompletedCount = (finalMissions || []).filter(m => m.justCompleted).length;
                const scoreResult = calculateScore(blueprint, json, justCompletedCount);


                return {
                    ...json,
                    rewards: combinedRewards,
                    missionRewards: missionRewards, // Explicitly separation for UI
                    missions: finalMissions,
                    grantedAt,
                    // Mission 12-A: Scoring
                    ...scoreResult
                };

            } catch (err) {
                request.log.error(err);
                return reply.code(500).send({ error: 'internal_error', message: err.message });
            }
        });

        // POST /api/blueprints (Upsert Own Data)
        privateRoutes.post('/blueprints', async (request, reply) => {
            const { title, structure_version, data: graphData, id } = request.body || {};

            if (!graphData) return reply.code(400).send({ error: 'bad_request', message: 'Missing graph data' });

            const sb = createClient(supabaseUrl, serviceRoleKey);
            const userId = request.user.id; // Enforce User ID

            // 1. Upsert Blueprint Metadata
            const payload = {
                user_id: userId,
                title: title || 'Untitled',
                structure_version: structure_version || 1,
                updated_at: new Date()
            };
            if (id) payload.id = id; // Upsert if ID provided

            const { data: bp, error: bpError } = await sb
                .from('blueprints')
                .upsert(payload, { onConflict: 'id' })
                .select()
                .single();

            if (bpError) {
                request.log.error(bpError);
                return reply.code(500).send({ error: 'db_error', desc: bpError.message });
            }

            // 2. Insert Version (Snapshot)
            const blueprintId = bp.id;

            // Fetch max version
            const { data: maxVer } = await sb
                .from('blueprint_versions')
                .select('version')
                .eq('blueprint_id', blueprintId)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            const nextVersion = (maxVer?.version || 0) + 1;

            const { error: vError } = await sb
                .from('blueprint_versions')
                .insert({
                    blueprint_id: blueprintId,
                    version: nextVersion,
                    data: graphData
                });

            if (vError) request.log.warn(`Version Save Failed: ${vError.message}`);

            return { success: true, id: blueprintId, version: nextVersion, updated_at: bp.updated_at };
        });

        // POST /api/claim (Mission 12-IDLE-1: Idle Economy Loop)
        privateRoutes.post('/claim', async (request, reply) => {
            const { blueprintId } = request.body || {};
            if (!blueprintId) return reply.code(400).send({ error: 'bad_request', message: 'Missing blueprintId' });

            const sb = createClient(supabaseUrl, serviceRoleKey);
            const userId = request.user.id;

            // 1. Verify Blueprint Ownership
            const { data: blueprint, error: bpError } = await sb
                .from('blueprints')
                .select('*')
                .eq('id', blueprintId)
                .eq('user_id', userId)
                .single();

            if (bpError || !blueprint) {
                return reply.code(403).send({ error: 'forbidden', message: 'Blueprint not found or access denied' });
            }

            // 2. Fetch Last Claim Time (inventory: meta_last_claim)
            const { data: lastClaimItem } = await sb
                .from('inventory')
                .select('*')
                .eq('user_id', userId)
                .eq('item_type', 'meta_last_claim')
                .single();

            const lastClaimTs = lastClaimItem?.metadata?.ts
                ? new Date(lastClaimItem.metadata.ts).getTime()
                : Date.now(); // First time: treat as now (0 elapsed) effectively, or give initial buffer?
            // Prompt says "lastClaim = ... (없으면 now로 초기화)". So 0 reward first time.

            const now = Date.now();
            let elapsedMs = now - lastClaimTs;
            if (elapsedMs < 0) elapsedMs = 0;

            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const CAP_MINUTES = 720; // 12 hours
            const validMinutes = Math.min(elapsedMinutes, CAP_MINUTES);

            // 3. Blueprint Validation & Rate Calculation
            let ratePerMin = 0;
            let invalidReason = null;

            // Fetch latest version data usually? Or use 'blueprint' table assuming it has 'data' column?
            // api/routes/api.js upsert puts 'data' into 'blueprint_versions', but prompt says "Server... DB에서 '내 blueprint'를 조회".
            // The 'blueprints' table might not have the graph data if it's normalized.
            // Let's check 'POST /blueprints' implementation: it does upsert to 'blueprints' with payload?
            // "const { data: bp ... } = await sb.from('blueprints').upsert(...)" -> payload has title, structure_version.
            // The graph data ('data') is inserted into 'blueprint_versions'.
            // So 'blueprints' table MIGHT NOT have the nodes/edges.
            // I need to fetch the latest version content.

            // However, the previous code for Upsert `POST /blueprints` receives `data: graphData` and inputs it to `blueprint_versions`.
            // Let's look if `blueprints` table has a json column. 
            // In `GET /blueprints`, it selects `*`.
            // If `blueprints` table does not have the graph, I must fetch from `blueprint_versions`.

            // Assume I need to fetch the version.
            const { data: versionData, error: verError } = await sb
                .from('blueprint_versions')
                .select('data')
                .eq('blueprint_id', blueprintId)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            const graph = versionData?.data;

            if (!graph || !graph.nodes || !Array.isArray(graph.nodes)) {
                ratePerMin = 0;
                invalidReason = "Invalid Blueprint Data";
            } else {
                // Loop Detection (Simple DFS)
                const hasCycle = (nodes, edges) => {
                    if (!edges || edges.length === 0) return false;
                    const adj = {};
                    edges.forEach(e => {
                        if (!adj[e.source]) adj[e.source] = [];
                        adj[e.source].push(e.target);
                    });

                    const visited = new Set();
                    const recStack = new Set();

                    const dfs = (nodeId) => {
                        if (recStack.has(nodeId)) return true;
                        if (visited.has(nodeId)) return false;
                        visited.add(nodeId);
                        recStack.add(nodeId);
                        const children = adj[nodeId] || [];
                        for (const child of children) {
                            if (dfs(child)) return true;
                        }
                        recStack.delete(nodeId);
                        return false;
                    };

                    for (const n of nodes) {
                        if (dfs(n.id)) return true;
                    }
                    return false;
                };

                if (hasCycle(graph.nodes, graph.edges)) {
                    ratePerMin = 0;
                    invalidReason = "Cycle Detected";
                } else {
                    // Rate Calculation
                    const nodesLen = graph.nodes.length;
                    const edgesLen = (graph.edges || []).length;
                    const base = 5;
                    let modifierBonus = 0;

                    // Option: modifier/variable node bonus
                    // Checking for 'variable' type or similar based on prompt hints
                    // "modifier/variable 노드가 있으면 +2 보너스"
                    const hasModifier = graph.nodes.some(n =>
                        n.type === 'variable' || n.type?.includes('modifier') || n.data?.label?.toLowerCase().includes('variable')
                    );
                    if (hasModifier) modifierBonus = 2;

                    ratePerMin = base + (nodesLen * 1) + (edgesLen * 2) + modifierBonus;
                }
            }

            // 4. Calculate Rewards
            const grantCredits = (validMinutes > 0 && !invalidReason) ? (ratePerMin * validMinutes) : 0;

            // 5. Update DB (Credits + Last Claim)
            let newCredits = 0;

            if (grantCredits > 0) {
                // Upsert Credits
                // Need to fetch current to add? Or upsert with logic?
                // Supabase doesn't support atomic increment easily without RPC.
                // For MVP, we fetch, add, update. (Race condition accepted for MVP)
                const { data: creditItem } = await sb
                    .from('inventory')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('item_type', 'currency_credits')
                    .single();

                const currentQty = creditItem?.quantity ?? (creditItem?.metadata?.stack || 0);
                newCredits = currentQty + grantCredits;

                await sb.from('inventory').upsert({
                    user_id: userId,
                    item_type: 'currency_credits',
                    quantity: newCredits,
                    metadata: { stack: newCredits }, // Keep both in sync for safety
                    updated_at: new Date()
                }, { onConflict: 'user_id, item_type' });
            }

            // Update Last Claim to NOW (reset timer)
            // Even if grant is 0, we verify if we should reset?
            // "Claim을 누르면... meta_last_claim을 now로 업데이트" -> Always reset to prevent double dipping or just acknowledge interaction.
            // If 0 minutes elapsed, usually we don't reset to let it accumulate more?
            // "같은 분에 연속 Claim하면 elapsedMinutes=0 => 지급 0"
            // If we reset, they lose the fractional seconds/minutes.
            // But prompt says "step 8) meta_last_claim을 now로 업데이트". Implicitly always.
            await sb.from('inventory').upsert({
                user_id: userId,
                item_type: 'meta_last_claim',
                metadata: { ts: new Date().toISOString() },
                updated_at: new Date()
            }, { onConflict: 'user_id, item_type' });

            return {
                ok: true,
                blueprintId,
                elapsedMinutes: validMinutes,
                ratePerMin,
                grantCredits,
                newCredits,
                invalidReason
            };
        });

        // POST /api/run-text (Mission API-UI-1)
        privateRoutes.post('/run-text', async (request, reply) => {
            const { inputText, state } = request.body || {};
            const userId = request.user.id;

            // Default N8N URL (or Mock for local dev if missing)
            const n8nUrl = process.env.N8N_WEBHOOK_URL;

            if (!n8nUrl) {
                // Local Fallback / Mock
                request.log.warn('N8N_WEBHOOK_URL not set. Using mock response.');
                return {
                    lines: [`[MOCK] Echo: ${inputText}`, `(Server state: ${state})`],
                    nextState: state,
                    rewards: []
                };
            }

            try {
                const response = await fetch(n8nUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, state, inputText })
                });

                if (!response.ok) {
                    const text = await response.text();
                    return reply.code(502).send({ error: 'n8n_error', message: text });
                }

                const json = await response.json();
                return json; // Expect { lines: [], nextState: "", rewards: [] }

            } catch (err) {
                request.log.error(err);
                return reply.code(500).send({ error: 'proxy_error', message: err.message });
            }
        });

        // POST /api/mine (Mission N8N-MINE-MVP-1)
        privateRoutes.post('/mine', async (request, reply) => {
            const { elapsedSec, state, loadout } = request.body || {};
            const userId = request.user.id;
            const n8nUrl = process.env.N8N_WEBHOOK_URL ? `${process.env.N8N_WEBHOOK_URL.replace(/\/$/, '')}/text-mine/run` : null;

            if (!n8nUrl) {
                return { ok: false, error: "Server Required (N8N_WEBHOOK_URL missing)" };
            }

            try {
                const response = await fetch(n8nUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, elapsedSec, state, loadout })
                });

                if (!response.ok) {
                    const text = await response.text();
                    return { ok: false, error: `n8n Error: ${text}` };
                }

                const json = await response.json();
                return json;

            } catch (err) {
                request.log.error(err);
                return { ok: false, error: `Proxy Error: ${err.message}` };
            }
        });

    });
}

