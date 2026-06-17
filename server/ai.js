import OpenAI from 'openai';

const DEFAULT_BASE_URL = 'https://token.bayesdl.com/api/maas/v1';
const DEFAULT_MODEL = 'qwen-plus';

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

function createClient(aiConfig) {
  return new OpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL || DEFAULT_BASE_URL,
  });
}

function extractContent(response) {
  // Try standard OpenAI format
  if (response?.choices?.[0]?.message?.content) {
    return response.choices[0].message.content;
  }
  // Try non-standard: response is the content itself (some proxies)
  if (typeof response === 'string') return response;
  // Try response.result or response.data (DashScope etc.)
  if (response?.output?.text) return response.output.text;
  if (response?.result) return response.result;
  if (response?.data) return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  // Try choices without message wrapper
  if (response?.choices?.[0]?.text) return response.choices[0].text;
  // Last resort: stringify the whole thing
  console.error('[AI] Unknown response format:', JSON.stringify(response).slice(0, 500));
  return '';
}

export async function analyzeInput(userMessage, conversationHistory, aiConfig) {
  const client = createClient(aiConfig);
  const model = aiConfig.model || DEFAULT_MODEL;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawContent = extractContent(response);
    if (!rawContent) {
      console.error('[AI] Empty response from model. Full response:', JSON.stringify(response).slice(0, 1000));
      throw new Error('模型返回了空内容，请检查API Key和模型名称是否正确');
    }
    return parseAIResponse(rawContent);
  } catch (err) {
    console.error('[AI] analyzeInput error:', err.message);
    // Try to extract useful info from the error
    let detail = err.message;
    if (err.status || err.statusCode) {
      detail = `[HTTP ${err.status || err.statusCode}] ${detail}`;
    }
    throw new Error(`AI 调用失败：${detail}`);
  }
}

function parseAIResponse(rawContent) {
  console.log('[AI] Raw response:', rawContent.slice(0, 300));
  try {
    let jsonStr = rawContent.trim();
    // 去掉 markdown 代码块包裹
    const mdMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (mdMatch) {
      jsonStr = mdMatch[1].trim();
    }
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }
    const result = JSON.parse(jsonStr);
    return normalizeResult(result);
  } catch (e) {
    console.log('[AI] JSON parse failed, using raw text:', e.message);
    // 解析失败时，直接把模型的原始回复返回给用户
    return {
      type: 'raw_text',
      content: rawContent,
    };
  }
}

function normalizeResult(result) {
  if (result.type === 'follow_up') {
    return {
      type: 'follow_up',
      questions: Array.isArray(result.questions) ? result.questions.slice(0, 3) : [],
    };
  }
  if (result.type === 'findings' && Array.isArray(result.findings)) {
    return {
      type: 'findings',
      findings: result.findings.map(f => ({
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

export async function generateConversationTitle(firstMessage, aiConfig) {
  try {
    const client = createClient(aiConfig);
    const model = aiConfig.model || DEFAULT_MODEL;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '为用户的第一条消息生成一个简短的对话标题（不超过15个字）。只输出标题文本，不要引号、标点或其他内容。' },
        { role: 'user', content: firstMessage },
      ],
      temperature: 0.5,
      max_tokens: 50,
    });
    const title = extractContent(response) || '新的对话';
    return title.slice(0, 30);
  } catch (e) {
    console.error('[AI] generateTitle error:', e.message);
    return '新的对话';
  }
}
