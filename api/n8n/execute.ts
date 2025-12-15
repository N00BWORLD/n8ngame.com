import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateSignature, N8N_SIGNING_SECRET, N8N_WEBHOOK_URL, validateSession } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Validate Session
    if (!validateSession(req.headers.cookie)) {
        return res.status(401).json({ error: 'Unauthorized: Missing Session' });
    }

    // 2. Validate Env
    if (!N8N_WEBHOOK_URL || !N8N_SIGNING_SECRET) {
        return res.status(500).json({ error: 'Server Misconfiguration: Missing N8N Secrets' });
    }

    try {
        const body = req.body;
        const timestamp = Date.now();
        const payloadString = JSON.stringify(body);

        // 3. Generate Signature
        const signature = generateSignature(payloadString, timestamp, N8N_SIGNING_SECRET);

        // 4. Forward to n8n
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-Timestamp': timestamp.toString(),
                'X-N8N-Signature': signature,
                'X-N8N-Session-User': 'anon-user' // Simplified
            },
            body: payloadString
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n Error: ${n8nResponse.statusText}`);
        }

        const data = await n8nResponse.json();
        return res.status(200).json(data);

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Proxy Error' });
    }
}
