# n8n Setup Guide (Remote Execution)

This guide explains how to set up the **n8n** side to handle remote execution requests from the Game Client.

## Prerequisites
- An instance of n8n (Cloud, Self-Hosted Docker, or Desktop).
- The instance must be accessible from the internet (or Vercel) via a public URL.

## 1. Import Workflow
1.  Open your n8n dashboard.
2.  Go to **Workflows**.
3.  Click **Import** (or "Add workflow" -> "Import from File").
4.  Select `n8n/workflows/execute-blueprint.json` from this project.
5.  You should see a flow: `Webhook` -> `Verify Signature` -> `Execute (Mock)` -> `Respond`.

## 2. Configure Environment Variables
The workflow uses `HMAC-SHA256` for security. You must ensure the `N8N_SIGNING_SECRET` environment variable is available to n8n.

### For Docker / Self-Hosted
Add to your `docker-compose.yml` or `.env`:
```bash
export N8N_SIGNING_SECRET="dev-signing-secret"
```
(Matches the value in your Vercel `.env`).

### For n8n Cloud / Testing
If you cannot set server-level env vars easily, you can modify the **Verify Signature** node:
- Open the node.
- Replace `$env.N8N_SIGNING_SECRET` with your actual secret string (e.g., `'dev-signing-secret'`).

## 3. Activate Workflow
1.  Click **Save**.
2.  Toggle **Active** to **On**.
3.  Click **Webhook** node -> Copy the **Production URL**.
    - It should look like: `https://your-n8n.com/webhook/n8ngame/execute`

## 4. Connect Game Client
1.  Go to your Vercel project settings (or local `.env`).
2.  Set `N8N_WEBHOOK_URL` to the URL you copied.
3.  Set `N8N_SIGNING_SECRET` to the same secret used in n8n.
4.  Restart the game/server.
5.  Open "Game" -> Settings (Gear Icon).
6.  Ensure Webhook URL is set (though Proxy handles it, this is for ref).
7.  Select **Remote** mode and Click **Run**.
