
export const I18N_KEYS = [
    // Common Buttons
    'btn_close',
    'btn_confirm',
    'btn_reset',
    'btn_run',
    'btn_run_n8n',
    'btn_save',
    'btn_load',
    'btn_inventory',
    'btn_missions',
    'btn_help',
    'btn_settings',

    // Status
    'status_running',
    'status_completed',
    'status_ready',

    // Mission Panel
    'mission_title',
    'mission_status_locked',
    'mission_status_active',
    'mission_status_completed',
    'mission_empty_state',

    // Inventory Panel
    'inventory_title',
    'inventory_empty_state',
    'inventory_loading',

    // Help Modal
    'help_title',
    'help_subtitle',

    // Terminal Log Prefixes
    'log_reward',
    'log_mission_completed',
    'log_error',
    'log_acquired'
] as const;

export type I18nKey = typeof I18N_KEYS[number];
