import { AppNode } from '@/features/editor/types';
import { Edge } from '@xyflow/react';

export type Preset = {
    id: string;
    name: string;
    description: string;
    pricePremium: number; // 0 = Free
    nodes: AppNode[];
    edges: Edge[];
    viewport?: { x: number; y: number; zoom: number };
};

export const PRESETS: Preset[] = [
    {
        id: 'basic-miner',
        name: 'Basic Miner',
        description: 'A simple setup to start mining.',
        pricePremium: 0,
        nodes: [
            { id: 'start', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Start' } },
            { id: 'mine', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Mine Rock', actionType: 'mine' } },
        ],
        edges: [
            { id: 'e1', source: 'start', target: 'mine' }
        ],
        viewport: { x: 0, y: 0, zoom: 1 }
    },
    {
        id: 'split-miner',
        name: 'Split Miner',
        description: 'Double the output with parallel processing.',
        pricePremium: 20,
        nodes: [
            { id: 'start', type: 'trigger', position: { x: 50, y: 150 }, data: { label: 'Start' } },
            { id: 'split', type: 'action', position: { x: 300, y: 150 }, data: { label: 'Split', actionType: 'split' } },
            { id: 'mine1', type: 'action', position: { x: 550, y: 50 }, data: { label: 'Mine A', actionType: 'mine' } },
            { id: 'mine2', type: 'action', position: { x: 550, y: 250 }, data: { label: 'Mine B', actionType: 'mine' } },
        ],
        edges: [
            { id: 'e1', source: 'start', target: 'split' },
            { id: 'e2', source: 'split', target: 'mine1' },
            { id: 'e3', source: 'split', target: 'mine2' },
        ],
        viewport: { x: 0, y: 50, zoom: 0.8 }
    },
    {
        id: 'boss-hunter',
        name: 'Boss Hunter',
        description: 'Optimized logic to target Boss rocks.',
        pricePremium: 50,
        nodes: [
            { id: 'start', type: 'trigger', position: { x: 50, y: 200 }, data: { label: 'Start' } },
            { id: 'check', type: 'variable', position: { x: 300, y: 200 }, data: { label: 'Is Boss?', varType: 'condition' } },
            { id: 'heavy', type: 'action', position: { x: 550, y: 100 }, data: { label: 'Heavy Hit', actionType: 'damage' } },
            { id: 'quick', type: 'action', position: { x: 550, y: 300 }, data: { label: 'Quick Hit', actionType: 'damage' } },
        ],
        edges: [
            { id: 'e1', source: 'start', target: 'check' },
            { id: 'e2', source: 'check', target: 'heavy', label: 'True' },
            { id: 'e3', source: 'check', target: 'quick', label: 'False' },
        ],
        viewport: { x: 0, y: 100, zoom: 0.8 }
    }
];
