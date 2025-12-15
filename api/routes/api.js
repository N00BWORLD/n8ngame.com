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

    });
}
