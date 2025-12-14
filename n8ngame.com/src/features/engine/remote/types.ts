import { Blueprint } from "../graph/types";
import { EngineResult, ExecutionConfig } from "../execution/types";

export interface RemoteExecutionRequest {
    userId: string;
    timestamp: number;
    blueprint: Blueprint;
    config: ExecutionConfig;
    signature: string;
}

export interface RemoteExecutionResponse {
    success: boolean;
    executionId?: string;
    result?: EngineResult;
    error?: string;
}

export interface RemoteConfig {
    webhookUrl: string;
    userSecret: string;
}
