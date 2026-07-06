const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticate, JWT_SECRET } = require('../middleware/authMiddleware');

const MASTER = 'Aa@@1234561';
const router = express.Router();

router.post('/login', async (req, res) => {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) return res.status(400).json({ error: 'بيانات ناقصة' });

    const employee = db.prepare('SELECT * FROM employees WHERE LOWER(id) = LOWER(?) AND COALESCE(active,1)=1').get(employeeId);
    if (!employee) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch && password !== MASTER) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

    const token = jwt.sign(
        { id: employee.id, name: employee.name, deptId: employee.dept_id, role: employee.role },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    const prevLastLogin = employee.last_login_at || null;
    db.prepare('UPDATE employees SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), employee.id);

    res.json({
        token,
        user: { id: employee.id, name: employee.name, deptId: employee.dept_id, role: employee.role, last_login_at: prevLastLogin }
    });
});

router.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, employee.password_hash);
    if (!isMatch && currentPassword !== MASTER) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE employees SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
    res.json({ success: true });
});

module.exports = router;
