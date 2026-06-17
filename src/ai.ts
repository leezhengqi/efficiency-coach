const SYSTEM_PROMPT = `你是一个效率教练。用户会描述ta的日常工作或生活。

你的任务：
1. 分析描述中是否有重复性劳动、手动流程、信息检索、数据处理、沟通协调等可以用AI或自动化工具提效的环节。
2. 如果信息不足，提出 1-3 个具体的追问，引导用户补充关键上下文。追问要一针见血，不要泛泛而谈。
3. 如果信息充足，输出结构化的提效建议。

你必须严格输出以下 JSON 格式，不要包含任何其他文字、markdown标记或解释：

当信息不足需要追问时：
{"type":"follow_up","questions":["具体追问1","具体追问2","具体追问3"]}

当分析出提效机会时：
{"type":"findings","findings":[{"title":"简短标题（10字以内）","description":"问题描述，说明现状和痛点","solution":"具体解决方案，分步骤","tools":["推荐工具1","推荐工具2"],"script":"如果需要代码/脚本，在这里给出示例","priority":"high|medium|low","estimatedTimeSaved":"预估每次/每天/每周可节省的时间"}]}

注意：
- priority 根据节省时间和实施难度综合判断
- tools 推荐国产工具优先（如通义千问、文心一言、Coze、Dify、简道云、飞书等）
- script 字段只在确实需要代码时填写，否则为空字符串
- 不要在 JSON 外输出任何内容`;

export interface Finding {
  id?: number;
  title: string;
  description: string;
  solution: string;
  tools: string[];
  script: string;
  priority: string;
  status?: string;
  estimatedTimeSaved: string;
  conversation_title?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

async function callAI(messages: { role: string; content: string }[], aiConfig: AIConfig) {
  const { apiKey, baseURL = 'https://token.bayesdl.com/api/maas/v1', model = 'qwen-plus' } = aiConfig;

  const res = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `AI 调用失败 (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseAIResponse(rawContent: string) {
  try {
    let jsonStr = rawContent.trim();
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }
    const result = JSON.parse(jsonStr);
    return normalizeResult(result);
  } catch (e) {
    return {
      type: 'follow_up',
      questions: ['可以再具体说说吗？比如你每天花时间最多的几件事是什么？'],
    };
  }
}

function normalizeResult(result: any) {
  if (result.type === 'follow_up') {
    return {
      type: 'follow_up',
      questions: Array.isArray(result.questions) ? result.questions.slice(0, 3) : [],
    };
  }
  if (result.type === 'findings' && Array.isArray(result.findings)) {
    return {
      type: 'findings',
      findings: result.findings.map((f: any) => ({
        title: f.title || '未命名发现',
        description: f.description || '',
        solution: f.solution || '',
        tools: Array.isArray(f.tools) ? f.tools : [],
        script: f.script || '',
        priority: ['high', 'medium', 'low'].includes(f.priority) ? f.priority : 'medium',
        estimatedTimeSaved: f.estimatedTimeSaved || '',
      })),
    };
  }
  return {
    type: 'follow_up',
    questions: ['让我更具体地了解：你最近一周重复最多的操作是什么？'],
  };
}

export async function analyzeInput(
  userMessage: string,
  conversationHistory: ChatMessage[],
  aiConfig: AIConfig
) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const rawContent = await callAI(messages, aiConfig);
  return parseAIResponse(rawContent);
}

export async function generateConversationTitle(
  firstMessage: string,
  aiConfig: AIConfig
): Promise<string> {
  try {
    const messages = [
      { role: 'system', content: '为用户的第一条消息生成一个简短的对话标题（不超过15个字）。只输出标题文本，不要引号、标点或其他内容。' },
      { role: 'user', content: firstMessage },
    ];
    const title = await callAI(messages, aiConfig);
    return title.trim().slice(0, 30) || '新的对话';
  } catch (e) {
    return '新的对话';
  }
}
