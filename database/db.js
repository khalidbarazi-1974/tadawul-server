const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'tadawul.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
        id   INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        dept_id       INTEGER NOT NULL,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'employee',
        FOREIGN KEY (dept_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id                   TEXT PRIMARY KEY,
        name                 TEXT NOT NULL,
        description          TEXT,
        priority             TEXT DEFAULT 'متوسطة',
        status               TEXT DEFAULT 'جديد',
        start_date           TEXT,
        due_date             TEXT,
        suggested_due_date   TEXT,
        dept_id              INTEGER NOT NULL,
        created_by           TEXT NOT NULL,
        created_by_role      TEXT NOT NULL,
        assigned_to          TEXT,
        assigned_date        TEXT,
        is_new_for_employee  INTEGER DEFAULT 0,
        is_new_for_manager   INTEGER DEFAULT 0,
        approved             INTEGER DEFAULT 1,
        created_at           TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (dept_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS task_changes (
        id           TEXT PRIMARY KEY,
        task_id      TEXT NOT NULL,
        field        TEXT NOT NULL,
        old_value    TEXT,
        new_value    TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        status       TEXT DEFAULT 'pending',
        reviewed_by  TEXT,
        reviewed_at  TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS guidances (
        id            TEXT PRIMARY KEY,
        task_id       TEXT NOT NULL,
        text          TEXT NOT NULL,
        added_by      TEXT NOT NULL,
        added_by_role TEXT NOT NULL,
        approved      INTEGER DEFAULT 0,
        timestamp     TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leaves (
        id            TEXT PRIMARY KEY,
        employee_id   TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        dept_id       INTEGER NOT NULL,
        type          TEXT NOT NULL,
        start_date    TEXT NOT NULL,
        end_date      TEXT NOT NULL,
        days          INTEGER NOT NULL,
        status        TEXT DEFAULT 'pending',
        notes         TEXT DEFAULT '',
        created_by    TEXT NOT NULL,
        created_at    TEXT NOT NULL,
        reviewed_by   TEXT,
        reviewed_at   TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS official_holidays (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        type       TEXT NOT NULL DEFAULT 'إجازة رسمية',
        start_date TEXT NOT NULL,
        end_date   TEXT NOT NULL,
        days       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appraisal_cycles (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        year       INTEGER NOT NULL,
        status     TEXT DEFAULT 'open',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appraisal_entries (
        id            TEXT PRIMARY KEY,
        cycle_id      TEXT NOT NULL,
        employee_id   TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        dept_id       INTEGER NOT NULL,
        title         TEXT DEFAULT '',
        grade         TEXT DEFAULT '',
        objectives    TEXT NOT NULL DEFAULT '[]',
        created_at    TEXT NOT NULL,
        FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_annotations (
        transaction_id TEXT PRIMARY KEY,
        is_late        INTEGER DEFAULT 0,
        comment        TEXT    DEFAULT '',
        updated_by     TEXT,
        updated_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts_external (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        title      TEXT DEFAULT '',
        org        TEXT DEFAULT '',
        sector     TEXT DEFAULT '',
        city       TEXT DEFAULT '',
        mobile     TEXT DEFAULT '',
        email      TEXT DEFAULT '',
        notes      TEXT DEFAULT '',
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts_internal (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        employee_id TEXT DEFAULT '',
        title       TEXT DEFAULT '',
        grade       TEXT DEFAULT '',
        sector      TEXT DEFAULT '',
        dept        TEXT DEFAULT '',
        mobile      TEXT DEFAULT '',
        extension   TEXT DEFAULT '',
        email       TEXT DEFAULT '',
        notes       TEXT DEFAULT '',
        created_by  TEXT NOT NULL,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meetings (
        id                TEXT PRIMARY KEY,
        meeting_number    TEXT NOT NULL UNIQUE,
        type              TEXT NOT NULL,
        subject           TEXT NOT NULL,
        date              TEXT NOT NULL,
        time              TEXT DEFAULT '',
        location          TEXT DEFAULT '',
        next_meeting_date TEXT DEFAULT '',
        created_by        TEXT NOT NULL,
        created_at        TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meeting_attendees (
        id         TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        kind       TEXT NOT NULL,
        ref_id     TEXT DEFAULT '',
        name       TEXT NOT NULL,
        title      TEXT DEFAULT '',
        org        TEXT DEFAULT '',
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meeting_agenda (
        id         TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        order_num  INTEGER NOT NULL,
        text       TEXT NOT NULL,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meeting_decisions (
        id         TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        order_num  INTEGER NOT NULL,
        text       TEXT NOT NULL,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meeting_actions (
        id          TEXT PRIMARY KEY,
        meeting_id  TEXT NOT NULL,
        description TEXT NOT NULL,
        owner_name  TEXT DEFAULT '',
        due_date    TEXT DEFAULT '',
        status      TEXT DEFAULT 'pending',
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
`);

// Migrations for existing DBs
try { db.exec('ALTER TABLE tasks ADD COLUMN approved INTEGER DEFAULT 1'); } catch(e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN start_date TEXT'); } catch(e) {}
try { db.exec("ALTER TABLE employees ADD COLUMN title TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE employees ADD COLUMN grade TEXT DEFAULT ''"); } catch(e) {}
try { db.exec('ALTER TABLE employees ADD COLUMN annual_leave_balance INTEGER DEFAULT 30'); } catch(e) {}
try { db.exec('ALTER TABLE employees ADD COLUMN last_login_at TEXT'); } catch(e) {}
try { db.exec("ALTER TABLE contacts_external ADD COLUMN car_plate TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE contacts_external ADD COLUMN car_make  TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE contacts_external ADD COLUMN car_color TEXT DEFAULT ''"); } catch(e) {}

// Promote خالد البرازي to admin on existing databases
try { db.prepare("UPDATE employees SET role='admin' WHERE id='U292409' AND role='manager'").run(); } catch(e) {}

// App settings table (for appraisal target/band quotas)
db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
`);
// Default appraisal settings
const settingsCount = db.prepare("SELECT COUNT(*) as c FROM app_settings WHERE key='appraisal'").get();
if (settingsCount.c === 0) {
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('appraisal', ?)")
        .run(JSON.stringify({ targetAvg: 3.5, bandTargets: [5, 10, 70, 10, 5] }));
}

// Seed departments
const deptCount = db.prepare('SELECT COUNT(*) as c FROM departments').get();
if (deptCount.c === 0) {
    const ins = db.prepare('INSERT INTO departments (id, name) VALUES (?, ?)');
    [
        [0, 'الإدارة العامة لتميز الأداء القطاعي'],
        [1, 'الإدارة العامة للتخطيط التكاملي'],
        [2, 'الإدارة العامة للشؤون الاقتصادية'],
        [3, 'الإدارة العامة لحلول العلاقات التجارية'],
        [4, 'مكتب الوكيل']
    ].forEach(([id, name]) => ins.run(id, name));
}

// Seed employees
const empCount = db.prepare('SELECT COUNT(*) as c FROM employees').get();
if (empCount.c === 0) {
    const ins = db.prepare('INSERT INTO employees (id, name, dept_id, password_hash, role) VALUES (?, ?, ?, ?, ?)');
    const employees = [
        // Dept 0 — الإدارة العامة لتميز الأداء القطاعي
        { id: 'U291655', name: 'بدر بن عبدالله الدوسري',              dept: 0, role: 'manager'  },
        { id: 'U291654', name: 'نايف بن عبدالله الحمودي',             dept: 0, role: 'employee' },
        { id: 'U291656', name: 'إبراهيم بن عبدالعزيز آل عبدالعزيز',  dept: 0, role: 'employee' },
        { id: 'U291658', name: 'مشاري بن محمد الشهيل',                dept: 0, role: 'employee' },
        { id: 'U290807', name: 'الوليد بن عبدالعزيز المهنا',          dept: 0, role: 'employee' },
        { id: 'U983429', name: 'فاطمة بنت علي معشي',                  dept: 0, role: 'employee' },
        { id: 'U292187', name: 'سعد بن حسين القحطاني',                dept: 0, role: 'employee' },
        { id: 'U291666', name: 'محمد بن فهد العتيبي',                 dept: 0, role: 'employee' },
        // Dept 1 — الإدارة العامة للتخطيط التكاملي
        { id: 'U291869', name: 'هاني بن ضيف الله الحربي',             dept: 1, role: 'manager'  },
        { id: 'U106754', name: 'عبدالله بن فايز الشهري',              dept: 1, role: 'employee' },
        { id: 'U107450', name: 'تركي بن إبراهيم التركي',              dept: 1, role: 'employee' },
        { id: 'U108812', name: 'أحمد بن أبراهيم الربدي',              dept: 1, role: 'employee' },
        { id: 'U108856', name: 'صالح بن سالم الموسى',                 dept: 1, role: 'employee' },
        { id: 'U983501', name: 'نواف بن صالح المدلج',                 dept: 1, role: 'employee' },
        // Dept 2 — الإدارة العامة للشؤون الاقتصادية
        { id: 'U291664', name: 'مشاري سعود الدلبحي',                  dept: 2, role: 'manager'  },
        { id: 'U983431', name: 'محمد بن عبدالله العليقي',             dept: 2, role: 'employee' },
        { id: 'U983430', name: 'محمد بن ميثم السماعيل',               dept: 2, role: 'employee' },
        { id: 'U291681', name: 'أمجاد بنت سعد آل سليم',              dept: 2, role: 'employee' },
        { id: 'U291629', name: 'العنود بنت غنيم المطيري',             dept: 2, role: 'employee' },
        { id: 'U291663', name: 'رنا بنت سعد القرني',                  dept: 2, role: 'employee' },
        { id: 'U291661', name: 'أمجاد بنت سعد الهزاني',              dept: 2, role: 'employee' },
        { id: 'U291625', name: 'خولة بنت نواف العواجي',               dept: 2, role: 'employee' },
        // Dept 3 — الإدارة العامة لحلول العلاقات التجارية
        { id: 'U291668', name: 'عبدالله بن محمد باناجه',              dept: 3, role: 'manager'  },
        // Dept 4 — مكتب الوكيل
        { id: 'U291590', name: 'عادل بن عبدالكريم الزهراني',          dept: 4, role: 'deputy'   },
        { id: 'U292409', name: 'خالد بن عبدالله البرازي',             dept: 4, role: 'admin'    },
        { id: 'U291640', name: 'عبدالله بن محمد المالكي',             dept: 4, role: 'employee' },
        { id: 'U291587', name: 'البتول بنت عبدالحميد الراشد',         dept: 4, role: 'employee' },
        { id: 'U982361', name: 'امل بنت سعد الدهيم',                  dept: 4, role: 'employee' },
        { id: 'U291244', name: 'مشاعل بنت محمد العثمان',              dept: 4, role: 'employee' },
    ];
    employees.forEach(({ id, name, dept, role }) => {
        ins.run(id, name, dept, bcrypt.hashSync(id, 10), role);
    });
}

module.exports = db;
