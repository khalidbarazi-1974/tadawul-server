const express = require('express');
const db = require('../database/db');
const { broadcast } = require('../sse');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// Broadcast to all SSE clients after any successful mutation
router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        res.on('finish', () => { if (res.statusCode < 400) broadcast(); });
    }
    next();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function taskWithGuidances(task) {
    const guidances = db.prepare(
        'SELECT * FROM guidances WHERE task_id = ? ORDER BY timestamp ASC'
    ).all(task.id).map(g => ({ ...g, approved: !!g.approved }));

    const changes = db.prepare(
        "SELECT * FROM task_changes WHERE task_id = ? AND status = 'pending' ORDER BY requested_at ASC"
    ).all(task.id);

    return {
        ...task,
        isTransferred:      !!task.assigned_to,
        isNewForEmployee:   !!task.is_new_for_employee,
        isNewForManager:    !!task.is_new_for_manager,
        startDate:          task.start_date,
        dueDate:            task.due_date,
        suggestedDueDate:   task.suggested_due_date,
        assignedTo:         task.assigned_to,
        assignedDate:       task.assigned_date,
        createdBy:          task.created_by,
        createdByRole:      task.created_by_role,
        createdAt:          task.created_at,
        progress:           task.progress ?? 0,
        continuous:         !!task.continuous,
        guidances,
        pendingChanges:     changes
    };
}

// ── Employee: get my tasks ────────────────────────────────────────────────────

router.get('/my', (req, res) => {
    const tasks = db.prepare(`
        SELECT * FROM tasks
        WHERE dept_id = ? AND approved = 1
        ORDER BY created_at DESC
    `).all(req.user.deptId);
    res.json(tasks.map(taskWithGuidances));
});

// ── Manager: get department tasks ─────────────────────────────────────────────

router.get('/dept/:deptId', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const tasks = db.prepare(
        'SELECT * FROM tasks WHERE dept_id = ? ORDER BY created_at DESC'
    ).all(req.params.deptId);
    res.json(tasks.map(taskWithGuidances));
});

// ── Deputy: get ALL tasks ─────────────────────────────────────────────────────

router.get('/all', requireRole('deputy', 'admin'), (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE approved = 1 ORDER BY dept_id, created_at DESC').all();
    res.json(tasks.map(taskWithGuidances));
});

