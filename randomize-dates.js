const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database', 'tadawul.db'));

function randomDate() {
    const start = new Date('2026-04-01');
    const end   = new Date('2026-05-06');
    const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(ms).toISOString().slice(0, 10);
}

const tasks = db.prepare('SELECT id FROM tasks').all();
const update = db.prepare('UPDATE tasks SET start_date = ? WHERE id = ?');

const run = db.transaction(() => {
    tasks.forEach(t => update.run(randomDate(), t.id));
});

run();
console.log(`Updated ${tasks.length} tasks with random start dates (2026-04-01 → 2026-05-06).`);
db.close();
