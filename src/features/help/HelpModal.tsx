
import { useFlowStore } from '@/store/flowStore';
import { useUiStore } from '@/store/uiStore';
import { X, BookOpen } from 'lucide-react';

export function HelpModal() {
    const { isHelpOpen, setHelpOpen } = useFlowStore();
    const { t } = useUiStore();

    if (!isHelpOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg border border-white/10 bg-[#0a0a0f] shadow-2xl glass-panel relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-6 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t('title.help')}</h2>
                            <p className="text-sm text-gray-400">{t('help.heading.what')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setHelpOpen(false)}
                        className="rounded p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        title={t('btn.close')}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="space-y-8">

                        {/* Section 1: What is this? */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {t('help.heading.what')}
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm pl-4">
                                {t('help.body.what')}
                            </p>
                        </div>

                        {/* Section 2: Quick Start */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {t('help.heading.quickstart')}
                            </h3>
                            <ul className="space-y-1 pl-4 list-disc list-inside text-sm text-gray-300">
                                <li>{t('help.qs.1')}</li>
                                <li>{t('help.qs.2')}</li>
                                <li>{t('help.qs.3')}</li>
                                <li>{t('help.qs.4')}</li>
                            </ul>
                        </div>

                        {/* Section 3: Buttons */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {t('help.heading.buttons')}
                            </h3>
                            <ul className="space-y-1 pl-4 text-sm text-gray-300">
                                <li><strong className="text-gray-200">Run:</strong> {t('help.buttons.run').split(': ')[1] || t('help.buttons.run')}</li>
                                <li><strong className="text-gray-200">n8n:</strong> {t('help.buttons.runViaN8n').split(': ')[1] || t('help.buttons.runViaN8n')}</li>
                                <li><strong className="text-gray-200">Save/Load:</strong> {t('help.buttons.saveLoad').split(': ')[1] || t('help.buttons.saveLoad')}</li>
                                <li><strong className="text-gray-200">Inv:</strong> {t('help.buttons.inventory').split(': ')[1] || t('help.buttons.inventory')}</li>
                                <li><strong className="text-gray-200">Mission:</strong> {t('help.buttons.missions').split(': ')[1] || t('help.buttons.missions')}</li>
                            </ul>
                        </div>

                        {/* Section 4: Rewards */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {t('help.heading.rewards')}
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm pl-4">
                                {t('help.body.rewards')}
                            </p>
                        </div>

                        {/* Section 5: Troubleshooting */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {t('help.heading.troubleshooting')}
                            </h3>
                            <ul className="space-y-1 pl-4 text-sm text-gray-300">
                                <li className="flex gap-2"><span className="text-red-400">❌</span> {t('help.trouble.1')}</li>
                                <li className="flex gap-2"><span className="text-red-400">❌</span> {t('help.trouble.2')}</li>
                                <li className="flex gap-2"><span className="text-red-400">❌</span> {t('help.trouble.3')}</li>
                            </ul>
                        </div>

                        {/* Section 6: Glossary */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                {t('help.heading.glossary')}
                            </h3>
                            <ul className="space-y-1 pl-4 text-sm text-gray-300 grid grid-cols-1 gap-1">
                                <li>{t('help.glossary.blueprint')}</li>
                                <li>{t('help.glossary.node')}</li>
                                <li>{t('help.glossary.edge')}</li>
                                <li>{t('help.glossary.webhook')}</li>
                                <li>{t('help.glossary.gasToken')}</li>
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 p-4 bg-black/20 text-center">
                    <button
                        onClick={() => setHelpOpen(false)}
                        className="rounded-full bg-blue-600 px-8 py-2 font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        {t('btn.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
