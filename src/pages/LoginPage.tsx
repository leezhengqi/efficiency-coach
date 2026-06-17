import { useState } from 'react';

interface LoginPageProps {
  onLogin: (nickname: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) {
      setError('请输入你的昵称');
      return;
    }
    if (name.length > 20) {
      setError('昵称最多 20 个字');
      return;
    }
    localStorage.setItem('efficiency_coach_nickname', name);
    onLogin(name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ fontSize: '18px' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">⚡</span>
          <h1 className="text-3xl font-bold text-medical-900 tracking-tight mb-2">效率教练</h1>
          <p className="text-lg text-medical-600">发现 AI 能帮你提效的地方</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-base font-medium text-gray-700 mb-2">
            输入你的昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError(''); }}
            placeholder="例如：张三"
            autoFocus
            maxLength={20}
            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-lg outline-none focus:border-medical-300 focus:ring-2 focus:ring-medical-50 transition-all placeholder-gray-300"
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 py-4 bg-medical-500 hover:bg-medical-600 text-white text-lg font-medium rounded-xl transition-colors"
          >
            开始使用
          </button>
          <p className="text-sm text-gray-400 mt-4 text-center leading-relaxed">
            昵称用于区分你的对话记录。<br />你的同事也可以用不同的昵称登录。
          </p>
        </form>
      </div>
    </div>
  );
}
