import { describe, it, expect } from 'vitest';
import { analyzeGraph } from '@/features/engine/graph/analyzer';
import { executeBlueprint } from '@/features/engine/execution/loop';
import { deriveConnectionState } from '@/features/engine/connectionLogic';
import { Blueprint } from '@/features/engine/graph/types';

describe('Engine Logic', () => {

    // 1. DAG Sort
    it('should sort nodes in topological order (DAG)', () => {
        const blueprint: Blueprint = {
            nodes: [
                { id: 'C', kind: 'action' },
                { id: 'A', kind: 'trigger' },
                { id: 'B', kind: 'action' },
            ],
            edges: [
                { id: 'e1', source: 'A', target: 'B' },
                { id: 'e2', source: 'B', target: 'C' },
            ],
        };

        const result = analyzeGraph(blueprint);
        expect(result.success).toBe(true);
        // Correct order: A -> B -> C
        expect(result.order).toEqual(['A', 'B', 'C']);
    });

    // 2. Cycle Detection
    it('should detect cycles and return error', () => {
        const blueprint: Blueprint = {
            nodes: [
                { id: 'A', kind: 'trigger' },
                { id: 'B', kind: 'action' },
            ],
            edges: [
                { id: 'e1', source: 'A', target: 'B' },
                { id: 'e2', source: 'B', target: 'A' }, // Loop
            ],
        };

        const result = analyzeGraph(blueprint);
        expect(result.success).toBe(false);
        expect(result.error?.message).toMatch(/Cycle detected/);
    });

    // 3. Gas Limit
    it('should halt execution when gas limit is exceeded', async () => {
        // Strategy: 1 Trigger (0 Gas) -> 11 Actions (10 Gas each) = 110 Gas needed
        // Max Gas = 100
        const nodes = [{ id: 'Start', kind: 'trigger' }];
        const edges = [];
        for (let i = 0; i < 11; i++) {
            nodes.push({ id: `Action${i}`, kind: 'action' });
            if (i === 0) edges.push({ id: `e0`, source: 'Start', target: `Action0` });
            else edges.push({ id: `e${i}`, source: `Action${i - 1}`, target: `Action${i}` });
        }

        // Mock runtimes are needed since we run executeBlueprint. 
        // Our executeBlueprint implementation uses real runtimes. 
        // Real runtimes (trigger/action) are simple enough to run without mocking, 
        // as long as they don't have side effects we can't handle. 
        // Action runtime waits 500ms... that's slow for tests.
        // Ideally we mock the registry or use a mock blueprint. 
        // For now, let's accept the wait or mock the runtime registry if exported.
        // Wait... 11 actions * 500ms = 5.5s. Too slow.
        // Let's rely on 'analyzeGraph' + manual simulation OR just test the 'Variable' node which is sync/fast?
        // Variable node cost is 1. We can use 101 Variable nodes. 
        // Or better: Just assert 'cycle' logic for now or accept the wait?
        // Let's use Variable nodes (Time=0, Gas=1).

        const varNodes = [{ id: 'Start', kind: 'trigger' }];
        const varEdges = [];
        for (let i = 0; i < 101; i++) {
            varNodes.push({ id: `V${i}`, kind: 'variable' });
            if (i === 0) varEdges.push({ id: `v0`, source: 'Start', target: `V0` });
            else varEdges.push({ id: `v${i}`, source: `V${i - 1}`, target: `V${i}` });
        }

        const varBlueprint = { nodes: varNodes as any, edges: varEdges as any };
        const result = await executeBlueprint(varBlueprint, { maxGas: 50 }); // low budget

        expect(result.error).toMatch(/Out of gas/);
        expect(result.logs.length).toBeGreaterThan(0);
    });
});

describe('Tap-to-Connect Logic (Pure)', () => {
    // 5. State Machine
    it('should transition from Idle to Pending', () => {
        const result = deriveConnectionState(null, { nodeId: 'A', handleId: 'h1', type: 'source' });
        expect(result.status).toBe('pending');
        if (result.status === 'pending') {
            expect(result.payload.nodeId).toBe('A');
        }
    });

    it('should transition from Pending to Completed (Valid)', () => {
        const current = { nodeId: 'A', handleId: 'h1', type: 'source' as const };
        const action = { nodeId: 'B', handleId: 'h2', type: 'target' as const };

        const result = deriveConnectionState(current, action);
        expect(result.status).toBe('completed');
        if (result.status === 'completed') {
            expect(result.payload.source.nodeId).toBe('A');
            expect(result.payload.target.nodeId).toBe('B');
        }
    });

    it('should cancel when clicking the same node', () => {
        const current = { nodeId: 'A', handleId: 'h1', type: 'source' as const };
        const action = { nodeId: 'A', handleId: 'h2', type: 'target' as const }; // Same node logic

        const result = deriveConnectionState(current, action);
        expect(result.status).toBe('cancelled');
    });
});
