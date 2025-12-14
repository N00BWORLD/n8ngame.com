import { redis } from '../services/redis.js';
import crypto from 'crypto';

import { redis } from '../services/redis.js';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

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
