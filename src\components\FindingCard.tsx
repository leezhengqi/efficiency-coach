import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { api } from '../api';

interface Step {
  label: string;
  content: string;
}

function parseSteps(solution: string): Step[] {
  if (!solution.trim()) return [];
  const stepPattern = /第[一二三四五六七八九十\d]+步[：:]?/;
  const rawParts = solution.split(/(?=第[一二三四五六七八九十\d]+步)/);
  const steps: Step[] = [];
  for (const part of rawParts) {
    const m = part.match(stepPattern);
    if (m) {
      const label = m[0].replace(/[：:]/g, '');
      const content = part.slice(m[0].length).replace(/^[\s\n]+/, '');
      if (content) steps.push({ label, content });
    } else if (part.trim()) {
      steps.push({ label: '', content: part.trim() });
    }
  }
  if (steps.length === 0) return [{ label: '', content: solution.trim() }];
  return steps;
}

const STEP_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-700' },
  { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-500', text: 'text-violet-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', text: 'text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-500', text: 'text-rose-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-500', text: 'text-cyan-700' },
];

interface Finding {
  id: number;
  title: string;
  description: string;
  whyItWorks?: string;
  solution: string;
  tools: string[];
  script: string;
  priority: string;
  status: string;
  estimated_time_saved: string;
  conversation_title?: string;
}

interface FindingCardProps {
  finding: Finding;
  onUpdate?: () => void;
}

export default function FindingCard({ finding, onUpdate }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(finding.status);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateFinding(finding.id, { status: newStatus });
      setStatus(newStatus);
      onUpdate?.();
    } catch (e) {
      console.error(e);
    }
  };

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-4 animate-fade-in hover:border-medical-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            finding.priority === 'high' ? 'bg-red-400' :
            finding.priority === 'medium' ? 'bg-amber-400' :
            'bg-gray-300'
          }`} />
          <h3
            className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-medical-600 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {finding.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge type="priority" value={finding.priority} />
          <StatusBadge type="status" value={status} />
        </div>
      </div>

      {finding.conversation_title && (
        <p className="text-xs text-gray-400 mt-1.5 ml-4">来源：{finding.conversation_title}</p>
      )}

      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{finding.description}</p>

      {finding.estimated_time_saved && (
        <p className="text-xs text-medical-600 mt-1.5">预估节省：{finding.estimated_time_saved}</p>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-medical-500 hover:text-medical-600 mt-2 transition-colors"
      >
        {expanded ? '收起详情' : '查看方案'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-100 space-y-3">
          {finding.solution && (() => {
            const steps = parseSteps(finding.solution);
            return (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">解决方案</h4>
                <div className="space-y-2">
                  {steps.map((step, i) => {
                    const color = STEP_COLORS[i] || STEP_COLORS[STEP_COLORS.length - 1];
                    const hasLabel = step.label && /第[一二三四五六七八九十\d]+步/.test(step.label);
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border ${color.border} ${color.bg} p-3`}
                      >
                        {hasLabel && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${color.badge} text-white text-[10px] font-bold`}>
                              {i + 1}
                            </span>
                            <span className={`text-xs font-semibold ${color.text}`}>{step.label}</span>
                          </div>
                        )}
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${hasLabel ? 'ml-7' : ''} ${color.text}`}>
                          {step.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {finding.whyItWorks && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">为什么有效</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{finding.whyItWorks}</p>
            </div>
          )}

          {finding.tools && finding.tools.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">推荐工具</h4>
              <div className="flex flex-wrap gap-1.5">
                {finding.tools.map((tool, i) => (
                  <span key={i} className="text-xs bg-medical-50 text-medical-700 px-2 py-0.5 rounded-full border border-medical-100">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {finding.script && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">示例脚本</h4>
              <pre className="bg-surface-50 border border-surface-200 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
                {finding.script}
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1.5">更新状态</h4>
            <div className="flex gap-1.5">
              {['pending', 'in_progress', 'done', 'archived'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    status === s
                      ? 'bg-medical-500 text-white border-medical-500'
                      : 'bg-white text-gray-500 border-surface-200 hover:border-medical-300 hover:text-medical-600'
                  }`}
                >
                  {s === 'pending' ? '待实施' : s === 'in_progress' ? '进行中' : s === 'done' ? '已完成' : '归档'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
