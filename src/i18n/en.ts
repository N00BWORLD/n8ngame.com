
import type { I18nKey } from "./keys";

export const en: Record<I18nKey, string> = {
    "ui.theme.dark": "Dark",
    "ui.theme.light": "Light",
    "ui.lang.en": "EN",
    "ui.lang.ko": "KO",
    "ui.controls.aria.theme": "Toggle theme",
    "ui.controls.aria.language": "Select language",

    "btn.run": "Run",
    "btn.runViaN8n": "Run via n8n",
    "btn.save": "Save",
    "btn.load": "Load",
    "btn.inventory": "Inventory",
    "btn.missions": "Missions",
    "btn.help": "Help",
    "btn.close": "Close",
    "btn.reset": "Reset",
    "btn.settings": "Settings",

    "title.inventory": "Inventory",
    "title.missions": "Missions",
    "title.terminal": "Terminal",
    "title.help": "Guide",

    "mission.status.locked": "Locked",
    "mission.status.active": "Active",
    "mission.status.completed": "Completed",

    "terminal.reward": "REWARD",
    "terminal.mission": "MISSION",
    "terminal.error": "ERROR",
    "terminal.info": "INFO",

    "help.heading.what": "What is this game?",
    "help.body.what":
        "n8ngame is a web game that teaches n8n (automation) through play. You connect nodes to build a workflow, run it, and earn rewards based on how well it works.",

    "help.heading.quickstart": "Quick start (1 minute)",
    "help.qs.1": "Add nodes from the left (drag or click).",
    "help.qs.2": "Connect ports to create a data flow.",
    "help.qs.3": "Click “Run via n8n” to execute.",
    "help.qs.4": "Check logs and rewards in the Terminal.",

    "help.heading.buttons": "Buttons",
    "help.buttons.run": "Run: quick test using the in-game simulator.",
    "help.buttons.runViaN8n": "Run via n8n: calls a real n8n webhook workflow and returns results.",
    "help.buttons.saveLoad": "Save/Load: store and restore your current blueprint.",
    "help.buttons.inventory": "Inventory: see items you’ve earned.",
    "help.buttons.missions": "Missions: follow tutorial goals and claim extra rewards.",

    "help.heading.rewards": "Rewards & progression",
    "help.body.rewards":
        "You earn items for successful runs, good connections, and using variables. Your rewards stack over time and can be viewed in Inventory.",

    "help.heading.troubleshooting": "Common mistakes (3)",
    "help.trouble.1": "Nothing happens: make sure at least one edge is connected.",
    "help.trouble.2": "Run failed: read the [ERROR] lines in the Terminal first.",
    "help.trouble.3": "No rewards: rewards require ok=true, and completed missions don’t pay twice.",

    "help.heading.glossary": "Mini glossary",
    "help.glossary.blueprint": "Blueprint: your node graph (the workflow you built).",
    "help.glossary.node": "Node: a functional block (trigger/action/variable).",
    "help.glossary.edge": "Edge: a connection line between nodes.",
    "help.glossary.webhook": "Webhook: a URL that triggers an execution.",
    "help.glossary.gasToken": "Gas/Token: virtual resource cost (prevents infinite execution).",

    "ui.status.ready": "Ready",
    "ui.status.running": "Running...",
    "ui.status.completed": "Done",
    "ui.status.empty": "No items found.",
    "ui.status.loading": "Loading...",
};
