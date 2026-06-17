import { useState, useRef, useEffect, useCallback } from 'react';
import ChatBubble from '../components/ChatBubble';
import FindingCard from '../components/FindingCard';
import { api } from '../api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface Finding {
  id: number;
  title: string;
  description: string;
  solution: string;
  tools: string[];
  script: string;
  priority: string;
  status: string;
  estimated_time_saved: string;
}

interface ChatPageProps {
  conversationId?: number | null;
  onNewFindings?: () => void;
}

export default function ChatPage({ conversationId, onNewFindings }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<number | null>(conversationId ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation when conversationId prop changes (from History page)
  useEffect(() => {
    if (conversationId) {
      setConvId(conversationId);
      loadConversation(conversationId);
    }
  }, [conversationId]);

  async function loadConversation(id: number) {
    try {
      setLoading(true);
      const data = await api.getConversation(id);
      setMessages(data.messages || []);
      setFindings(data.findings || []);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(scrollToBottom, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    try {
      let cid = convId;
      if (!cid) {
        const conv = await api.createConversation(text);
        cid = conv.id;
        setConvId(cid);
      }

      setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);

      const result = await api.sendMessage(cid, text);

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: result.content }]);

      if (result.type === 'findings' && result.findings?.length > 0) {
        setFindings(result.findings);
        onNewFindings?.();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `抱歉，出错了：${err.message || '请检查 API Key 配置'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConvId(null);
    setMessages([]);
    setFindings([]);
    setInput('');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <span className="text-7xl mb-6">⚡</span>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">描述你的日常工作或生活</h2>
          <p className="text-lg text-gray-400 max-w-md leading-relaxed">
            告诉我你每天花时间干什么，我会分析哪些地方 AI 能帮忙。
            说得越具体，建议越精准。
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {['我在电力行业工作，每天主要…', '我每周都要花半天时间…', '我最近在做一个…'].map(hint => (
              <button
                key={hint}
                onClick={() => setInput(hint)}
                className="text-base text-medical-600 bg-medical-50 hover:bg-medical-100 px-5 py-2.5 rounded-full border border-medical-100 transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">{messages.length} 条消息</span>
            <button
              onClick={handleNewConversation}
              className="text-xs text-medical-500 hover:text-medical-600 transition-colors"
            >
              新对话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {messages.map(msg => (
              <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {loading && <ChatBubble role="assistant" content="" isLoading />}

            {findings.length > 0 && (
              <div className="mt-4 mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  发现 {findings.length} 个提效机会
                </h3>
                <div className="space-y-2">
                  {findings.map((f, i) => (
                    <FindingCard
                      key={i}
                      finding={{ ...f, id: i } as any}
                      onUpdate={() => onNewFindings?.()}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="描述你的工作内容…"
          disabled={loading}
          className="flex-1 bg-white border border-surface-200 rounded-xl px-6 py-4 text-lg outline-none focus:border-medical-300 focus:ring-2 focus:ring-medical-50 transition-all disabled:opacity-50 placeholder-gray-300"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-medical-500 hover:bg-medical-600 disabled:opacity-40 text-white text-lg font-medium px-8 py-4 rounded-xl transition-colors shrink-0"
        >
          发送
        </button>
      </div>
    </div>
  );
}
