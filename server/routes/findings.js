import { Router } from 'express';
import { listFindings, getFinding, updateFinding, deleteFinding } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { status, priority } = req.query;
    const findings = listFindings({ status, priority })
      .map(f => ({ ...f, tools: JSON.parse(f.tools || '[]') }));
    res.json(findings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const { status, priority } = req.body;
    const changes = {};
    if (status) changes.status = status;
    if (priority) changes.priority = priority;

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }

    const finding = updateFinding(req.params.id, changes);
    if (!finding) {
      return res.status(404).json({ error: '发现不存在' });
    }
    res.json({ ...finding, tools: typeof finding.tools === 'string' ? JSON.parse(finding.tools || '[]') : finding.tools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const ok = deleteFinding(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: '发现不存在' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
