interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export default function ChatBubble({ role, content, isLoading }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 mb-5 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 ${
        isUser ? 'bg-medical-500 text-white' : 'bg-surface-200 text-medical-700'
      }`}>
        {isUser ? '我' : '⚡'}
      </div>
      <div className={`max-w-[75%] px-5 py-4 rounded-2xl text-base leading-relaxed ${
        isUser
          ? 'bg-medical-500 text-white rounded-tr-md'
          : 'bg-white border border-surface-200 text-gray-800 rounded-tl-md'
      }`}>
        {isLoading ? (
          <div className="flex items-center gap-2 py-1">
            <span className="w-2 h-2 bg-medical-400 rounded-full animate-pulse-dot" />
            <span className="w-2 h-2 bg-medical-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-medical-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  );
}
