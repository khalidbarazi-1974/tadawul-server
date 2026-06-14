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

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextNumber(type) {
    const row = db.prepare(
        "SELECT meeting_number FROM meetings WHERE type=? ORDER BY meeting_number DESC LIMIT 1"
    ).get(type);
    if (!row) return `${type}-001`;
    const n = parseInt(row.meeting_number.split('-')[1] || '0', 10) + 1;
    return `${type}-${String(n).padStart(3, '0')}`;
}

function fullMeeting(id) {
    const m = db.prepare('SELECT * FROM meetings WHERE id=?').get(id);
    if (!m) return null;
    m.attendees = db.prepare('SELECT * FROM meeting_attendees WHERE meeting_id=? ORDER BY rowid').all(id);
    m.agenda    = db.prepare('SELECT * FROM meeting_agenda    WHERE meeting_id=? ORDER BY order_num').all(id);
    m.decisions = db.prepare('SELECT * FROM meeting_decisions WHERE meeting_id=? ORDER BY order_num').all(id);
    m.actions   = db.prepare('SELECT * FROM meeting_actions   WHERE meeting_id=? ORDER BY rowid').all(id);
    return m;
}

const insAttendee = () => db.prepare(
    'INSERT INTO meeting_attendees (id,meeting_id,kind,ref_id,name,title,org) VALUES (?,?,?,?,?,?,?)'
);
const insAgenda   = () => db.prepare(
    'INSERT INTO meeting_agenda    (id,meeting_id,order_num,text) VALUES (?,?,?,?)'
);
const insDecision = () => db.prepare(
    'INSERT INTO meeting_decisions (id,meeting_id,order_num,text) VALUES (?,?,?,?)'
);
const insAction   = () => db.prepare(
    'INSERT INTO meeting_actions   (id,meeting_id,description,owner_name,due_date) VALUES (?,?,?,?,?)'
);

function insertChildren(mid, attendees, agenda, decisions, actions) {
    const ia = insAttendee(), ig = insAgenda(), id2 = insDecision(), io = insAction();
    (attendees||[]).forEach(a =>
        ia.run(uid(), mid, a.kind||'internal_staff', a.ref_id||'', a.name||'', a.title||'', a.org||''));
    (agenda||[]).forEach((text, i) => { if (text?.trim()) ig.run(uid(), mid, i+1, text.trim()); });
    (decisions||[]).forEach((text, i) => { if (text?.trim()) id2.run(uid(), mid, i+1, text.trim()); });
    (actions||[]).forEach(ac => { if (ac.description?.trim()) io.run(uid(), mid, ac.description.trim(), ac.owner_name||'', ac.due_date||''); });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Next meeting number — must be before /:id
router.get('/next-number/:type', (req, res) => {
    res.json({ number: nextNumber(req.params.type.toUpperCase()) });
});

// List with attendee count and creator name
router.get('/', (req, res) => {
    const rows = db.prepare(`
        SELECT m.*, COUNT(a.id) AS attendee_count,
               e.name AS created_by_name
        FROM meetings m
        LEFT JOIN meeting_attendees a ON a.meeting_id = m.id
        LEFT JOIN employees e ON e.id = m.created_by
        GROUP BY m.id
        ORDER BY m.date DESC, m.time DESC
    `).all();
    res.json(rows);
});

// Full detail
router.get('/:id', (req, res) => {
    const m = fullMeeting(req.params.id);
    if (!m) return res.status(404).json({ error: 'غير موجود' });
    res.json(m);
});

// Create
router.post('/', (req, res) => {
    const { type, subject, date, time, location, next_meeting_date,
            attendees, agenda, decisions, actions } = req.body;
    if (!type || !subject?.trim() || !date)
        return res.status(400).json({ error: 'النوع والموضوع والتاريخ مطلوبة' });

    const id = uid();
    const meeting_number = nextNumber(type.toUpperCase());

    db.transaction(() => {
        db.prepare(`INSERT INTO meetings
            (id,meeting_number,type,subject,date,time,location,next_meeting_date,created_by)
            VALUES (?,?,?,?,?,?,?,?,?)`)
          .run(id, meeting_number, type.toUpperCase(), subject.trim(), date,
               time||'', location||'', next_meeting_date||'', req.user.id);
        insertChildren(id, attendees, agenda, decisions, actions);
    })();

    res.json({ id, meeting_number });
});

// Update (replaces all child rows)
router.put('/:id', (req, res) => {
    if (!db.prepare('SELECT id FROM meetings WHERE id=?').get(req.params.id))
        return res.status(404).json({ error: 'غير موجود' });

    const { subject, date, time, location, next_meeting_date,
            attendees, agenda, decisions, actions } = req.body;
    if (!subject?.trim() || !date)
        return res.status(400).json({ error: 'الموضوع والتاريخ مطلوبان' });

    const mid = req.params.id;
    db.transaction(() => {
        db.prepare(`UPDATE meetings SET subject=?,date=?,time=?,location=?,next_meeting_date=? WHERE id=?`)
          .run(subject.trim(), date, time||'', location||'', next_meeting_date||'', mid);
        ['meeting_attendees','meeting_agenda','meeting_decisions','meeting_actions']
            .forEach(t => db.prepare(`DELETE FROM ${t} WHERE meeting_id=?`).run(mid));
        insertChildren(mid, attendees, agenda, decisions, actions);
    })();

    res.json({ ok: true });
});

// Update single action item status
router.patch('/actions/:actionId', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE meeting_actions SET status=? WHERE id=?').run(status||'pending', req.params.actionId);
    res.json({ ok: true });
});

// Create a task from an action item
router.post('/actions/:actionId/create-task', (req, res) => {
    const action = db.prepare('SELECT * FROM meeting_actions WHERE id=?').get(req.params.actionId);
    if (!action) return res.status(404).json({ error: 'غير موجود' });
    if (action.task_id) return res.status(409).json({ error: 'مرتبطة بمهمة بالفعل' });

    const { name, deptId, assignedTo, dueDate, priority } = req.body;
    if (!name?.trim() || !deptId) return res.status(400).json({ error: 'اسم المهمة والإدارة مطلوبان' });

    const taskId = 't_' + uid();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO tasks
        (id,name,description,priority,status,due_date,dept_id,
         created_by,created_by_role,assigned_to,assigned_date,
         is_new_for_employee,is_new_for_manager,approved,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(taskId, name.trim(), action.description, priority||'متوسطة', 'جديد',
           dueDate||'', deptId, req.user.name, req.user.role,
           assignedTo||null, assignedTo ? now : null,
           assignedTo ? 1 : 0, 0, 1, now);

    db.prepare('UPDATE meeting_actions SET task_id=? WHERE id=?').run(taskId, req.params.actionId);
    res.json({ task_id: taskId });
});

// Delete
router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM meetings WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
