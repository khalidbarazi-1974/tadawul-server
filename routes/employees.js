const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

router.get('/dept/:deptId', (req, res) => {
    const employees = db.prepare(
        'SELECT id, name, dept_id, role, title, grade, annual_leave_balance FROM employees WHERE dept_id = ? ORDER BY name'
    ).all(req.params.deptId);
    res.json(employees);
});

router.get('/all', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const employees = db.prepare(
        'SELECT id, name, dept_id, role, title, grade, annual_leave_balance FROM employees ORDER BY dept_id, name'
    ).all();
    res.json(employees);
});

router.get('/', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const employees = db.prepare(
        'SELECT id, name, dept_id, role, title, grade, annual_leave_balance FROM employees ORDER BY dept_id, name'
    ).all();
    res.json(employees);
});

router.patch('/:id', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { title, grade, annual_leave_balance } = req.body;
    db.prepare('UPDATE employees SET title=?, grade=?, annual_leave_balance=? WHERE id=?')
        .run(title || '', grade || '', annual_leave_balance ?? 30, req.params.id);
    res.json({ success: true });
});

module.exports = router;
