
export type I18nKey =
    // Top-left controls
    | "ui.theme.dark"
    | "ui.theme.light"
    | "ui.lang.en"
    | "ui.lang.ko"
    | "ui.controls.aria.theme"
    | "ui.controls.aria.language"

    // Common buttons
    | "btn.run"
    | "btn.runViaN8n"
    | "btn.save"
    | "btn.load"
    | "btn.inventory"
    | "btn.missions"
    | "btn.help"
    | "btn.close"
    | "btn.reset"     // Added
    | "btn.settings"  // Added

    // Panels / titles
    | "title.inventory"
    | "title.missions"
    | "title.terminal"
    | "title.help"

    // Mission status
    | "mission.status.locked"
    | "mission.status.active"
    | "mission.status.completed"

    // Terminal prefixes
    | "terminal.reward"
    | "terminal.mission"
    | "terminal.error"
    | "terminal.info"

    // Help content (MVP)
    | "help.heading.what"
    | "help.body.what"
    | "help.heading.quickstart"
    | "help.qs.1"
    | "help.qs.2"
    | "help.qs.3"
    | "help.qs.4"
    | "help.heading.buttons"
    | "help.buttons.run"
    | "help.buttons.runViaN8n"
    | "help.buttons.saveLoad"
    | "help.buttons.inventory"
    | "help.buttons.missions"
    | "help.heading.rewards"
    | "help.body.rewards"
    | "help.heading.troubleshooting"
    | "help.trouble.1"
    | "help.trouble.2"
    | "help.trouble.3"
    | "help.heading.glossary"
    | "help.glossary.blueprint"
    | "help.glossary.node"
    | "help.glossary.edge"
    | "help.glossary.webhook"
    | "help.glossary.gasToken"

    // Status (Added to prevent UI breakage)
    | "ui.status.ready"
    | "ui.status.running"
    | "ui.status.completed"
    | "ui.status.empty"
    | "ui.status.loading";
