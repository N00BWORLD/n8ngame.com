import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { webhookUrl, userSecret, setWebhookUrl, setUserSecret } = useSettingsStore();
    const [localUrl, setLocalUrl] = useState(webhookUrl);
    const [localKey, setLocalKey] = useState(userSecret);

    useEffect(() => {
        if (isOpen) {
            setLocalUrl(webhookUrl);
            setLocalKey(userSecret);
        }
    }, [isOpen, webhookUrl, userSecret]);

    if (!isOpen) return null;

    const handleSave = () => {
        setWebhookUrl(localUrl);
        setUserSecret(localKey);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[480px] rounded-lg border border-purple-500/30 bg-[#0a0a1f] p-6 shadow-2xl glass-panel">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Engine Settings</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">n8n Webhook URL</label>
                        <input
                            type="text"
                            value={localUrl}
                            onChange={(e) => setLocalUrl(e.target.value)}
                            placeholder="https://your-n8n-instance.com/webhook/..."
                            className="w-full rounded bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-purple-500/20"
                        />
                        <p className="text-xs text-gray-500">The endpoint that receives the execution request.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">User Secret Key</label>
                        <input
                            type="password"
                            value={localKey}
                            onChange={(e) => setLocalKey(e.target.value)}
                            placeholder="Shared Secret Key"
                            className="w-full rounded bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-purple-500/20"
                        />
                        <p className="text-xs text-gray-500">Used to sign requests for security.</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
                    >
                        <Save className="h-4 w-4" />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
