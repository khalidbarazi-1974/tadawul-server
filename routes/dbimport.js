const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SECRET = process.env.IMPORT_SECRET || 'tadawul-import-2026';

router.post('/', (req, res) => {
    if (req.body.secret !== SECRET) return res.status(403).json({ error: 'forbidden' });
    const buf = Buffer.from(req.body.data, 'base64');
    res.json({ ok: true, bytes: buf.length });
    setTimeout(() => {
        const db = require('../database/db');
        db.close();
        fs.writeFileSync(path.join(__dirname, '../database/tadawul.db'), buf);
        process.exit(0);
    }, 400);
});

module.exports = router;
