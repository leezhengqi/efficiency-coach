import { useState } from 'react';
import ChatPage from './pages/ChatPage';
import InsightsPage from './pages/InsightsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { clearNickname, getNickname } from './store';

const tabs = [
  { label: '对话', value: 'chat' },
  { label: '洞察', value: 'insights' },
  { label: '历史', value: 'history' },
  { label: '设置', value: 'settings' },
];

export default function App() {
  const [nickname, setNickname] = useState<string>(getNickname() || '');
  const [tab, setTab] = useState('chat');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const handleLogin = (name: string) => {
    setNickname(name);
  };

  const handleLogout = () => {
    if (!confirm('确定要退出吗？你的数据保留在浏览器中，下次用相同昵称登录即可恢复。')) return;
    clearNickname();
    setNickname('');
    setTab('chat');
    setActiveConversationId(null);
  };

  if (!nickname) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen" style={{ fontSize: '18px' }}>
      <header className="px-6 pt-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚡</span>
            <h1 className="text-3xl font-bold text-medical-900 tracking-tight">效率教练</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-medical-600 bg-medical-50 px-3 py-1 rounded-full">
              {nickname}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
        <p className="text-lg text-medical-600 mt-2 ml-9">描述你的工作，发现 AI 能帮你提效的地方</p>
      </header>

      <nav className="px-6 pt-5 flex gap-1 border-b border-surface-200">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-6 py-3 text-lg rounded-t-lg transition-colors relative -mb-[1px] ${
              tab === t.value
                ? 'text-[#1B4160] font-medium bg-white border border-surface-200 border-b-white'
                : 'text-[#5B7A95] hover:text-[#1B4160] border border-transparent'
            }`}
          >
            {t.label}
            {tab === t.value && (
              <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#2B6FA0] rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <main className="px-6 py-4">
        {tab === 'chat' && <ChatPage key={`chat-${activeConversationId}`} conversationId={activeConversationId} onNewFindings={triggerRefresh} />}
        {tab === 'insights' && <InsightsPage key={`insights-${refreshKey}`} />}
        {tab === 'history' && <HistoryPage onSelect={(id) => { setActiveConversationId(id); setTab('chat'); }} />}
        {tab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
