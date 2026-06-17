// localStorage-based data store, keyed by nickname

export function getNickname(): string | null {
  return localStorage.getItem('efficiency_coach_nickname');
}

export function setNickname(name: string) {
  localStorage.setItem('efficiency_coach_nickname', name);
}

export function clearNickname() {
  localStorage.removeItem('efficiency_coach_nickname');
}

function userKey(key: string) {
  const nick = getNickname() || 'default';
  return `ecoach_${nick}_${key}`;
}

function jsonGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(userKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function jsonSet(key: string, value: any) {
  localStorage.setItem(userKey(key), JSON.stringify(value));
}

// ---- Conversations ----

export interface StoredMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface StoredFinding {
  id: number;
  conversation_id: number;
  title: string;
  description: string;
  solution: string;
  tools: string;
  script: string;
  priority: string;
  status: string;
  estimated_time_saved: string;
  created_at: string;
}

export interface StoredConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export function getConversations(): StoredConversation[] {
  const convs = jsonGet<Record<number, StoredConversation>>('conversations', {});
  const msgs = jsonGet<Record<number, StoredMessage[]>>('messages', {});
  return Object.values(convs)
    .map(c => {
      const convMsgs = msgs[c.id] || [];
      const last = convMsgs[convMsgs.length - 1];
      return {
        ...c,
        last_message: last?.content?.slice(0, 50) || '暂无消息',
      };
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function createConversation(content: string): StoredConversation {
  const convs = jsonGet<Record<number, StoredConversation>>('conversations', {});
  const now = new Date().toISOString();
  const id = Date.now();
  const conv: StoredConversation = { id, title: '新的对话', created_at: now, updated_at: now };
  convs[id] = conv;
  jsonSet('conversations', convs);

  const msgs = jsonGet<Record<number, StoredMessage[]>>('messages', {});
  msgs[id] = [{ id: id + 1, role: 'user', content, created_at: now }];
  jsonSet('messages', msgs);

  return conv;
}

export function getConversation(id: number) {
  const convs = jsonGet<Record<number, StoredConversation>>('conversations', {});
  const conv = convs[id];
  if (!conv) return null;

  const msgs = jsonGet<Record<number, StoredMessage[]>>('messages', {});
  const findings = getAllFindings().filter(f => f.conversation_id === id);

  return {
    ...conv,
    messages: (msgs[id] || []).map(m => ({ ...m, id: m.id })),
    findings: findings.map(f => ({ ...f, tools: JSON.parse(f.tools || '[]') })),
  };
}

export function addMessage(convId: number, role: 'user' | 'assistant', content: string) {
  const msgs = jsonGet<Record<number, StoredMessage[]>>('messages', {});
  if (!msgs[convId]) msgs[convId] = [];
  msgs[convId].push({
    id: Date.now() + Math.random(),
    role,
    content,
    created_at: new Date().toISOString(),
  });
  jsonSet('messages', msgs);

  // update conversation timestamp
  const convs = jsonGet<Record<number, StoredConversation>>('conversations', {});
  if (convs[convId]) {
    convs[convId].updated_at = new Date().toISOString();
    jsonSet('conversations', convs);
  }
}

export function updateConversation(id: number, data: Partial<StoredConversation>) {
  const convs = jsonGet<Record<number, StoredConversation>>('conversations', {});
  if (convs[id]) {
    convs[id] = { ...convs[id], ...data, updated_at: new Date().toISOString() };
    jsonSet('conversations', convs);
  }
}

export function deleteConversation(id: number) {
  const convs = jsonGet<Record<number, StoredConversation>>('conversations', {});
  delete convs[id];
  jsonSet('conversations', convs);

  const msgs = jsonGet<Record<number, StoredMessage[]>>('messages', {});
  delete msgs[id];
  jsonSet('messages', msgs);

  const findings = jsonGet<Record<number, StoredFinding>>('findings', {});
  for (const k of Object.keys(findings)) {
    if (findings[Number(k)]?.conversation_id === id) delete findings[Number(k)];
  }
  jsonSet('findings', findings);
}

// ---- Findings ----

function getAllFindings(): StoredFinding[] {
  const findings = jsonGet<Record<number, StoredFinding>>('findings', {});
  return Object.values(findings).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getFindings(): StoredFinding[] {
  return getAllFindings().map(f => ({
    ...f,
    estimated_time_saved: f.estimated_time_saved || '',
  }));
}

export function addFinding(data: Omit<StoredFinding, 'id' | 'created_at' | 'status'>) {
  const findings = jsonGet<Record<number, StoredFinding>>('findings', {});
  const id = Date.now() + Math.random();
  findings[id] = {
    ...data,
    id,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  jsonSet('findings', findings);
  return id;
}

export function updateFinding(id: number, data: Partial<StoredFinding>) {
  const findings = jsonGet<Record<number, StoredFinding>>('findings', {});
  if (findings[id]) {
    findings[id] = { ...findings[id], ...data };
    jsonSet('findings', findings);
  }
}

export function deleteFinding(id: number) {
  const findings = jsonGet<Record<number, StoredFinding>>('findings', {});
  delete findings[id];
  jsonSet('findings', findings);
}
