import { useState, useEffect } from 'react';
import FindingCard from '../components/FindingCard';
import { api } from '../api';

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
  conversation_title: string;
}

export default function InsightsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'status'>('date');

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const data = await api.getFindings();
      setFindings(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFindings(); }, []);

  const filteredFindings = findings.filter(f => {
    if (filterStatus && f.status !== filterStatus) return false;
    if (filterPriority && f.priority !== filterPriority) return false;
    return true;
  });

  const sortedFindings = [...filteredFindings].sort((a, b) => {
    if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 1) - (order[b.priority] || 1);
    }
    if (sortBy === 'status') {
      const order: Record<string, number> = { pending: 0, in_progress: 1, done: 2, archived: 3 };
      return (order[a.status] || 0) - (order[b.status] || 0);
    }
    return b.id - a.id;
  });

  const stats = {
    total: findings.length,
    pending: findings.filter(f => f.status === 'pending').length,
    inProgress: findings.filter(f => f.status === 'in_progress').length,
    done: findings.filter(f => f.status === 'done').length,
    high: findings.filter(f => f.priority === 'high').length,
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: '全部', value: stats.total },
          { label: '高优先级', value: stats.high },
          { label: '进行中', value: stats.inProgress },
          { label: '已完成', value: stats.done },
        ].map(s => (
          <div key={s.label} className="bg-white border border-surface-200 rounded-xl px-3 py-2.5 text-center">
            <div className="text-lg font-medium text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-xs bg-white border border-surface-200 rounded-lg px-3 py-1.5 outline-none focus:border-medical-300 text-gray-600"
        >
          <option value="">全部状态</option>
          <option value="pending">待实施</option>
          <option value="in_progress">进行中</option>
          <option value="done">已完成</option>
          <option value="archived">已归档</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="text-xs bg-white border border-surface-200 rounded-lg px-3 py-1.5 outline-none focus:border-medical-300 text-gray-600"
        >
          <option value="">全部优先级</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>

        <div className="flex-1" />

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="text-xs bg-white border border-surface-200 rounded-lg px-3 py-1.5 outline-none focus:border-medical-300 text-gray-600"
        >
          <option value="date">按时间</option>
          <option value="priority">按优先级</option>
          <option value="status">按状态</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">加载中…</div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-400">{error}</div>
      ) : findings.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-sm text-gray-400">还没有任何发现</p>
          <p className="text-xs text-gray-300 mt-1">去「对话」页面聊聊你的工作吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFindings.map(finding => (
            <FindingCard key={finding.id} finding={finding} onUpdate={fetchFindings} />
          ))}
        </div>
      )}
    </div>
  );
}
