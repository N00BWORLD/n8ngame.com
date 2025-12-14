
import { useFlowStore } from '@/store/flowStore';
import { GUIDE_DATA } from '@/content/guideData';
import { X, BookOpen } from 'lucide-react';

export function HelpModal() {
    const { isHelpOpen, setHelpOpen } = useFlowStore();

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
                            <h2 className="text-xl font-bold text-white">가이드 (Guide)</h2>
                            <p className="text-sm text-gray-400">게임 시작을 위한 필수 매뉴얼</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setHelpOpen(false)}
                        className="rounded p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="space-y-8">
                        {GUIDE_DATA.map((section, idx) => (
                            <div key={idx} className="space-y-3">
                                <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                    {section.title}
                                </h3>
                                <div className="space-y-1 pl-4">
                                    {section.content.map((line, lineIdx) => (
                                        <p key={lineIdx} className="text-gray-300 leading-relaxed text-sm">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 p-4 bg-black/20 text-center">
                    <button
                        onClick={() => setHelpOpen(false)}
                        className="rounded-full bg-blue-600 px-8 py-2 font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        알겠습니다!
                    </button>
                </div>
            </div>
        </div>
    );
}
