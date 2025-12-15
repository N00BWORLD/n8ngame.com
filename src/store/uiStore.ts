
import { create } from 'zustand';
import { en } from '@/i18n/en';
import { ko } from '@/i18n/ko';
import { I18nKey } from '@/i18n/keys';

type Lang = 'en' | 'ko';
type Theme = 'light' | 'dark';

interface UiState {
    lang: Lang;
    theme: Theme;
    setLang: (lang: Lang) => void;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    t: (key: I18nKey) => string;
}

const resources = { en, ko };

// Helper: Detect Language
function detectLang(): Lang {
    const saved = localStorage.getItem('app-lang') as Lang;
    if (saved && (saved === 'en' || saved === 'ko')) return saved;

    const browser = navigator.language.toLowerCase();
    if (browser.startsWith('ko')) return 'ko';
    return 'en';
}

// Helper: Detect Theme
function detectTheme(): Theme {
    const saved = localStorage.getItem('app-theme') as Theme;
    if (saved && (saved === 'light' || saved === 'dark')) return saved;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

export const useUiStore = create<UiState>((set, get) => ({
    lang: 'en', // default, will overwrite in init
    theme: 'dark', // default

    setLang: (lang) => {
        localStorage.setItem('app-lang', lang);
        set({ lang });
    },

    setTheme: (theme) => {
        localStorage.setItem('app-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        set({ theme });
    },

    toggleTheme: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
    },

    t: (key: I18nKey) => {
        const lang = get().lang;
        return resources[lang][key] || key;
    }
}));

// Initialize immediately (side effect for theme)
export function initUiSettings() {
    const lang = detectLang();
    const theme = detectTheme();

    useUiStore.getState().setLang(lang);
    useUiStore.getState().setTheme(theme);
}
