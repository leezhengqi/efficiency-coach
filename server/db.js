import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'store.json');

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function load() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const init = { conversations: [], messages: [], findings: [], nextId: { conversations: 1, messages: 1, findings: 1 } };
    fs.writeFileSync(dbPath, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Conversations
function createConversation(title = '新的对话') {
  const data = load();
  const conv = { id: data.nextId.conversations++, title, created_at: now(), updated_at: now() };
  data.conversations.push(conv);
  save(data);
  return conv;
}

function listConversations() {
  const data = load();
  return data.conversations
    .map(c => {
      const userMsgs = data.messages.filter(m => m.conversation_id === c.id && m.role === 'user');
      const lastMsg = data.messages
        .filter(m => m.conversation_id === c.id)
        .sort((a, b) => b.id - a.id)?.[0];
      // find last user message as preview
      const lastUserMsg = userMsgs[userMsgs.length - 1];
      return { ...c, last_message: lastUserMsg?.content || '无消息', first_user_message: lastUserMsg?.content };
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

function getConversation(id) {
  const data = load();
  return data.conversations.find(c => c.id === Number(id));
}

function updateConversation(id, changes) {
  const data = load();
  const conv = data.conversations.find(c => c.id === Number(id));
  if (conv) {
    Object.assign(conv, changes);
    conv.updated_at = now();
    save(data);
  }
  return conv;
}

function deleteConversation(id) {
  const data = load();
  const idx = data.conversations.findIndex(c => c.id === Number(id));
  if (idx >= 0) {
    data.conversations.splice(idx, 1);
    // cascade delete messages and findings
    data.messages = data.messages.filter(m => m.conversation_id !== Number(id));
    data.findings = data.findings.filter(f => f.conversation_id !== Number(id));
    save(data);
    return true;
  }
  return false;
}

// Messages
function addMessage(conversation_id, role, content) {
  const data = load();
  const msg = { id: data.nextId.messages++, conversation_id: Number(conversation_id), role, content, created_at: now() };
  data.messages.push(msg);
  save(data);
  return msg;
}

function getMessages(conversation_id) {
  const data = load();
  return data.messages
    .filter(m => m.conversation_id === Number(conversation_id))
    .sort((a, b) => a.id - b.id);
}

// Findings
function addFinding(finding) {
  const data = load();
  const f = {
    id: data.nextId.findings++,
    conversation_id: Number(finding.conversation_id),
    title: finding.title,
    description: finding.description || '',
    solution: finding.solution || '',
    tools: typeof finding.tools === 'string' ? finding.tools : JSON.stringify(finding.tools || []),
    script: finding.script || '',
    priority: finding.priority || 'medium',
    status: 'pending',
    estimated_time_saved: finding.estimated_time_saved || '',
    created_at: now(),
    updated_at: now(),
  };
  data.findings.push(f);
  save(data);
  return f;
}

function listFindings(filter = {}) {
  const data = load();
  let findings = data.findings
    .map(f => {
      const conv = data.conversations.find(c => c.id === f.conversation_id);
      return { ...f, conversation_title: conv?.title || '未知对话' };
    })
    .sort((a, b) => b.id - a.id);

  if (filter.status) {
    findings = findings.filter(f => f.status === filter.status);
  }
  if (filter.priority) {
    findings = findings.filter(f => f.priority === filter.priority);
  }
  return findings;
}

function getFinding(id) {
  const data = load();
  return data.findings.find(f => f.id === Number(id));
}

function updateFinding(id, changes) {
  const data = load();
  const f = data.findings.find(f => f.id === Number(id));
  if (f) {
    Object.assign(f, changes);
    f.updated_at = now();
    save(data);
  }
  return f;
}

function deleteFinding(id) {
  const data = load();
  const idx = data.findings.findIndex(f => f.id === Number(id));
  if (idx >= 0) {
    data.findings.splice(idx, 1);
    save(data);
    return true;
  }
  return false;
}

export {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessages,
  addFinding,
  listFindings,
  getFinding,
  updateFinding,
  deleteFinding,
};
