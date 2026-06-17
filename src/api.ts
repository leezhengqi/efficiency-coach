import * as store from './store';
import { getAIConfig } from './pages/SettingsPage';
import { analyzeInput, generateConversationTitle, type Finding } from './ai';

function ensureConfig() {
  const cfg = getAIConfig();
  if (!cfg?.apiKey) throw new Error('请先在设置中配置 API Key');
  return cfg;
}

export const api = {
  async createConversation(content: string) {
    const conv = store.createConversation(content);
    const cfg = getAIConfig();
    if (cfg?.apiKey) {
      generateConversationTitle(content, cfg).then(title => {
        store.updateConversation(conv.id, { title });
      }).catch(() => {});
    }
    return conv;
  },

  async getConversations() {
    return store.getConversations();
  },

  async getConversation(id: number) {
    const data = store.getConversation(id);
    if (!data) throw new Error('对话不存在');
    return data;
  },

  async sendMessage(conversationId: number, content: string) {
    const cfg = ensureConfig();

    store.addMessage(conversationId, 'user', content);

    const conv = store.getConversation(conversationId);
    if (!conv) throw new Error('对话不存在');

    const history = (conv.messages || []).slice(0, -1).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const aiResult = await analyzeInput(content, history, cfg);

    let assistantContent = '';
    if (aiResult.type === 'follow_up') {
      assistantContent = aiResult.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
    } else if (aiResult.type === 'findings') {
      const count = aiResult.findings.length;
      assistantContent = `找到 ${count} 个提效机会：\n\n${aiResult.findings.map((f: any, i: number) =>
        `${i + 1}. **${f.title}**（优先级：${f.priority === 'high' ? '高' : f.priority === 'medium' ? '中' : '低'}）\n   ${f.description}`
      ).join('\n\n')}`;
    } else {
      assistantContent = (aiResult as any).content || '收到，让我想想…';
    }

    store.addMessage(conversationId, 'assistant', assistantContent);

    if (aiResult.type === 'findings') {
      for (const f of aiResult.findings) {
        store.addFinding({
          conversation_id: conversationId,
          title: f.title,
          description: f.description,
          solution: f.solution,
          tools: JSON.stringify(f.tools || []),
          script: f.script || '',
          priority: f.priority,
          estimated_time_saved: f.estimatedTimeSaved || '',
        });
      }
    }

    return {
      type: aiResult.type,
      content: assistantContent,
      findings: aiResult.type === 'findings' ? aiResult.findings : [],
      questions: aiResult.type === 'follow_up' ? aiResult.questions : [],
    };
  },

  async deleteConversation(id: number) {
    store.deleteConversation(id);
  },

  async getFindings(): Promise<Finding[]> {
    return store.getFindings().map(f => ({
      ...f,
      id: f.id,
      tools: typeof f.tools === 'string' ? JSON.parse(f.tools || '[]') : f.tools,
      estimatedTimeSaved: f.estimated_time_saved,
      estimated_time_saved: f.estimated_time_saved,
      status: f.status || 'pending',
      conversation_title: '',
    }));
  },

  async updateFinding(id: number, data: Record<string, unknown>) {
    store.updateFinding(id, data as any);
    return { success: true };
  },

  async deleteFinding(id: number) {
    store.deleteFinding(id);
  },
};

export type { Finding };
