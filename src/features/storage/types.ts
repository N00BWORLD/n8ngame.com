import { AppNode } from '@/features/editor/types';
import { Edge, Viewport } from '@xyflow/react';
import { ExecutionConfig } from '@/features/engine/execution/types';

export interface ProjectBlueprint {
    meta: {
        version: string; // e.g. "1.0.0"
        createdAt: number;
        updatedAt: number;
        name: string;
    };
    graph: {
        nodes: AppNode[];
        edges: Edge[];
        viewport: Viewport;
    };
    config: ExecutionConfig;
}

export const CURRENT_BLUEPRINT_VERSION = '1.0.0';

export interface StorageSlot {
    id: number; // 1-20
    name: string;
    updatedAt: number;
    blueprint?: ProjectBlueprint;
}

export const STORAGE_KEY_V1 = 'n8ngame:blueprints:v1';
