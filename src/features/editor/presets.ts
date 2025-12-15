import { AppNode } from './types';
import { Edge } from '@xyflow/react';

export interface Preset {
    id: string;
    name: string;
    description: string;
    locked?: boolean;
    priceGems?: number;
    nodes: AppNode[];
    edges: Edge[];
    viewport?: { x: number; y: number; zoom: number };
}

export const PRESETS: Preset[] = [
    {
        id: 'basic-miner',
        name: 'Basic Miner',
        description: 'The simplest automation. Just a trigger and a mining action.',
        locked: false,
        viewport: { x: 100, y: 100, zoom: 1.2 },
        nodes: [
            { id: 'pm1-1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Start' } },
            { id: 'pm1-2', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Mine Rock' } }
        ],
        edges: [
            { id: 'em1-1', source: 'pm1-1', target: 'pm1-2' }
        ]
    },
    {
        id: 'crit-miner',
        name: 'Crit Miner',
        description: 'Optimized for critical hits (Simulated).',
        locked: false,
        viewport: { x: 100, y: 100, zoom: 1.2 },
        nodes: [
            { id: 'pm2-1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Crit Trigger' } },
            { id: 'pm2-2', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Heavy Strike' } }
        ],
        edges: [
            { id: 'em2-1', source: 'pm2-1', target: 'pm2-2' }
        ]
    },
    {
        id: 'gold-booster',
        name: 'Gold Booster',
        description: 'Increases efficiency using variables.',
        locked: false,
        viewport: { x: 50, y: 50, zoom: 1.0 },
        nodes: [
            { id: 'pm3-1', type: 'variable', position: { x: 100, y: 50 }, data: { label: 'Gold Bonus' } },
            { id: 'pm3-2', type: 'trigger', position: { x: 400, y: 50 }, data: { label: 'Loop' } },
            { id: 'pm3-3', type: 'action', position: { x: 250, y: 250 }, data: { label: 'Boosted Mine' } }
        ],
        edges: [
            { id: 'em3-1', source: 'pm3-1', target: 'pm3-3' },
            { id: 'em3-2', source: 'pm3-2', target: 'pm3-3' }
        ]
    }
];
