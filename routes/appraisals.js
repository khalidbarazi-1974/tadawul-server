const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const router = express.Router();
router.use(authenticate);

// ── Cycles ────────────────────────────────────────────────────────────────────

router.get('/cycles', (req, res) => {
    res.json(db.prepare('SELECT * FROM appraisal_cycles ORDER BY year DESC, created_at DESC').all());
});

router.post('/cycles', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { name, year } = req.body;
    const id  = 'ac_' + uid();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO appraisal_cycles (id, name, year, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name, year, 'open', req.user.name, now);
    res.json({ success: true, id });
});

router.patch('/cycles/:id/close', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare("UPDATE appraisal_cycles SET status='closed' WHERE id=?").run(req.params.id);
    res.json({ success: true });
});

router.patch('/cycles/:id/reopen', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare("UPDATE appraisal_cycles SET status='open' WHERE id=?").run(req.params.id);
    res.json({ success: true });
});

router.delete('/cycles/:id', requireRole('deputy', 'admin'), (req, res) => {
    db.prepare('DELETE FROM appraisal_cycles WHERE id=?').run(req.params.id);
    res.json({ success: true });
});

// ── Entries ───────────────────────────────────────────────────────────────────

router.get('/entries', (req, res) => {
    const { cycleId } = req.query;
    const { role, deptId, id: userId } = req.user;

    let rows;
    if (role === 'deputy' || role === 'admin') {
        rows = cycleId
            ? db.prepare('SELECT ae.*, d.name as dept_name FROM appraisal_entries ae LEFT JOIN departments d ON d.id = ae.dept_id WHERE ae.cycle_id = ? ORDER BY ae.dept_id, ae.employee_name').all(cycleId)
            : db.prepare('SELECT ae.*, d.name as dept_name FROM appraisal_entries ae LEFT JOIN departments d ON d.id = ae.dept_id ORDER BY ae.dept_id, ae.employee_name').all();
    } else if (role === 'manager') {
        rows = cycleId
            ? db.prepare('SELECT * FROM appraisal_entries WHERE cycle_id = ? AND dept_id = ? ORDER BY employee_name').all(cycleId, deptId)
            : db.prepare('SELECT * FROM appraisal_entries WHERE dept_id = ? ORDER BY employee_name').all(deptId);
    } else {
        rows = cycleId
            ? db.prepare('SELECT * FROM appraisal_entries WHERE cycle_id = ? AND employee_id = ?').all(cycleId, userId)
            : db.prepare('SELECT * FROM appraisal_entries WHERE employee_id = ?').all(userId);
    }

    res.json(rows.map(r => ({ ...r, objectives: JSON.parse(r.objectives || '[]') })));
});

router.post('/entries', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { cycleId, employeeId, employeeName, deptId, title, grade, objectives } = req.body;
    const existing = db.prepare('SELECT id FROM appraisal_entries WHERE cycle_id = ? AND employee_id = ?').get(cycleId, employeeId);
    if (existing) return res.status(409).json({ error: 'الموظف مضاف بالفعل لهذه الدورة' });

    const id  = 'ae_' + uid();
    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO appraisal_entries (id, cycle_id, employee_id, employee_name, dept_id, title, grade, objectives, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, cycleId, employeeId, employeeName, deptId, title || '', grade || '', JSON.stringify(objectives || []), now);
    res.json({ success: true, id });
});

router.put('/entries/:id', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { title, grade, objectives } = req.body;
    db.prepare('UPDATE appraisal_entries SET title=?, grade=?, objectives=? WHERE id=?')
        .run(title || '', grade || '', JSON.stringify(objectives || []), req.params.id);
    res.json({ success: true });
});

router.delete('/entries/:id', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare('DELETE FROM appraisal_entries WHERE id=?').run(req.params.id);
    res.json({ success: true });
});

// ── Workload counts per employee ──────────────────────────────────────────────

router.get('/workload', (req, res) => {
    const year = req.query.year ? parseInt(req.query.year) : null;

    const empNames = db.prepare('SELECT name FROM employees').all().map(e => e.name);

    function resolveEmpName(raw) {
        if (!raw) return null;
        if (empNames.includes(raw)) return raw;
        const parts = raw.trim().split(/\s+/);
        const first = parts[0], last = parts[parts.length - 1];
        for (const name of empNames) {
            const p = name.split(/\s+/);
            if (p[0] === first && p[p.length - 1] === last) return name;
        }
        return null;
    }

    const taskCounts = {};
    const tasks = year
        ? db.prepare("SELECT assigned_to FROM tasks WHERE approved = 1 AND assigned_to IS NOT NULL AND strftime('%Y', created_at) = ?").all(String(year))
        : db.prepare('SELECT assigned_to FROM tasks WHERE approved = 1 AND assigned_to IS NOT NULL').all();
    tasks.forEach(t => {
        const n = t.assigned_to.trim();
        taskCounts[n] = (taskCounts[n] || 0) + 1;
    });

    const txCounts = {};
    db.prepare('SELECT data FROM transactions').all()
        .forEach(r => {
            const d = JSON.parse(r.data);
            if (year) {
                const raw_date = d['تاريخ الأنشاء'] || d['تاريخ الإنشاء'] || '';
                if (raw_date) {
                    const txYear = new Date(raw_date).getFullYear();
                    if (isNaN(txYear) || txYear !== year) return;
                }
            }
            const raw = (d['اسم الموظف الحالي'] || d['اسم الموظف الحالي للمعامله'] || '').trim();
            if (!raw) return;
            const key = resolveEmpName(raw) || raw;
            txCounts[key] = (txCounts[key] || 0) + 1;
        });

    res.json({ tasks: taskCounts, transactions: txCounts });
});

// ── Settings (target avg + band quotas) ───────────────────────────────────────

router.get('/settings', (req, res) => {
    const row = db.prepare("SELECT value FROM app_settings WHERE key='appraisal'").get();
    res.json(row ? JSON.parse(row.value) : { targetAvg: 3.5, bandTargets: [5, 10, 70, 10, 5] });
});

router.put('/settings', requireRole('deputy', 'admin'), (req, res) => {
    const { targetAvg, bandTargets } = req.body;
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('appraisal', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
        .run(JSON.stringify({ targetAvg, bandTargets }));
    res.json({ success: true });
});

module.exports = router;
