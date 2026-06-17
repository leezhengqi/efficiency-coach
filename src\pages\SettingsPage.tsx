import { useState, useEffect } from 'react';

const STORAGE_KEY = 'efficiency_coach_settings';

export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export function getAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    baseURL: 'https://token.bayesdl.com/api/maas/v1',
    model: 'qwen-plus',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = getAIConfig();
    if (existing) setConfig(existing);
  }, []);

  const handleSave = () => {
    if (!config.apiKey.trim()) return;
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-base font-medium text-gray-800 mb-6">API 设置</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            API Key <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
            placeholder="输入你的 API Key"
            className="w-full bg-white border border-surface-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-medical-300 focus:ring-2 focus:ring-medical-50 transition-all placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Base URL
          </label>
          <input
            type="text"
            value={config.baseURL}
            onChange={e => setConfig(c => ({ ...c, baseURL: e.target.value }))}
            placeholder="https://token.bayesdl.com/api/maas/v1"
            className="w-full bg-white border border-surface-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-medical-300 focus:ring-2 focus:ring-medical-50 transition-all placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            模型名称
          </label>
          <input
            type="text"
            value={config.model}
            onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
            placeholder="qwen-plus"
            className="w-full bg-white border border-surface-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-medical-300 focus:ring-2 focus:ring-medical-50 transition-all placeholder-gray-300"
          />
          <p className="text-xs text-gray-400 mt-1">例如：qwen-plus, deepseek-chat, glm-4</p>
        </div>

        <button
          onClick={handleSave}
          disabled={!config.apiKey.trim()}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
            config.apiKey.trim()
              ? saved
                ? 'bg-green-500 text-white'
                : 'bg-medical-500 hover:bg-medical-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saved ? '已保存' : '保存设置'}
        </button>

        <p className="text-xs text-gray-400 leading-relaxed">
          API Key 仅保存在浏览器本地，直接调用 AI API，不会经过任何中间服务器。
        </p>
      </div>
    </div>
  );
}
