const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { broadcast } = require('../sse');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const router = express.Router();
router.use(authenticate);

// Broadcast after every successful mutation
router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        res.on('finish', () => { if (res.statusCode < 400) broadcast(); });
    }
    next();
});

// ── Get leaves ────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    const { role, deptId, id: userId } = req.user;
    let rows;
    if (role === 'deputy' || role === 'admin') {
        rows = db.prepare('SELECT * FROM leaves ORDER BY created_at DESC').all();
    } else if (role === 'manager') {
        rows = db.prepare('SELECT * FROM leaves WHERE dept_id = ? ORDER BY created_at DESC').all(deptId);
    } else {
        rows = db.prepare('SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC').all(userId);
    }
    res.json(rows);
});

// ── Create leave ──────────────────────────────────────────────────────────────

function isPowerUser(role) { return role === 'deputy' || role === 'admin'; }

function canManageLeave(req, leave) {
    if (isPowerUser(req.user.role)) return true;
    if (req.user.role === 'manager') return leave.dept_id === req.user.deptId;
    return false;
}

router.post('/', (req, res) => {
    const { employeeId, employeeName, deptId, type, startDate, endDate, days, notes, status } = req.body;
    const targetEmpId   = employeeId   || req.user.id;
    const targetEmpName = employeeName || req.user.name;
    const targetDeptId  = deptId       ?? req.user.deptId;
    const targetStatus  = status === 'approved' ? 'approved' : 'planned';

    if (req.user.role === 'manager' && targetDeptId !== req.user.deptId) {
        return res.status(403).json({ error: 'غير مصرح — لا يمكن تقديم إجازة لقسم آخر' });
    }

    const id  = 'l_' + uid();
    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO leaves (id, employee_id, employee_name, dept_id, type, start_date, end_date, days, status, notes, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, targetEmpId, targetEmpName, targetDeptId, type, startDate, endDate, days || 0, targetStatus, notes || '', req.user.name, now);

    if (targetStatus === 'approved' && type === 'اعتيادية') {
        db.prepare('UPDATE employees SET annual_leave_balance = MAX(0, annual_leave_balance - ?) WHERE id = ?')
            .run(days || 0, targetEmpId);
    }
    res.json({ success: true, id });
});

// ── Update leave ──────────────────────────────────────────────────────────────

router.put('/:id', (req, res) => {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'الإجازة غير موجودة' });

    const isOwner = leave.employee_id === req.user.id;
    const canMgr  = canManageLeave(req, leave);
    if (!isOwner && !canMgr) return res.status(403).json({ error: 'غير مصرح' });

    const { type, startDate, endDate, days, notes, status } = req.body;
    const newStatus = status === 'approved' ? 'approved' : 'planned';
    const newDays   = days || 0;

    // Reconcile annual leave balance
    if (leave.type === 'اعتيادية' && leave.status === 'approved') {
        db.prepare('UPDATE employees SET annual_leave_balance = annual_leave_balance + ? WHERE id = ?')
            .run(leave.days, leave.employee_id);
    }
    if (type === 'اعتيادية' && newStatus === 'approved') {
        db.prepare('UPDATE employees SET annual_leave_balance = MAX(0, annual_leave_balance - ?) WHERE id = ?')
            .run(newDays, leave.employee_id);
    }

    db.prepare('UPDATE leaves SET type=?, start_date=?, end_date=?, days=?, status=?, notes=? WHERE id=?')
        .run(type, startDate, endDate, newDays, newStatus, notes || '', req.params.id);
    res.json({ success: true });
});

// ── Delete leave ──────────────────────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'الإجازة غير موجودة' });

    const isOwner = leave.employee_id === req.user.id;
    const canMgr  = canManageLeave(req, leave);
    if (!isOwner && !canMgr) return res.status(403).json({ error: 'غير مصرح' });

    // Restore balance if approved annual leave is deleted
    if (leave.status === 'approved' && leave.type === 'اعتيادية') {
        db.prepare('UPDATE employees SET annual_leave_balance = annual_leave_balance + ? WHERE id = ?')
            .run(leave.days, leave.employee_id);
    }
    db.prepare('DELETE FROM leaves WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Official Holidays ─────────────────────────────────────────────────────────

router.get('/holidays', (req, res) => {
    res.json(db.prepare('SELECT * FROM official_holidays ORDER BY start_date ASC').all());
});

// Recalculate work-days for every approved annual leave that overlaps [fromDate, toDate],
// then adjust employee balances for the difference. Called after any holiday mutation so
// that the current holiday list in the DB already reflects the change.
function syncAffectedLeaves(fromDate, toDate) {
    const affected = db.prepare(`
        SELECT * FROM leaves
        WHERE type = 'اعتيادية' AND status = 'approved'
          AND start_date <= ? AND end_date >= ?
    `).all(toDate, fromDate);

    if (!affected.length) return;

    const hols = db.prepare('SELECT start_date, end_date FROM official_holidays').all();

    function recalcDays(start, end) {
        let count = 0;
        const cur = new Date(start + 'T00:00:00');
        const fin = new Date(end   + 'T00:00:00');
        while (cur <= fin) {
            const ds  = cur.toISOString().slice(0, 10);
            const dow = cur.getDay(); // 5=Fri, 6=Sat
            if (dow !== 5 && dow !== 6 && !hols.some(h => ds >= h.start_date && ds <= h.end_date)) {
                count++;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    }

    const updateLeave   = db.prepare('UPDATE leaves SET days = ? WHERE id = ?');
    const updateBalance = db.prepare('UPDATE employees SET annual_leave_balance = annual_leave_balance + ? WHERE id = ?');

    db.transaction(() => {
        for (const leave of affected) {
            const newDays = recalcDays(leave.start_date, leave.end_date);
            const diff = leave.days - newDays; // positive → holiday added (refund), negative → holiday removed (deduct)
            if (diff === 0) continue;
            updateLeave.run(newDays, leave.id);
            updateBalance.run(diff, leave.employee_id);
        }
    })();
}

router.post('/holidays', requireRole('deputy', 'admin'), (req, res) => {
    const { name, type, startDate, endDate, days } = req.body;
    const id = 'h_' + uid();
    db.prepare('INSERT INTO official_holidays (id, name, type, start_date, end_date, days) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name, type || 'إجازة رسمية', startDate, endDate, days || 0);
    syncAffectedLeaves(startDate, endDate);
    res.json({ success: true, id });
});

router.put('/holidays/:id', requireRole('deputy', 'admin'), (req, res) => {
    const { name, type, startDate, endDate, days } = req.body;
    const old = db.prepare('SELECT start_date, end_date FROM official_holidays WHERE id = ?').get(req.params.id);
    db.prepare('UPDATE official_holidays SET name=?, type=?, start_date=?, end_date=?, days=? WHERE id=?')
        .run(name, type, startDate, endDate, days || 0, req.params.id);
    // Cover the union of old and new date ranges so every affected leave is recalculated
    const rangeStart = old && old.start_date < startDate ? old.start_date : startDate;
    const rangeEnd   = old && old.end_date   > endDate   ? old.end_date   : endDate;
    syncAffectedLeaves(rangeStart, rangeEnd);
    res.json({ success: true });
});

router.delete('/holidays/:id', requireRole('deputy', 'admin'), (req, res) => {
    const hol = db.prepare('SELECT start_date, end_date FROM official_holidays WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM official_holidays WHERE id = ?').run(req.params.id);
    // After deletion the holiday no longer blocks days, so affected leaves gain days back (balance decreases)
    if (hol) syncAffectedLeaves(hol.start_date, hol.end_date);
    res.json({ success: true });
});

module.exports = router;
