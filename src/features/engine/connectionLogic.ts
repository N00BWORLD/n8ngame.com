export type ConnectionType = 'source' | 'target';

export interface PendingConnection {
    nodeId: string;
    handleId: string | null;
    type: ConnectionType;
}

export interface ConnectionAction {
    nodeId: string;
    handleId: string | null;
    type: ConnectionType;
}

export type ConnectionResult =
    | { status: 'pending'; payload: PendingConnection }
    | { status: 'cancelled' }
    | { status: 'completed'; payload: { source: { nodeId: string; handleId: string | null }; target: { nodeId: string; handleId: string | null } } };

/**
 * Pure function to derive the next state of a connection attempt.
 * Easy to unit test without React/Zustand.
 */
export function deriveConnectionState(
    current: PendingConnection | null,
    action: ConnectionAction
): ConnectionResult {
    // 1. Start Connection
    if (!current) {
        return { status: 'pending', payload: action };
    }

    // 2. Cancel (Click same node)
    // Note: handleId check omitted for node-level strictness, but if same node, usually cancel for self-loop prevention
    // strictly, if same node, we cancel.
    if (current.nodeId === action.nodeId) {
        return { status: 'cancelled' };
    }

    // 3. Complete Connection
    // Check direction: Source -> Target or Target -> Source
    if (current.type === action.type) {
        // Source-Source or Target-Target: Switch to new Selection
        return { status: 'pending', payload: action };
    }

    // Determine Source and Target
    const source = current.type === 'source' ? current : action;
    const target = current.type === 'source' ? action : current;

    return {
        status: 'completed',
        payload: {
            source: { nodeId: source.nodeId, handleId: source.handleId },
            target: { nodeId: target.nodeId, handleId: target.handleId }
        }
    };
}
