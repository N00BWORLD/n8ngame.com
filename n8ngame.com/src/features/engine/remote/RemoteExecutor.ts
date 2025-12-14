import { Blueprint } from "../graph/types";
import { EngineResult, ExecutionConfig } from "../execution/types";
import { RemoteExecutionResponse } from "./types";
// import { useSettingsStore } from "@/features/settings/settingsStore";

export async function executeRemote(
    blueprint: Blueprint,
    config: ExecutionConfig
): Promise<EngineResult> {
    // const { webhookUrl, userSecret } = useSettingsStore.getState();

    // Proxy mode doesn't need client-side URL
    // if (!webhookUrl) { ... }

    // 1. Prepare Request
    const requestPayload: any = {
        userId: 'local-user', // TODO: Identify user
        timestamp: Date.now(),
        blueprint,
        config,
    };

    // TODO: Sign the payload with userSecret (HMAC)
    requestPayload.signature = "mock-signature";

    // 2. Use Proxy Endpoint
    // In Phase 3 (Node API), this changes to /api/execute
    // Note: Vercel was /api/n8n/execute.
    const proxyUrl = '/api/execute';

    try {
        console.log("[RemoteExecutor] Sending request to Proxy:", proxyUrl);

        // First, ensure session exists? 
        // For MVP, we assume session is set on load or we handle 401.
        // Let's try to call. If 401, we might need to call /api/session first.
        // But simpler: just call execute.

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No secret needed here, cookie handles auth
            },
            body: JSON.stringify(requestPayload)
        });

        if (response.status === 401) {
            // Auto-recover session?
            await fetch('/api/session');
            // Retry once?
            throw new Error("Session Expired. Please retry.");
        }

        if (!response.ok) {
            throw new Error(`Proxy Failed: ${response.status} ${response.statusText}`);
        }

        const data: RemoteExecutionResponse = await response.json();


        if (!data.success) {
            throw new Error(data.error || "Remote execution reported failure.");
        }

        if (!data.result) {
            throw new Error("Invalid response: 'result' is missing.");
        }

        return data.result;

    } catch (error: any) {
        console.error("[RemoteExecutor] Error:", error);
        // User-friendly error mapping
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error("Network Error: Could not connect to n8n Webhook. Check URL or CORS settings.");
        }
        throw new Error(error.message || "Unknown Remote Error");
    }
}
