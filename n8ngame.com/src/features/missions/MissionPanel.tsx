
import { useFlowStore } from '@/store/flowStore';
import { X, Trophy, Lock, CheckCircle, Target } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

export function MissionPanel() {
    const { missions, isMissionOpen, setMissionOpen } = useFlowStore();
    const { t } = useUiStore();

    if (!isMissionOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[500px] rounded-lg border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl glass-panel relative">
                <button
                    onClick={() => setMissionOpen(false)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">{t('title.missions')}</h2>
                </div>

                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {missions.length === 0 && (
                        <div className="text-center text-gray-500 py-10">
                            {t('ui.status.empty')}
                        </div>
                    )}

                    {missions.map((m) => {
                        const isLocked = m.status === 'locked';
                        const isCompleted = m.status === 'completed';

                        return (
                            <div
                                key={m.id}
                                className={`relative flex items-center gap-4 rounded-lg border p-4 transition-all
                                    ${isLocked
                                        ? 'border-white/5 bg-white/5 opacity-50 grayscale'
                                        : isCompleted
                                            ? 'border-yellow-500/30 bg-yellow-500/10'
                                            : 'border-white/20 bg-white/10'
                                    }
                                `}
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                                    ${isCompleted ? 'bg-yellow-500 text-black' : 'bg-black/30 text-gray-400'}
                                `}>
                                    {isLocked ? <Lock className="h-5 w-5" /> :
                                        isCompleted ? <CheckCircle className="h-6 w-6" /> :
                                            <Target className="h-6 w-6 text-cyan-400" />}
                                </div>

                                <div className="flex-1">
                                    <h3 className={`font-bold ${isCompleted ? 'text-yellow-400' : 'text-white'}`}>
                                        {m.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">{isLocked ? '???' : m.desc}</p>
                                </div>

                                {m.justCompleted && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black uppercase animate-pulse">
                                        New!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
