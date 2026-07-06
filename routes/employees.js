const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../database/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// ── Read ─────────────────────────────────────────────────────────────────────

router.get('/dept/:deptId', (req, res) => {
    const employees = db.prepare(
        'SELECT id, name, dept_id, role, title, grade, annual_leave_balance, active FROM employees WHERE dept_id = ? AND COALESCE(active,1)=1 ORDER BY name'
    ).all(req.params.deptId);
    res.json(employees);
});

router.get('/all', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const employees = db.prepare(`
        SELECT e.id, e.name, e.dept_id, e.role, e.title, e.grade,
               e.annual_leave_balance, COALESCE(e.active, 1) AS active,
               COALESCE((
                   SELECT SUM(l.days) FROM leaves l
                   WHERE l.employee_id = e.id AND l.status = 'approved'
               ), 0) AS used_leave,
               (
                   SELECT ae.grade FROM appraisal_entries ae
                   WHERE ae.employee_id = e.id
                   ORDER BY ae.created_at DESC LIMIT 1
               ) AS last_appraisal
        FROM employees e
        ORDER BY e.dept_id, e.name
    `).all();
    res.json(employees);
});

router.get('/', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const employees = db.prepare(
        'SELECT id, name, dept_id, role, title, grade, annual_leave_balance, COALESCE(active,1) AS active FROM employees WHERE COALESCE(active,1)=1 ORDER BY dept_id, name'
    ).all();
    res.json(employees);
});

// ── Create ───────────────────────────────────────────────────────────────────

router.post('/', requireRole('deputy', 'admin'), (req, res) => {
    const { id, name, dept_id, role, title, grade, annual_leave_balance } = req.body;
    if (!id || !name || dept_id === undefined || !role)
        return res.status(400).json({ error: 'بيانات ناقصة: الرقم والاسم والإدارة والدور مطلوبة' });
    const exists = db.prepare('SELECT id FROM employees WHERE id=?').get(id);
    if (exists) return res.status(409).json({ error: 'الرقم الوظيفي مستخدم بالفعل' });
    const hash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO employees (id, name, dept_id, role, title, grade, annual_leave_balance, password_hash, active) VALUES (?,?,?,?,?,?,?,?,1)')
        .run(id, name, Number(dept_id), role, title || '', grade || '', annual_leave_balance ?? 30, hash);
    res.json({ success: true });
});

// ── Update ───────────────────────────────────────────────────────────────────

router.patch('/:id/toggle', requireRole('deputy', 'admin'), (req, res) => {
    db.prepare('UPDATE employees SET active = CASE WHEN COALESCE(active,1)=1 THEN 0 ELSE 1 END WHERE id=?')
        .run(req.params.id);
    res.json({ success: true });
});

router.patch('/:id', requireRole('deputy', 'admin'), (req, res) => {
    const { name, dept_id, role, title, grade, annual_leave_balance } = req.body;
    db.prepare('UPDATE employees SET name=?, dept_id=?, role=?, title=?, grade=?, annual_leave_balance=? WHERE id=?')
        .run(name, Number(dept_id), role, title || '', grade || '', annual_leave_balance ?? 30, req.params.id);
    res.json({ success: true });
});

// ── Delete ───────────────────────────────────────────────────────────────────

router.delete('/:id', requireRole('deputy', 'admin'), (req, res) => {
    db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;
