import { redis } from '../services/redis.js';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { computeRewards, grantRewards } from '../services/rewards.js';

// Supabase Admin Client (Service Role)
const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

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
                // Temporary logic placeholder if imports missing:
                // But I should do it right.

                // Let's proceed with just the logic here, assuming I added import. 
                // Wait, I haven't added import yet.
                // I'll switch to multi_replace to add import + update route.

                return json;

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
