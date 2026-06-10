const express = require('express');
const cors = require('cors');
const path = require('path');
const { addClient } = require('./sse');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
    }
}));

app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    req.socket.setNoDelay(true);
    res.flushHeaders();
    res.write(': connected\n\n');
    addClient(res);
});

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/tasks',       require('./routes/tasks'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/employees',   require('./routes/employees'));
app.use('/api/leaves',      require('./routes/leaves'));
app.use('/api/appraisals',    require('./routes/appraisals'));
app.use('/api/transactions', require('./routes/transactions'));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✓ Tadawul server running → http://localhost:${PORT}`);
});
