import { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import { SESSION_SECRET } from './utils/auth.js';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Generate a simple session ID (in real app, use UUID)
    const rawSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    // Sign the session ID
    // Simple signature: id + "." + hmac(id, secret)
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(rawSessionId).digest('hex');
    const sessionId = `${rawSessionId}.${signature}`;

    // Set HTTPOnly Cookie
    const cookie = serialize('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });

    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ status: 'session_created', userId: 'anon-user' });
}
