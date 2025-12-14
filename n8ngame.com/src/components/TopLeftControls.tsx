
import { useUiStore } from '@/store/uiStore';
import { Moon, Sun, Languages } from 'lucide-react';

export function TopLeftControls() {
    const { lang, setLang, theme, toggleTheme } = useUiStore();

    return (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 rounded-lg glass-panel p-2">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="flex items-center justify-center p-2 rounded hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-colors"
                title="Toggle Theme"
                aria-label="Toggle Theme"
            >
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <div className="h-4 w-px bg-white/10" />

            {/* Language Selector */}
            <div className="flex items-center gap-1">
                <Languages className="h-4 w-4 text-gray-500 ml-1" />
                <button
                    onClick={() => setLang('en')}
                    className={`px-2 py-1 text-xs font-bold rounded transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    EN
                </button>
                <button
                    onClick={() => setLang('ko')}
                    className={`px-2 py-1 text-xs font-bold rounded transition-colors ${lang === 'ko' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    KO
                </button>
            </div>
        </div>
    );
}
