import { useState, useEffect } from 'react';
import { api } from '../api';

interface Conversation {
  id: number;
  title: string;
  last_message: string;
  created_at: string;
  updated_at: string;
}

interface HistoryPageProps {
  onSelect?: (id: number) => void;
}

export default function HistoryPage({ onSelect }: HistoryPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除这个对话吗？')) return;
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">加载中…</div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-400">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">💬</span>
          <p className="text-sm text-gray-400">还没有对话记录</p>
          <p className="text-xs text-gray-300 mt-1">去「对话」页面开始你的第一次分析吧</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className="bg-white border border-surface-200 rounded-xl px-4 py-3 hover:border-medical-200 transition-colors cursor-pointer group"
              onClick={() => onSelect?.(conv.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-800 truncate">{conv.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{conv.last_message || '暂无消息'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-300">{formatTime(conv.updated_at)}</span>
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-300 hover:text-red-400 transition-all"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