// ── Create task ───────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
    const { name, description, priority, status, startDate, dueDate, deptId, assignedTo, meetingRef, progress, continuous } = req.body;

    const duplicate = db.prepare('SELECT id FROM tasks WHERE name = ? AND dept_id = ? AND description = ?').get(name?.trim(), deptId, description || '');
    if (duplicate) return res.status(409).json({ error: `يوجد موضوع مطابق تماماً في نفس الإدارة بالفعل` });

    const id = 't_' + uid();
    const now = new Date().toISOString();

    const isEmployee = req.user.role === 'employee';
    db.prepare(`
        INSERT INTO tasks
            (id, name, description, priority, status, start_date, due_date, dept_id,
             created_by, created_by_role, assigned_to, assigned_date,
             is_new_for_employee, is_new_for_manager, approved, created_at, meeting_ref,
             progress, continuous)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id, name, description || '', priority || 'متوسطة', status || 'جديد',
        startDate || '', dueDate || '', deptId,
        req.user.name, req.user.role,
        assignedTo || null,
        assignedTo ? now : null,
        assignedTo ? 1 : 0,
        isEmployee ? 1 : 0,
        isEmployee ? 0 : 1,
        now,
        meetingRef || null,
        progress ?? 0,
        continuous ? 1 : 0
    );

    res.json({ success: true, id });
});

// ── Manager: direct update (no approval needed) ───────────────────────────────

router.put('/:id', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { name, description, priority, startDate, dueDate, suggestedDueDate, assignedTo, meetingRef, continuous } = req.body;
    let { status, progress } = req.body;
    progress = parseInt(progress) || 0;
    if (status === 'مكتمل') progress = 100;
    else if (progress === 100) status = 'مكتمل';
    db.prepare(`
        UPDATE tasks SET name=?, description=?, priority=?, status=?,
            start_date=?, due_date=?, suggested_due_date=?, assigned_to=?,
            meeting_ref=?, progress=?, continuous=?, is_new_for_manager=0
        WHERE id=?
    `).run(name, description, priority, status, startDate, dueDate, suggestedDueDate, assignedTo,
           meetingRef ?? null, progress, continuous ? 1 : 0, req.params.id);
    res.json({ success: true });
});

// ── Employee: request a change (goes to pending) ──────────────────────────────

router.post('/:id/request-change', requireRole('employee'), (req, res) => {
    const { field, newValue } = req.body;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'الموضوع غير موجود' });

    const fieldMap = { status: 'status', description: 'description', priority: 'priority', progress: 'progress', suggestedDueDate: 'suggested_due_date' };
    const dbField = fieldMap[field];
    if (!dbField) return res.status(400).json({ error: 'حقل غير صالح' });

    db.prepare(`
        INSERT INTO task_changes (id, task_id, field, old_value, new_value, requested_by, requested_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('c_' + uid(), req.params.id, field, task[dbField], newValue, req.user.name, new Date().toISOString());

    // flag manager
    db.prepare('UPDATE tasks SET is_new_for_manager = 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true });
});

// ── Manager: approve / reject a pending change ────────────────────────────────

router.patch('/changes/:changeId/approve', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const change = db.prepare('SELECT * FROM task_changes WHERE id = ?').get(req.params.changeId);
    if (!change) return res.status(404).json({ error: 'التغيير غير موجود' });

    const now = new Date().toISOString();
    if (change.field === 'delete') {
        db.prepare('UPDATE meeting_actions SET task_id=NULL WHERE task_id=?').run(change.task_id);
        db.prepare('DELETE FROM tasks WHERE id = ?').run(change.task_id);
    } else {
        const fieldMap = { status: 'status', description: 'description', priority: 'priority', progress: 'progress', suggestedDueDate: 'suggested_due_date' };
        const dbField = fieldMap[change.field];
        db.prepare(`UPDATE tasks SET ${dbField} = ? WHERE id = ?`).run(change.new_value, change.task_id);
        // keep status and progress in sync
        if (change.field === 'status' && change.new_value === 'مكتمل')
            db.prepare('UPDATE tasks SET progress = 100 WHERE id = ?').run(change.task_id);
        else if (change.field === 'progress' && parseInt(change.new_value) === 100)
            db.prepare("UPDATE tasks SET status = 'مكتمل' WHERE id = ?").run(change.task_id);
        db.prepare(`UPDATE task_changes SET status='approved', reviewed_by=?, reviewed_at=? WHERE id=?`)
            .run(req.user.name, now, change.id);
    }

    res.json({ success: true });
});

router.patch('/changes/:changeId/reject', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare(`UPDATE task_changes SET status='rejected', reviewed_by=?, reviewed_at=? WHERE id=?`)
        .run(req.user.name, new Date().toISOString(), req.params.changeId);
    res.json({ success: true });
});

// ── Mark task seen ────────────────────────────────────────────────────────────

