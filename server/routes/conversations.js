import { Router } from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessages,
  addFinding,
  listFindings,
} from '../db.js';
import { analyzeInput, generateConversationTitle } from '../ai.js';

const router = Router();

function getAIConfig(req) {
  if (req.body?.aiConfig?.apiKey) return req.body.aiConfig;
  const key = req.headers['x-ai-api-key'];
  if (!key) return null;
  return {
    apiKey: key,
    baseURL: req.headers['x-ai-base-url'] || 'https://token.bayesdl.com/api/maas/v1',
    model: req.headers['x-ai-model'] || 'qwen-plus',
  };
}

router.post('/', (req, res) => {
  try {
    const { content } = req.body;
    const aiConfig = getAIConfig(req);
    if (!content?.trim()) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    const conv = createConversation('新的对话');
    addMessage(conv.id, 'user', content.trim());

    if (aiConfig?.apiKey) {
      generateConversationTitle(content.trim(), aiConfig).then(title => {
        updateConversation(conv.id, { title });
      }).catch(() => {});
    }

    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    res.json(listConversations());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const conv = getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: '对话不存在' });
    }

    const messages = getMessages(req.params.id);
    const allFindings = listFindings();
    const findings = allFindings
      .filter(f => f.conversation_id === Number(req.params.id))
      .map(f => ({ ...f, tools: JSON.parse(f.tools || '[]') }));

    res.json({ ...conv, messages, findings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    const aiConfig = getAIConfig(req);
    if (!content?.trim()) {
      return res.status(400).json({ error: '内容不能为空' });
    }
    if (!aiConfig?.apiKey) {
      return res.status(400).json({ error: '请先在设置中配置 API Key' });
    }

    const conv = getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: '对话不存在' });
    }

    addMessage(req.params.id, 'user', content.trim());

    const history = getMessages(req.params.id);
    const aiResult = await analyzeInput(content.trim(), history.slice(0, -1), aiConfig);

    let assistantContent = '';
    if (aiResult.type === 'follow_up') {
      assistantContent = aiResult.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    } else if (aiResult.type === 'findings') {
      const count = aiResult.findings.length;
      assistantContent = `找到 ${count} 个提效机会：\n\n${aiResult.findings.map((f, i) =>
        `${i + 1}. **${f.title}**（优先级：${f.priority === 'high' ? '高' : f.priority === 'medium' ? '中' : '低'}）\n   ${f.description}`
      ).join('\n\n')}`;
    } else {
      // raw_text — 直接使用模型原始回复
      assistantContent = aiResult.content;
    }

    addMessage(req.params.id, 'assistant', assistantContent);

    if (aiResult.type === 'findings') {
      for (const f of aiResult.findings) {
        addFinding({
          conversation_id: Number(req.params.id),
          title: f.title,
          description: f.description,
          solution: f.solution,
          tools: f.tools,
          script: f.script,
          priority: f.priority,
          estimated_time_saved: f.estimatedTimeSaved,
        });
      }
    }

    updateConversation(req.params.id, {});

    res.json({
      type: aiResult.type,
      content: assistantContent,
      findings: aiResult.type === 'findings' ? aiResult.findings : [],
      questions: aiResult.type === 'follow_up' ? aiResult.questions : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const ok = deleteConversation(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: '对话不存在' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
