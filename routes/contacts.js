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
    const { name, prefix, title, org, city, mobile, email, notes, suffix, car_plate, car_make, car_color } = req.body;
    if (!name?.trim() && !title?.trim()) return res.status(400).json({ error: 'الاسم أو المسمى مطلوب' });
    const id = uid();
    db.prepare(`INSERT INTO contacts_external
        (id, name, prefix, title, org, city, mobile, email, notes, suffix, car_plate, car_make, car_color, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name.trim(), prefix||'', title||'', org||'', city||'', mobile||'', email||'', notes||'',
           suffix||'', car_plate||'', car_make||'', car_color||'', req.user.id);
    res.json({ id });
});

router.put('/external/:id', (req, res) => {
    const { name, prefix, title, org, city, mobile, email, notes, suffix, car_plate, car_make, car_color } = req.body;
    if (!name?.trim() && !title?.trim()) return res.status(400).json({ error: 'الاسم أو المسمى مطلوب' });
    const info = db.prepare(`UPDATE contacts_external
        SET name=?,prefix=?,title=?,org=?,city=?,mobile=?,email=?,notes=?,suffix=?,car_plate=?,car_make=?,car_color=? WHERE id=?`)
      .run(name.trim(), prefix||'', title||'', org||'', city||'', mobile||'', email||'', notes||'',
           suffix||'', car_plate||'', car_make||'', car_color||'', req.params.id);
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
    const { name, employee_id, prefix, title, grade, sector, dept, mobile, extension, email, notes, suffix, car_plate, car_make, car_color } = req.body;
    if (!name?.trim() && !title?.trim()) return res.status(400).json({ error: 'الاسم أو المسمى مطلوب' });
    const id = uid();
    db.prepare(`INSERT INTO contacts_internal
        (id, name, employee_id, prefix, title, grade, sector, dept, mobile, extension, email, notes, suffix, car_plate, car_make, car_color, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name.trim(), employee_id||'', prefix||'', title||'', grade||'', sector||'', dept||'', mobile||'', extension||'', email||'', notes||'', suffix||'', car_plate||'', car_make||'', car_color||'', req.user.id);
    res.json({ id });
});

router.put('/internal/:id', (req, res) => {
    const { name, employee_id, prefix, title, grade, sector, dept, mobile, extension, email, notes, suffix, car_plate, car_make, car_color } = req.body;
    if (!name?.trim() && !title?.trim()) return res.status(400).json({ error: 'الاسم أو المسمى مطلوب' });
    const info = db.prepare(`UPDATE contacts_internal
        SET name=?,employee_id=?,prefix=?,title=?,grade=?,sector=?,dept=?,mobile=?,extension=?,email=?,notes=?,suffix=?,car_plate=?,car_make=?,car_color=? WHERE id=?`)
      .run(name.trim(), employee_id||'', prefix||'', title||'', grade||'', sector||'', dept||'', mobile||'', extension||'', email||'', notes||'', suffix||'', car_plate||'', car_make||'', car_color||'', req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'غير موجود' });
    res.json({ ok: true });
});

router.delete('/internal/:id', (req, res) => {
    db.prepare('DELETE FROM contacts_internal WHERE id=?').run(req.params.id);
    res.json({ ok: true });
});

// ── Import External ───────────────────────────────────────────────────────────

