import { redis } from '../services/redis.js';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Schema for Execution Payload
const ExecuteSchema = z.object({
    blueprint: z.object({
        nodes: z.array(z.any()),
        connections: z.any()
    }),
    config: z.object({
        maxGas: z.number().optional()
    }).optional(),
    timestamp: z.number().optional(),
    // We can rely on JWT for identity, but signature/nonce is still good for replay protection
    // prompt says "session/nonce/rate-limit is maintained but reinforced by user"
});

export function gameGateway(io) {
    // Middleware: Auth Check (JWT)
    io.use(async (socket, next) => {
        try {
            // 1. Check for Token in Auth Object (Standard Socket.io v3+)
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                // Fallback to Cookie (Legacy/Dev) if no token provided? 
                // Plan says "Eliminate reliance on insecure... move to strictly identified".
                // But for smooth dev, maybe we keep cookie path or fail?
                // Let's strict fail as per plan "Disconnect if invalid".
                return next(new Error('Authentication error: No Token'));
            }

            // 2. Verify JWT
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("Missing JWT_SECRET");
                return next(new Error('Server Error: Auth Config Missing'));
            }

            const decoded = jwt.verify(token, secret);
            // Supabase JWT has 'sub' as UUID
            const userId = decoded.sub;

            if (!userId) return next(new Error('Authentication error: Invalid Token Claims'));

            // 3. Attach User
            socket.user = { id: userId, ...decoded }; // { id: 'uuid', role: 'authenticated', ... }
            socket.sessionId = userId; // Reuse session ID concept as User ID for now, or keep separate?
            // "Reinforce... user based". Let's map socket.sessionId -> userId for clearer logs,
            // or keep socket.sessionId as socket.id and use socket.user.id for logic.
            // Let's use socket.user.id for business logic.

            next();
        } catch (err) {
            console.error("WS Auth Error:", err.message);
            next(new Error('Authentication error: Invalid Token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`Client connected: ${socket.id} (User: ${userId})`);

        // Join User Room
        socket.join(`user:${userId}`);

        socket.on('game:execute', async (payload) => {
            try {
                // 1. Validation (Zod)
                const validated = ExecuteSchema.parse(payload);

                // 2. Replay & Rate Limit Check
                const redisOk = redis.status === 'ready';
                if (!redisOk) {
                    socket.emit('error', { code: 'SERVICE_UNAVAILABLE', message: 'Auth Service Down' });
                    return;
                }

                const now = Date.now();

                // Replay Protection (User + Timestamp + BodyHash)
                const bodyJson = JSON.stringify(validated.blueprint);
                const bodyHash = crypto.createHash('sha256').update(bodyJson).digest('hex');
                const nonceKey = `nonce:${userId}:${validated.timestamp || now}:${bodyHash}`;

                const nonceExists = await redis.set(nonceKey, '1', 'EX', 300, 'NX');
                if (!nonceExists) {
                    socket.emit('error', { code: 'REPLAY_DETECTED', message: 'Request already processed' });
                    return;
                }

                // Rate Limit (User Based)
                // Limit: 5 requests per second per User (Premium tier logic can be added here)
                const rateKey = `ratelimit:${userId}:execute`;
                const currentRate = await redis.incr(rateKey);
                if (currentRate === 1) {
                    await redis.expire(rateKey, 1);
                }
                if (currentRate > 5) { // Increased limit for authenticated users
                    socket.emit('error', { code: 'RATE_LIMIT', message: 'Slow down' });
                    return;
                }

                // 3. Proxy to n8n
                const N8N_URL = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/';

                socket.emit('execution_ack', { status: 'forwarding', jobId: nonceKey });

                // Construct Server-Signed Payload
                const serverSecret = process.env.N8N_SIGNING_SECRET || '';
                const payloadStr = JSON.stringify({
                    userId: userId, // Pass User ID to n8n
                    blueprint: validated.blueprint
                });
                const serverSig = crypto.createHmac('sha256', serverSecret).update(payloadStr + now).digest('hex');

                const n8nRes = await fetch(N8N_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-N8N-Timestamp': now.toString(),
                        'X-N8N-Signature': serverSig,
                        'X-N8N-User-Id': userId
                    },
                    body: payloadStr
                });

                if (!n8nRes.ok) throw new Error(`n8n Status ${n8nRes.status}`);

                const result = await n8nRes.json();

                // 4. Broadcast Result
                socket.emit('execution_result', { success: true, ...result });

            } catch (err) {
                console.error("Execute Error:", err);
                if (err instanceof z.ZodError) {
                    socket.emit('error', { code: 'VALIDATION_ERROR', message: err.errors });
                } else {
                    socket.emit('error', { code: 'INTERNAL_ERROR', message: "Processing Error" });
                }
            }
        });
    });
}
