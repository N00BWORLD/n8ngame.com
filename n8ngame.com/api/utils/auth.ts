export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
export const N8N_SIGNING_SECRET = process.env.N8N_SIGNING_SECRET;
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';

/**
 * Validates a session cookie. 
 * For MVP, we just check if it exists and has content.
 * In production, verify signature with SESSION_SECRET.
 */
export function validateSession(cookieHeader?: string): boolean {
    if (!cookieHeader) return false;
    // Real validation logic would invoke 'cookie.parse' and check signature
    return cookieHeader.includes('session_id=');
}

import crypto from 'crypto';

/**
 * Generates HMAC-SHA256 signature
 */
export function generateSignature(payload: string, timestamp: number, secret: string): string {
    const data = `${payload}${timestamp}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}