router.post('/external/import', (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records) || !records.length) return res.status(400).json({ error: 'لا توجد بيانات' });
    let inserted = 0, skipped = 0;
    const conflicts = [];
    const stmt = db.prepare(`INSERT INTO contacts_external
        (id,name,title,org,city,mobile,email,notes,car_plate,car_make,car_color,suffix,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const FIELDS = { title:'المسمى', org:'الجهة', city:'المدينة',
                     mobile:'الجوال', email:'البريد', car_plate:'رقم اللوحة',
                     car_make:'الماركة', car_color:'اللون', notes:'ملاحظات' };
    db.transaction(() => {
        for (const r of records) {
            const name = (r.name || '').trim();
            const title = (r.title || '').trim();
            if (!name && !title) continue;
            const existing = name
                ? db.prepare('SELECT * FROM contacts_external WHERE lower(trim(name))=lower(?)').get(name)
                : db.prepare("SELECT * FROM contacts_external WHERE name='' AND lower(trim(title))=lower(?)").get(title);
            if (existing) {
                const diffs = Object.keys(FIELDS).filter(f =>
                    (r[f]||'').trim() !== '' && (r[f]||'').trim() !== (existing[f]||'').trim()
                );
                if (diffs.length) conflicts.push({ existing, incoming: r, diffs, labels: FIELDS });
                else skipped++;
            } else {
                stmt.run(uid(), name, title, r.org||'', r.city||'',
                         r.mobile||'', r.email||'', r.notes||'',
                         r.car_plate||'', r.car_make||'', r.car_color||'', r.suffix||'سلمه الله', req.user.id);
                inserted++;
            }
        }
    })();
    res.json({ inserted, skipped, conflicts });
});

router.post('/external/import/resolve', (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'invalid' });
    const stmt = db.prepare(`UPDATE contacts_external
        SET title=?,org=?,city=?,mobile=?,email=?,car_plate=?,car_make=?,car_color=?,notes=? WHERE id=?`);
    db.transaction(() => {
        updates.forEach(u => stmt.run(u.title||'', u.org||'', u.city||'',
            u.mobile||'', u.email||'', u.car_plate||'', u.car_make||'', u.car_color||'', u.notes||'', u.id));
    })();
    res.json({ ok: true, updated: updates.length });
});

// ── Import Internal ───────────────────────────────────────────────────────────

router.post('/internal/import', (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records) || !records.length) return res.status(400).json({ error: 'لا توجد بيانات' });
    let inserted = 0, skipped = 0;
    const conflicts = [];
    const stmt = db.prepare(`INSERT INTO contacts_internal
        (id,name,employee_id,title,sector,dept,mobile,extension,email,notes,suffix,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const FIELDS = { title:'المسمى', sector:'القطاع', dept:'الإدارة',
                     mobile:'الجوال', extension:'الداخلي', email:'البريد', notes:'ملاحظات' };
    db.transaction(() => {
        for (const r of records) {
            const name = (r.name || '').trim();
            const title = (r.title || '').trim();
            const empId = (r.employee_id || '').trim();
            if (!name && !title) continue;
            let existing = empId
                ? db.prepare('SELECT * FROM contacts_internal WHERE employee_id=?').get(empId)
                : null;
            if (!existing && name) existing = db.prepare('SELECT * FROM contacts_internal WHERE lower(trim(name))=lower(?)').get(name);
            if (!existing && !name && title) existing = db.prepare("SELECT * FROM contacts_internal WHERE name='' AND lower(trim(title))=lower(?)").get(title);
            if (existing) {
                const diffs = Object.keys(FIELDS).filter(f =>
                    (r[f]||'').trim() !== '' && (r[f]||'').trim() !== (existing[f]||'').trim()
                );
                if (diffs.length) conflicts.push({ existing, incoming: r, diffs, labels: FIELDS });
                else skipped++;
            } else {
                stmt.run(uid(), name, empId, title, r.sector||'', r.dept||'',
                         r.mobile||'', r.extension||'', r.email||'', r.notes||'', r.suffix||'سلمه الله', req.user.id);
                inserted++;
            }
        }
    })();
    res.json({ inserted, skipped, conflicts });
});

router.post('/internal/import/resolve', (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'invalid' });
    const stmt = db.prepare(`UPDATE contacts_internal
        SET title=?,sector=?,dept=?,mobile=?,extension=?,email=?,notes=? WHERE id=?`);
    db.transaction(() => {
        updates.forEach(u => stmt.run(u.title||'', u.sector||'', u.dept||'',
            u.mobile||'', u.extension||'', u.email||'', u.notes||'', u.id));
    })();
    res.json({ ok: true, updated: updates.length });
});

module.exports = router;