router.patch('/:id/seen', (req, res) => {
    const { role } = req.user;
    if (role === 'employee') {
        db.prepare('UPDATE tasks SET is_new_for_employee = 0 WHERE id = ?').run(req.params.id);
    } else if (role === 'manager') {
        db.prepare('UPDATE tasks SET is_new_for_manager = 0 WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
});

// ── Assign task to employee (manager only) ────────────────────────────────────

router.patch('/:id/assign', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { assignedTo } = req.body;
    db.prepare(`
        UPDATE tasks SET assigned_to=?, assigned_date=?, is_new_for_employee=1 WHERE id=?
    `).run(assignedTo, new Date().toISOString(), req.params.id);
    res.json({ success: true });
});

// ── Approve / reject new task (manager/deputy) ────────────────────────────────

router.patch('/:id/approve-task', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare('UPDATE tasks SET approved = 1, is_new_for_manager = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

router.patch('/:id/reject-task', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare('UPDATE tasks SET approved = -1, is_new_for_manager = 0, is_new_for_employee = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Employee: request deletion ────────────────────────────────────────────────

router.post('/:id/request-delete', requireRole('employee'), (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'الموضوع غير موجود' });

    const alreadyPending = db.prepare(
        "SELECT id FROM task_changes WHERE task_id = ? AND field = 'delete' AND status = 'pending'"
    ).get(req.params.id);
    if (alreadyPending) return res.status(409).json({ error: 'طلب الحذف مُرسَل بالفعل وبانتظار الاعتماد' });

    db.prepare(`
        INSERT INTO task_changes (id, task_id, field, old_value, new_value, requested_by, requested_at)
        VALUES (?, ?, 'delete', ?, 'delete', ?, ?)
    `).run('c_' + uid(), req.params.id, task.name, req.user.name, new Date().toISOString());

    db.prepare('UPDATE tasks SET is_new_for_manager = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Delete ALL tasks (restricted to U292409) ─────────────────────────────────

router.delete('/all', requireRole('admin'), (req, res) => {
    if (req.user.id.toLowerCase() !== 'u292409') {
        return res.status(403).json({ error: 'لا يمكنك تنفيذ هذا الإجراء' });
    }
    db.prepare('UPDATE meeting_actions SET task_id=NULL').run();
    db.prepare('DELETE FROM guidances').run();
    db.prepare('DELETE FROM task_changes').run();
    db.prepare('DELETE FROM tasks').run();
    res.json({ success: true });
});

// ── Delete task ───────────────────────────────────────────────────────────────

router.delete('/:id', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const id = req.params.id;
    db.prepare('UPDATE meeting_actions SET task_id=NULL WHERE task_id=?').run(id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
});

// ── Add comment ───────────────────────────────────────────────────────────────

router.post('/:id/guidances', (req, res) => {
    const { text } = req.body;
    const autoApproved = req.user.role !== 'employee' ? 1 : 0;

    db.prepare(`
        INSERT INTO guidances (id, task_id, text, added_by, added_by_role, approved, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('g_' + uid(), req.params.id, text, req.user.name, req.user.role, autoApproved, new Date().toISOString());

    if (!autoApproved) {
        db.prepare('UPDATE tasks SET is_new_for_manager = 1 WHERE id = ?').run(req.params.id);
    }

    res.json({ success: true });
});

// ── Approve / reject comment (manager only) ───────────────────────────────────

router.patch('/:taskId/guidances/:guidanceId/approve', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare('UPDATE guidances SET approved = 1 WHERE id = ?').run(req.params.guidanceId);
    res.json({ success: true });
});

router.delete('/:taskId/guidances/:guidanceId', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    db.prepare('DELETE FROM guidances WHERE id = ?').run(req.params.guidanceId);
    res.json({ success: true });
});

// ── Pending approvals summary (manager) ───────────────────────────────────────

// ── CSV / Excel import ────────────────────────────────────────────────────
router.post('/import', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'لا توجد بيانات' });

    const depts = db.prepare('SELECT id, name FROM departments').all();
    const now   = new Date().toISOString();
    const user  = req.user;
    const isManager = user.role === 'manager';

    // normalize Arabic string for matching / key generation
    const norm = s => (s || '').trim().replace(/\s+/g, ' ');

    // map dept name → id
    function resolveDept(name) {
        const n = norm(name);
        const match = depts.find(d => norm(d.name) === n);
        return match ? match.id : null;
    }

    // status mapping
    const statusMap = { 'مكتملة': 'مكتمل', 'لم تبدأ': 'جديد', 'جديد': 'جديد', 'قيد التنفيذ': 'قيد التنفيذ', 'مكتمل': 'مكتمل' };

    // find existing task by content identity (name + dept + description)
    const findTask = db.prepare('SELECT * FROM tasks WHERE dept_id = ? AND name = ? AND description = ?');
    const insertTask = db.prepare(`
        INSERT INTO tasks (id, name, description, priority, status, due_date, dept_id,
                           created_by, created_by_role, assigned_to, approved, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const updateTask = db.prepare(`
        UPDATE tasks SET priority=?, status=?, due_date=?, assigned_to=?
        WHERE id=?
    `);

    let inserted = 0, updated = 0, unchanged = 0, skipped = 0;

    db.transaction(() => {
        for (const row of rows) {
            const deptName = norm(row['الإدارة'] || '');
            const taskName = norm(row['اسم الموضوع'] || '');
            if (!taskName) { skipped++; continue; }

            const deptId = resolveDept(deptName);
            if (deptId === null) { skipped++; continue; }

            // managers can only import into their own dept
            if (isManager && deptId !== user.deptId) { skipped++; continue; }

            const status   = statusMap[norm(row['الحالة'])] || 'جديد';
            const priority = norm(row['الأولوية']) || 'متوسطة';
            const dueDate  = norm(row['تاريخ الاستحقاق']) || null;
            const assignedTo = norm(row['المسؤول']) || null;
            const desc     = norm(row['الوصف']) || '';

            // match by name + dept + description — same-name tasks with different descriptions are distinct
            const existing = findTask.get(deptId, taskName, desc);
            if (!existing) {
                insertTask.run('t_' + uid(), taskName, desc, priority, status, dueDate, deptId,
                               user.id, user.role, assignedTo, now);
                inserted++;
            } else {
                const changed = existing.priority !== priority || existing.status !== status ||
                    existing.due_date !== dueDate || existing.assigned_to !== assignedTo;
                if (changed) {
                    updateTask.run(priority, status, dueDate, assignedTo, existing.id);
                    updated++;
                } else {
                    unchanged++;
                }
            }
        }
    })();

    res.json({ inserted, updated, unchanged, skipped, total: inserted + updated + unchanged });
});

router.get('/pending', requireRole('manager', 'deputy', 'admin'), (req, res) => {
    const isPowerUser = ['deputy', 'admin'].includes(req.user.role);

    const changes = isPowerUser
        ? db.prepare(`SELECT tc.*, t.name as task_name, t.dept_id FROM task_changes tc JOIN tasks t ON t.id = tc.task_id WHERE tc.status = 'pending' ORDER BY tc.requested_at ASC`).all()
        : db.prepare(`SELECT tc.*, t.name as task_name FROM task_changes tc JOIN tasks t ON t.id = tc.task_id WHERE t.dept_id = ? AND tc.status = 'pending' ORDER BY tc.requested_at ASC`).all(req.user.deptId);

    const comments = isPowerUser
        ? db.prepare(`SELECT g.*, t.name as task_name, t.dept_id FROM guidances g JOIN tasks t ON t.id = g.task_id WHERE g.approved = 0 AND g.added_by_role = 'employee' ORDER BY g.timestamp ASC`).all()
        : db.prepare(`SELECT g.*, t.name as task_name FROM guidances g JOIN tasks t ON t.id = g.task_id WHERE t.dept_id = ? AND g.approved = 0 AND g.added_by_role = 'employee' ORDER BY g.timestamp ASC`).all(req.user.deptId);

    const pendingTasks = isPowerUser
        ? db.prepare(`SELECT t.*, d.name as dept_name FROM tasks t JOIN departments d ON d.id = t.dept_id WHERE t.approved = 0 ORDER BY t.created_at ASC`).all()
        : db.prepare(`SELECT * FROM tasks WHERE dept_id = ? AND approved = 0 AND created_by_role = 'employee' ORDER BY created_at ASC`).all(req.user.deptId);

    res.json({ changes, comments, pendingTasks });
});

module.exports = router;
