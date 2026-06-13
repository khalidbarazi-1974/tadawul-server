const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/authMiddleware');
const { broadcast } = require('../sse');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const router = express.Router();
router.use(authenticate);

router.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        res.on('finish', () => { if (res.statusCode < 400) broadcast(); });
    }
    next();
});

// ── External contacts ─────────────────────────────────────────────────────────

router.get('/external', (req, res) => {
    res.json(db.prepare('SELECT * FROM contacts_external ORDER BY org, name').all());
});

router.post('/external', (req, res) => {
    const { name, title, org, sector, city, mobile, email, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    const id = uid();
    db.prepare(`INSERT INTO contacts_external
        (id, name, title, org, sector, city, mobile, email, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name.trim(), title||'', org||'', sector||'', city||'', mobile||'', email||'', notes||'', req.user.id);
    res.json({ id });
});

router.put('/external/:id', (req, res) => {
    const { name, title, org, sector, city, mobile, email, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    const info = db.prepare(`UPDATE contacts_external
        SET name=?,title=?,org=?,sector=?,city=?,mobile=?,email=?,notes=? WHERE id=?`)
      .run(name.trim(), title||'', org||'', sector||'', city||'', mobile||'', email||'', notes||'', req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'غير موجود' });
    res.json({ ok: true });
});

router.delete('/external/:id', (req, res) => {
    db.prepare('DELETE FROM contacts_external WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

// ── Internal contacts (SWA colleagues outside the deputyship) ─────────────────

router.get('/internal', (req, res) => {
    res.json(db.prepare('SELECT * FROM contacts_internal ORDER BY sector, name').all());
});

router.post('/internal', (req, res) => {
    const { name, employee_id, title, grade, sector, dept, mobile, extension, email, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    const id = uid();
    db.prepare(`INSERT INTO contacts_internal
        (id, name, employee_id, title, grade, sector, dept, mobile, extension, email, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name.trim(), employee_id||'', title||'', grade||'', sector||'', dept||'', mobile||'', extension||'', email||'', notes||'', req.user.id);
    res.json({ id });
});

router.put('/internal/:id', (req, res) => {
    const { name, employee_id, title, grade, sector, dept, mobile, extension, email, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    const info = db.prepare(`UPDATE contacts_internal
        SET name=?,employee_id=?,title=?,grade=?,sector=?,dept=?,mobile=?,extension=?,email=?,notes=? WHERE id=?`)
      .run(name.trim(), employee_id||'', title||'', grade||'', sector||'', dept||'', mobile||'', extension||'', email||'', notes||'', req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'غير موجود' });
    res.json({ ok: true });
});

router.delete('/internal/:id', (req, res) => {
    db.prepare('DELETE FROM contacts_internal WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
