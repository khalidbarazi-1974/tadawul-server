const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
    res.json(db.prepare('SELECT * FROM departments ORDER BY id').all());
});

module.exports = router;
