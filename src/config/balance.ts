// Mission 15-A: Hardcore Balance Configuration
// "오토런(10분) / 맥스노드(2) / 가스유닛(15) 밸런스 고정"

export const BALANCE_CONFIG = {
    // Auto Run Interval (10 Minutes)
    BASE_AUTORUN_INTERVAL_MS: 10 * 60 * 1000,

    // Node Limits
    BASE_MAX_NODES: 2,
    NODE_LIMIT_INC: 1, // Conservative increment

    // Gas Limits (Trigger(5) + Action(10) = 15)
    GAS_UNIT: 15,
    BASE_MAX_GAS: 15,
    GAS_INC: 15, // Upgrade adds 1 unit

    // Run Speed (Manual)
    MANUAL_RUN_DELAY_MS: 120,
};
