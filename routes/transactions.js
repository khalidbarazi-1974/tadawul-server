const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

const ID_FIELD = 'رقم المعاملة';

// POST /api/transactions/upload
// Body: { rows: [ { 'رقم المعاملة': '...', ...cols } ] }
router.post('/upload', (req, res) => {
    const rows = req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'لا توجد بيانات' });
    }

    const now = new Date().toISOString();
    const getStmt    = db.prepare('SELECT data FROM transactions WHERE id = ?');
    const insertStmt = db.prepare('INSERT INTO transactions (id, data, uploaded_at, updated_at) VALUES (?, ?, ?, ?)');
    const updateStmt = db.prepare('UPDATE transactions SET data = ?, updated_at = ? WHERE id = ?');

    let inserted = 0, updated = 0, unchanged = 0, skipped = 0;

    db.transaction(() => {
        for (const row of rows) {
            const id = (row[ID_FIELD] || '').toString().trim();
            if (!id) { skipped++; continue; }

            const newData = JSON.stringify(row);
            const existing = getStmt.get(id);

            if (!existing) {
                insertStmt.run(id, newData, now, now);
                inserted++;
            } else if (existing.data !== newData) {
                updateStmt.run(newData, now, id);
                updated++;
            } else {
                unchanged++;
            }
        }
    })();

    res.json({ inserted, updated, unchanged, skipped, total: inserted + updated + unchanged });
});

// GET /api/transactions — returns all rows merged with annotations
router.get('/', (req, res) => {
    const rows = db.prepare('SELECT id, data, updated_at FROM transactions ORDER BY updated_at DESC').all();
    const annotations = db.prepare('SELECT * FROM transaction_annotations').all();
    const annMap = {};
    annotations.forEach(a => { annMap[a.transaction_id] = a; });

    const result = rows.map(r => {
        const parsed = JSON.parse(r.data);
        parsed.__updated_at = r.updated_at;
        const ann = annMap[r.id];
        if (ann) {
            parsed.__is_late = ann.is_late === 1;
            parsed.__comment = ann.comment;
        }
        return parsed;
    });
    res.json(result);
});

// GET /api/transactions/count
router.get('/count', (req, res) => {
    const { c } = db.prepare('SELECT COUNT(*) as c FROM transactions').get();
    res.json({ count: c });
});

// PUT /api/transactions/:id/annotate
router.put('/:id/annotate', (req, res) => {
    const { is_late, comment } = req.body;
    const tid = req.params.id;
    const now = new Date().toISOString();
    const exists = db.prepare('SELECT 1 FROM transaction_annotations WHERE transaction_id = ?').get(tid);
    if (exists) {
        db.prepare('UPDATE transaction_annotations SET is_late = ?, comment = ?, updated_by = ?, updated_at = ? WHERE transaction_id = ?')
            .run(is_late ? 1 : 0, comment || '', req.user.id, now, tid);
    } else {
        db.prepare('INSERT INTO transaction_annotations (transaction_id, is_late, comment, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)')
            .run(tid, is_late ? 1 : 0, comment || '', req.user.id, now);
    }
    res.json({ ok: true });
});

module.exports = router;
