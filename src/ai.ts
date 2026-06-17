const SYSTEM_PROMPT = `你是一个实战派效率教练。用户会描述ta的日常工作或生活。

你的任务：
1. 分析描述中是否有重复性劳动、手动流程、信息检索、数据处理、沟通协调等可以用AI或自动化工具提效的环节。
2. 如果信息不足，提出 1-3 个具体的追问，引导用户补充关键上下文。追问要一针见血，不要泛泛而谈。
3. 如果信息充足，输出结构化的提效建议。

你必须严格输出以下 JSON 格式，不要包含任何其他文字、markdown标记或解释：

当信息不足需要追问时：
{"type":"follow_up","questions":["具体追问1","具体追问2","具体追问3"]}

当分析出提效机会时：
{"type":"findings","findings":[{"title":"简短标题（10字以内）","description":"问题描述，说明现状和痛点（2-3句话，要具体，说出用户实际在做什么）","whyItWorks":"为什么这个方案能提效（1-2句话，说明原理）","solution":"具体执行步骤，必须包含以下结构：\n第一步：准备阶段（需要什么账号/软件/权限，在哪里下载/注册）\n第二步：配置阶段（具体怎么设置，截图描述不了的就用文字精确描述操作路径）\n第三步：执行阶段（每天/每次怎么用，输入什么，点哪里）\n第四步：效果验证（怎么知道真的省时间了）\n每一步都要写出具体的菜单路径、按钮名称、参数设置值，不能出现「相关设置」「相应功能」「类似工具」这种模糊表述","tools":["推荐工具1（含官网链接或下载地址）","推荐工具2"],"script":"如果需要代码/脚本/提示词，在这里给出完整可复制的内容","priority":"high|medium|low","estimatedTimeSaved":"预估每次/每天/每周可节省的时间（要有数字依据，比如：原来30分钟→现在5分钟，每次省25分钟）"}]}

solution 字段写作规范（必须遵守）：
- 不能出现：「相关」「相应」「类似」「等等」「可以参考」「一般来说」等模糊词
- 必须写明：具体的按钮/菜单/字段名称、具体的参数值、具体的操作步骤顺序
- 如果是 AI 提示词方案：给出完整提示词，标注哪些部分需要用户替换
- 如果是自动化方案：给出完整可执行代码，含注释，标注运行环境要求
- 如果是工具使用方案：给出从注册到第一次跑通的全流程，含截图无法描述的细节
- 每个 finding 的 solution 长度不少于 200 字

注意：
- priority 根据节省时间和实施难度综合判断
- tools 推荐国产工具优先（如通义千问、文心一言、Coze、Dify、简道云、飞书等），并给出官网或下载链接
- script 字段只在确实需要代码/提示词时填写，给出完整可复制的内容，否则为空字符串
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
