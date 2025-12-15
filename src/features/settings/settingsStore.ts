import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    webhookUrl: string;
    userSecret: string;
    setWebhookUrl: (url: string) => void;
    setUserSecret: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            webhookUrl: '',
            userSecret: '',
            setWebhookUrl: (url) => set({ webhookUrl: url }),
            setUserSecret: (key) => set({ userSecret: key }),
        }),
        {
            name: 'n8ngame-settings',
        }
    )
);
