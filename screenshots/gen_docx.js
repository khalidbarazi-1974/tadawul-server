const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
    ImageRun, PageBreak, convertMillimetersToTwip,
} = require('docx');
const fs   = require('fs');
const path = require('path');

const DIR   = __dirname;
const NAVY  = '1A237E';
const WHITE = 'FFFFFF';
const LIGHT = 'E8EAF6';
const GRAY  = '757575';
const BLACK = '1A1A1A';
const GREEN = '1B5E20';
const AMBER = 'E65100';
const RED2  = 'BF360C';

const A4_W = convertMillimetersToTwip(210);
const A4_H = convertMillimetersToTwip(297);
const MAR  = {
    top:    convertMillimetersToTwip(22),
    bottom: convertMillimetersToTwip(18),
    left:   convertMillimetersToTwip(20),
    right:  convertMillimetersToTwip(20),
};

const SF = 'Segoe UI';

// ── Typography ────────────────────────────────────────────────────────────────

function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
        children: [new TextRun({ text, color: NAVY, bold: true, size: 36, font: SF })],
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
        children: [new TextRun({ text, color: NAVY, bold: true, size: 28, font: SF })],
    });
}

function h3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text, color: NAVY, bold: true, size: 24, font: SF })],
    });
}

function h4(text) {
    return new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [new TextRun({ text, color: GRAY, bold: true, size: 22, font: SF })],
    });
}

function p(text) {
    return new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text, size: 22, color: BLACK, font: SF })],
    });
}

function bullet(text) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text, size: 21, color: BLACK, font: SF })],
    });
}

function subbullet(text) {
    return new Paragraph({
        bullet: { level: 1 },
        spacing: { after: 40 },
        children: [new TextRun({ text, size: 20, color: GRAY, font: SF })],
    });
}

function gap(n = 1) {
    return new Paragraph({ text: '', spacing: { after: n * 100 } });
}

function caption(text) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text, size: 18, color: GRAY, italics: true, font: SF })],
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

function note(text) {
    return new Paragraph({
        spacing: { after: 80 },
        children: [
            new TextRun({ text: 'Note: ', bold: true, size: 20, color: GRAY, font: SF }),
            new TextRun({ text, size: 20, color: GRAY, italics: true, font: SF }),
        ],
    });
}

// ── Images ────────────────────────────────────────────────────────────────────

function img(filename, w = 620, h = 399) {
    const p = path.join(DIR, filename);
    if (!fs.existsSync(p)) return gap();
    const buf = fs.readFileSync(p);
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new ImageRun({ data: buf, transformation: { width: w, height: h } })],
    });
}

// ── Info box ──────────────────────────────────────────────────────────────────

function infoBox(text, color = NAVY) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { type: ShadingType.SOLID, color: LIGHT },
                        borders: {
                            left:   { style: BorderStyle.SINGLE, size: 16, color },
                            top:    { style: BorderStyle.NONE },
                            right:  { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                        },
                        margins: { top: 120, bottom: 120, left: 160, right: 160 },
                        children: [
                            new Paragraph({
                                spacing: { after: 0 },
                                children: [new TextRun({ text, size: 21, color: BLACK, font: SF })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

// ── Tables ────────────────────────────────────────────────────────────────────

function headerRow(cols, bg = NAVY) {
    return new TableRow({
        tableHeader: true,
        children: cols.map(text =>
            new TableCell({
                shading: { type: ShadingType.SOLID, color: bg },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text, bold: true, color: WHITE, size: 20, font: SF })] })],
            })
        ),
    });
}

function dataRow(cols, shaded) {
    return new TableRow({
        children: cols.map(text =>
            new TableCell({
                shading: shaded ? { type: ShadingType.SOLID, color: 'F5F7FF' } : undefined,
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: String(text), size: 20, font: SF })] })],
            })
        ),
    });
}

function dataTable(headers, rows, headerBg = NAVY) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow(headers, headerBg), ...rows.map((r, i) => dataRow(r, i % 2 === 1))],
    });
}

// ── Cover ─────────────────────────────────────────────────────────────────────

function coverBlock() {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { type: ShadingType.SOLID, color: NAVY },
                        margins: { top: 600, bottom: 600, left: 600, right: 600 },
                        children: [
                            new Paragraph({ spacing: { after: 80  }, children: [new TextRun({ text: 'SAUDI WATER AUTHORITY — INTERNAL PLATFORM DOCUMENTATION', size: 16, color: 'AAAACC', font: SF })] }),
                            new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Tadawul Platform', size: 64, bold: true, color: WHITE, font: SF })] }),
                            new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: 'Technical & UX Reference — System Documentation', size: 28, color: 'C5CAE9', font: SF })] }),
                            new Paragraph({ spacing: { after: 80  }, children: [new TextRun({ text: 'Version 1.1   |   May 2026   |   Audience: Development Team   |   Status: Draft', size: 18, color: '9FA8DA', font: SF })] }),
                            new Paragraph({ spacing: { after: 0   }, children: [new TextRun({ text: 'Systems: Tasks · Transactions · Letters & Memos · Leaves · Appraisal', size: 18, color: '7986CB', font: SF })] }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

// ── Table of Contents (manual) ────────────────────────────────────────────────

function toc() {
    const items = [
        ['1.', 'Task Management System'],
        ['2.', 'Transactions System'],
        ['3.', 'Letters & Memos System'],
        ['4.', 'Leave Management System'],
        ['5.', 'Performance Appraisal System'],
        ['Appendix A.', 'SharePoint Equivalents Mapping'],
        ['Appendix B.', 'Markdown Reference Format'],
    ];
    return [
        h2('Table of Contents'),
        ...items.map(([num, title]) =>
            new Paragraph({
                spacing: { after: 80 },
                children: [
                    new TextRun({ text: `${num}  `, bold: true, size: 22, color: NAVY, font: SF }),
                    new TextRun({ text: title, size: 22, color: BLACK, font: SF }),
                ],
            })
        ),
    ];
}

// ── Role table ────────────────────────────────────────────────────────────────

function roleTable() {
    const roles = [
        { label: 'Admin / مشرف',    tc: '4A148C', desc: 'Full visibility across all departments. Can create, edit, delete and approve any task.' },
        { label: 'Deputy / وكيل',   tc: NAVY,     desc: 'Cross-department read/write. Creates tasks, approves change requests, exports reports.' },
        { label: 'Manager / مدير',  tc: '0D47A1', desc: 'Department-scoped. Manages own department tasks, approves employee submissions.' },
        { label: 'Employee / موظف', tc: '1B5E20', desc: 'Personal task view. Updates status, adds comments, submits change requests.' },
    ];
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: roles.map(r =>
                    new TableCell({
                        borders: {
                            top:    { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                            left:   { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                            right:  { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                        },
                        margins: { top: 120, bottom: 120, left: 120, right: 120 },
                        children: [
                            new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: r.label, bold: true, size: 20, color: r.tc, font: SF })] }),
                            new Paragraph({ spacing: { after: 0  }, children: [new TextRun({ text: r.desc,  size: 19, color: GRAY,  font: SF })] }),
                        ],
                    })
                ),
            }),
        ],
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION 1 — TASKS
// ══════════════════════════════════════════════════════════════════════════════

function sectionTasks() {
    return [
        h2('1. Task Management System — اجتماع تداول'),
        p('The Task Management System is the core workflow module of the Tadawul platform. It enables cross-departmental task creation, assignment, tracking, and approval within a role-based access model reflecting the Saudi Water Authority organisational hierarchy.'),

        h3('1.1  User Roles'),
        p('Four roles are supported, each with distinct access boundaries:'),
        gap(),
        roleTable(),
        gap(),
        note('All roles share a single login page. The system detects the role from the JWT and redirects to the appropriate view automatically.'),
        gap(),

        h3('1.2  Login & Hub'),
        p('Users authenticate at the root login page by entering their employee ID and password. On success a JWT (8-hour expiry) is stored in sessionStorage and the user is redirected to the Hub.'),
        gap(),
        img('login.png', 600, 380),
        caption('Figure 1 — Login page'),
        gap(),
        p('The Hub landing page surfaces all systems the authenticated user has access to, displays their name, role, and the timestamp of their previous login session.'),
        gap(),
        img('hub.png', 620, 399),
        caption('Figure 2 — Hub landing page (Admin view showing all 5 system tiles)'),

        pageBreak(),
        h3('1.3  Deputy / Admin Dashboard'),
        p('The Deputy and Admin views provide full cross-department visibility. Key elements:'),
        bullet('Department filter tabs at the top — click any department to scope the task list, or "All" to see everything.'),
        bullet('KPI stat cards — total tasks, in-progress, completed, pending approval — each clickable as a shortcut filter.'),
        bullet('Approval queue panel — lists tasks submitted by managers awaiting deputy sign-off.'),
        bullet('Meeting stopwatch — draggable timer widget for tracking meeting duration.'),
        bullet('Table ↔ Kanban toggle — switch between tabular list and Kanban board layout.'),
        bullet('One-click Excel export of the currently filtered task list.'),
        gap(),
        img('deputy_tasks.png', 620, 399),
        caption('Figure 3 — Deputy/Admin full-cross-department dashboard'),

        h3('1.4  Task Creation'),
        p('Any Manager, Deputy, or Admin can create tasks via the modal dialog. Fields: title, description, department, assignee (dropdown auto-filters to selected department), priority (عالية / متوسطة / منخفضة), start date, and due date. On save, all connected clients receive the new task in real time via SSE — no refresh required.'),
        gap(),
        img('deputy_add_task.png', 580, 400),
        caption('Figure 4 — Task creation modal'),

        h3('1.5  Manager View'),
        p('Managers see tasks scoped to their department only. They have an approval queue for employee-submitted change requests (status change, due-date extension) that must be reviewed before taking effect. Full filter controls cover status, priority, assignee, and date range.'),
        gap(),
        img('manager_tasks.png', 620, 399),
        caption('Figure 5 — Manager dashboard (department-scoped view)'),

        h3('1.6  Employee View'),
        p('Employees see only tasks assigned to them. They can update the task status, add comments, and submit change requests. Status changes that require approval (e.g., marking a task complete) enter the manager\'s approval queue before becoming visible.'),
        gap(),
        img('employee_tasks.png', 620, 399),
        caption('Figure 6 — Employee personal task view'),

        pageBreak(),
        h3('1.7  Key Business Rules'),
        bullet('Status flow:  جديد (New)  →  قيد التنفيذ (In Progress)  →  مكتملة (Completed).'),
        bullet('Employee status and date changes require manager approval before taking effect.'),
        bullet('Deputies and Admins can modify any task directly without an approval step.'),
        bullet('Tasks created by a manager are immediately visible; tasks submitted upward require deputy approval before appearing in the live list.'),
        bullet('All connected clients refresh automatically on any write via SSE broadcast — no polling, no manual refresh.'),
        gap(),
        infoBox('Real-time sync: A single /api/events SSE endpoint pushes a broadcast signal to every connected tab on any write. Each tab re-fetches only its own data slice. A 5-second server heartbeat lets clients detect server outages within ~12 seconds. The topbar status dot turns green/red to reflect connectivity without any page reload.'),
        gap(),

        h3('1.8  Technical Architecture — Tasks'),
        gap(),
        dataTable(
            ['Layer', 'Technology', 'Purpose'],
            [
                ['Runtime',        'Node.js 20 + Express 5',        'HTTP server, REST API, SSE endpoint'],
                ['Database',       'SQLite 3 via better-sqlite3',    'Tasks, users, departments, change request history'],
                ['Authentication', 'JWT — 8-hour expiry',            'Role embedded in token payload; validated on every API call'],
                ['Real-time',      'Server-Sent Events (SSE)',        'One-way server-to-all-clients broadcast on every data change'],
                ['Frontend',       'Vanilla HTML / CSS / JS',         'Static files served by Express — no framework, no build step'],
                ['Export',         'SheetJS / XLSX (CDN)',             'Client-side Excel generation from current filtered table view'],
            ]
        ),
        gap(),
        h3('Data Model — tasks'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',               'TEXT (UUID)',      'Primary key'],
                ['name',             'TEXT',             'Task title'],
                ['description',      'TEXT',             'Optional detail body'],
                ['priority',         'TEXT',             'عالية / متوسطة / منخفضة'],
                ['status',           'TEXT',             'جديد / قيد التنفيذ / مكتملة'],
                ['dept_id',          'INTEGER (FK)',      '→ departments.id'],
                ['assigned_to',      'TEXT (FK)',         '→ employees.id'],
                ['created_by',       'TEXT',             'Creator employee ID'],
                ['created_by_role',  'TEXT',             'Role at time of creation'],
                ['start_date',       'TEXT (ISO 8601)',   'Task start date'],
                ['due_date',         'TEXT (ISO 8601)',   'Task deadline'],
                ['approved',         'INTEGER (0/1)',     '1 = live, 0 = pending deputy approval'],
                ['created_at',       'TEXT (ISO 8601)',   'Server timestamp of creation'],
            ]
        ),
        gap(),
        h4('Change Requests sub-table'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',           'TEXT',          'Primary key'],
                ['task_id',      'TEXT (FK)',      '→ tasks.id'],
                ['requested_by', 'TEXT',          'Employee ID who submitted the request'],
                ['field',        'TEXT',          'Which field is being changed (status / due_date)'],
                ['new_value',    'TEXT',          'Proposed new value'],
                ['status',       'TEXT',          'pending / approved / rejected'],
                ['reviewed_by',  'TEXT',          'Manager/Deputy who acted on it'],
                ['created_at',   'TEXT (ISO)',     'Submission timestamp'],
            ]
        ),
        gap(),
        h3('API Endpoints — Tasks'),
        gap(),
        dataTable(
            ['Method', 'Endpoint', 'Access', 'Description'],
            [
                ['GET',    '/api/tasks/all',              'Deputy, Admin', 'All tasks across all departments'],
                ['GET',    '/api/tasks/dept/:id',         'Manager',       'Tasks for own department only'],
                ['GET',    '/api/tasks/my',               'Employee',      'Tasks assigned to calling user'],
                ['POST',   '/api/tasks',                  'Manager+',      'Create new task'],
                ['PATCH',  '/api/tasks/:id',              'Manager+',      'Direct update (status, fields)'],
                ['DELETE', '/api/tasks/:id',              'Deputy, Admin', 'Hard delete'],
                ['POST',   '/api/tasks/:id/changes',      'Employee',      'Submit a change request'],
                ['PATCH',  '/api/tasks/changes/:id',      'Manager+',      'Approve or reject change request'],
                ['GET',    '/api/events',                 'All',           'SSE stream for real-time broadcast'],
                ['GET',    '/api/ping',                   'All',           'Heartbeat check — returns {ok:true, ts}'],
            ]
        ),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION 2 — TRANSACTIONS
// ══════════════════════════════════════════════════════════════════════════════

function sectionTransactions() {
    return [
        pageBreak(),
        h2('2. Transactions System — المعاملات'),
        p('The Transactions System is a centralised registry and analytical dashboard for all official correspondence handled by the Saudi Water Authority. It supports bulk import from structured Excel files, multi-dimensional filtering, annotation, trend analysis, and multi-format export.'),

        h3('2.1  Access'),
        p('Restricted to Admin and Deputy roles. The system is read-heavy — primary operations are data import, filtering, annotation, and export rather than individual record creation.'),

        h3('2.2  Dashboard & KPI Cards'),
        p('The main view presents four clickable KPI stat cards:'),
        bullet('Total transactions in the current dataset.'),
        bullet('In-progress transactions (الجاري إنجازها).'),
        bullet('External transactions (خارجي).'),
        bullet('Urgent / important flag count.'),
        p('Each card acts as a one-click filter shortcut. A persistent filter panel on the right side of the screen allows multi-dimensional filtering: date range (Gregorian and Hijri), status, importance level, office type, originating entity, and reply-required flag. Multiple filters can be combined simultaneously.'),
        gap(),
        img('transactions_main.png', 620, 399),
        caption('Figure 7 — Transactions dashboard (KPI cards, analytics charts, right-side filter panel)'),

        h3('2.3  Analytics Charts'),
        p('Four Chart.js charts sit below the KPI cards:'),
        bullet('Transaction status donut — proportion of pending / in-progress / completed.'),
        bullet('Office-type bar chart — internal vs external vs mixed distribution.'),
        bullet('Top originating entities — horizontal bar showing highest-volume senders.'),
        bullet('Department distribution — breakdown of transactions by receiving department.'),
        p('All charts respond dynamically to the active filter state — they reflect only the filtered subset, not the full dataset.'),
        gap(),
        img('transactions_charts.png', 620, 420),
        caption('Figure 8 — Analytics charts and paginated transaction log table'),

        h3('2.4  Transaction Log Table'),
        p('Below the charts: a paginated, sortable table showing individual transactions. Columns include reference number, subject, status, importance rating, days elapsed since creation, current handler name, responsible department, and a detail-view action. Overdue rows are highlighted. Clicking the detail icon opens a side panel with the full transaction record.'),

        h3('2.5  Key Features'),
        bullet('Bulk import — upload a structured Excel/CSV file; the system parses it client-side (SheetJS) before sending to the server.'),
        subbullet('Import safety guard: if the new file has fewer records than the current database, a warning modal shows exact counts ("Current: 1191 — New file: 850") and requires confirmation before proceeding.'),
        bullet('Rich filtering — status, importance, date range, Hijri date, office type, entity, reply-required flag — all combinable simultaneously.'),
        bullet('Annotations — mark individual transactions as late (متأخرة) and add free-text comments without altering the source data.'),
        bullet('Export — PDF via browser print (formatted for print), Excel export of the current filtered view, and individual chart-image download.'),
        bullet('Real-time updates — SSE broadcast ensures all connected users see the latest data without refreshing after any import or annotation.'),
        gap(),
        infoBox('Import model: the transactions table stores each record as a JSON blob (the raw imported row) rather than normalised columns. This means the schema never needs altering when the source Excel format changes — new fields are simply included in the blob and surfaced by the frontend key-lookup.'),
        gap(),

        pageBreak(),
        h3('2.6  Technical Architecture — Transactions'),
        gap(),
        dataTable(
            ['Layer', 'Technology', 'Purpose'],
            [
                ['Runtime',   'Node.js 20 + Express 5',       'API and static file serving'],
                ['Database',  'SQLite — transactions table',   'Stores full transaction JSON blob per record; annotations in a separate table'],
                ['Charts',    'Chart.js 4 (CDN)',               'Bar, donut, and horizontal bar charts rendered client-side'],
                ['Import',    'SheetJS (CDN)',                  'Client-side Excel/CSV parsing before upload'],
                ['Export',    'SheetJS + window.print()',       'Excel export of filtered view; PDF via browser print dialog'],
                ['Real-time', 'SSE broadcast (shared)',         'Pushes update signal to all tabs on import or annotation save'],
            ]
        ),
        gap(),
        h3('Data Model — transactions'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',          'TEXT (UUID)',      'Primary key'],
                ['data',        'TEXT (JSON)',      'Full transaction record as-imported — all source fields preserved'],
                ['uploaded_at', 'TEXT (ISO 8601)', 'Timestamp of original import batch'],
                ['updated_at',  'TEXT (ISO 8601)', 'Timestamp of last update/annotation'],
            ]
        ),
        gap(),
        h4('transaction_annotations sub-table'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['transaction_id', 'TEXT (FK)',      'References transactions.id'],
                ['is_late',        'INTEGER (0/1)', 'Manual late flag set by user'],
                ['comment',        'TEXT',           'Free-text annotation'],
                ['updated_by',     'TEXT (FK)',      '→ employees.id'],
                ['updated_at',     'TEXT (ISO)',     'Last annotation timestamp'],
            ]
        ),
        gap(),
        h3('API Endpoints — Transactions'),
        gap(),
        dataTable(
            ['Method', 'Endpoint', 'Access', 'Description'],
            [
                ['GET',   '/api/transactions',              'Admin, Deputy', 'Fetch all transactions with their annotations'],
                ['POST',  '/api/transactions/import',       'Admin, Deputy', 'Bulk import — replaces full dataset, safety check included'],
                ['PATCH', '/api/transactions/:id/annotate', 'Admin, Deputy', 'Save or update late flag and comment for one transaction'],
            ]
        ),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION 3 — LETTERS & MEMOS
// ══════════════════════════════════════════════════════════════════════════════

function sectionLetters() {
    return [
        pageBreak(),
        h2('3. Letters & Memos System — الخطابات والمذكرات'),
        p('The Letters & Memos System is a structured document-generation tool that produces properly formatted official Arabic correspondence as .docx files. Output is ready for digital dispatch or printing, and follows Saudi Water Authority letterhead standards.'),

        h3('3.1  Access'),
        p('Available to all authenticated users. Each user generates letters and memos for their own correspondence. The output filename and metadata automatically reflect the authenticated user\'s identity and department.'),

        h3('3.2  Letter Generator — خطاب'),
        p('The Letter tab generates formal outgoing letters. The user fills in a structured form with the following fields:'),
        bullet('Subject (بشأن) — the letter\'s main subject line.'),
        bullet('Body paragraphs — multi-paragraph input; pressing Enter starts a new paragraph in the output document.'),
        bullet('Recipient (المُرسَل إليه) — selected from a dropdown; supports multiple recipients and CC (نسخة إلى) lines.'),
        bullet('Reference — optional number and subject for reply-to letters.'),
        bullet('Classification — مُقيَّد (Restricted) or عادي (Normal).'),
        bullet('Importance level — عادية / هامة / عاجلة / سري.'),
        bullet('Closing note (تعقيب) — trailing request or note appended after the main body.'),
        p('Pre-built templates populate the form with appropriate boilerplate for common letter types:'),
        subbullet('نموذج القرار — formal decision letter.'),
        subbullet('توقيع الوزير — letter requiring minister signature.'),
        subbullet('طلب ترشيح — nomination request.'),
        subbullet('ترشيح بجدول — nomination with scheduling table.'),
        gap(),
        img('letters_main.png', 620, 399),
        caption('Figure 9 — Letter generator (خطاب tab) showing template buttons and form fields'),

        h3('3.3  Memo Generator — مذكرة عرض'),
        p('The Memo tab generates internal briefing memos directed to the Deputy (سعادة النائب) or the Minister (معالي الرئيس). Changing the memo type adjusts the output template and header automatically. Form fields:'),
        bullet('Memo type — Deputy or Minister (radio toggle).'),
        bullet('Subject and body (العرض) — same multi-paragraph model as letters.'),
        bullet('Sender name (المُرسِل) — selected from the employee list; includes an "on behalf of" option (بالإنابة).'),
        bullet('Classification checkboxes — مُقيَّدة, سِرِّيَّة, سِرِّيَّة للغاية, عاجل, هام جداً, عاجل جداً.'),
        bullet('Opinion / recommendation section (الرأي) — optional additional paragraph for the sender\'s position.'),
        bullet('Attachments description — optional field listing enclosed documents.'),
        bullet('Action requested checkboxes — موافقة (Approval), توجيه (Guidance), إحاطة (Briefing), التوقيع (Signature).'),
        gap(),
        img('letters_memo.png', 620, 399),
        caption('Figure 10 — Memo generator (مذكرة عرض tab) for Deputy and Minister memos'),

        h3('3.4  Output Document'),
        p('Clicking "إنشاء وتنزيل" assembles the document in memory client-side and triggers a browser download — no server round-trip. The generated .docx includes:'),
        bullet('Saudi Water Authority letterhead and official logo.'),
        bullet('Auto-generated reference number and Hijri date header.'),
        bullet('Formatted Arabic body paragraphs with proper indentation and RTL layout.'),
        bullet('Classification and importance stamps in the appropriate positions.'),
        bullet('Signature block with sender name, title, and department.'),
        gap(),
        infoBox('Generation is entirely client-side using the docx.js browser library. The server is not involved in document creation — only the authentication check is server-side. This means document generation continues to work even during momentary connectivity loss, as long as the page is already loaded.'),
        gap(),

        h3('3.5  Technical Architecture — Letters & Memos'),
        gap(),
        dataTable(
            ['Layer', 'Technology', 'Purpose'],
            [
                ['Runtime',        'Node.js 20 + Express 5',   'Serves the static HTML page; no server-side generation involved'],
                ['Doc generation', 'docx.js (CDN)',             'Client-side .docx assembly, paragraph layout, and browser download trigger'],
                ['Date handling',  'Custom Hijri converter',    'Gregorian ↔ Hijri conversion for automatic document date headers'],
                ['Font',           'IBM Plex Sans Arabic (CDN)', 'Arabic-optimised font loaded for accurate text width measurement'],
                ['Authentication', 'JWT (shared)',               'Same JWT layer as all other Tadawul modules'],
            ]
        ),
        gap(),
        note('No persistent data model — letters and memos are generated on demand and not stored on the server. If archival or audit trail is required, the SharePoint implementation should integrate with a SharePoint document library.'),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION 4 — LEAVES
// ══════════════════════════════════════════════════════════════════════════════

function sectionLeaves() {
    return [
        pageBreak(),
        h2('4. Leave Management System — إدارة الإجازات والانتدابات'),
        p('The Leave Management System handles employee annual leave requests, secondments (انتدابات), emergency leave, and other leave types across all departments. It includes automated leave-balance tracking, an official holiday calendar with auto-recalculation of work-day counts, a visual Gantt chart of all active leaves, and department-level reports.'),

        h3('4.1  Access'),
        p('All four roles can access the system. The data scope follows the same role-based model as Tasks:'),
        bullet('Admin / Deputy — see all leaves across all departments; can approve, reject, or delete any leave.'),
        bullet('Manager — see leaves for their own department only; can approve or reject.'),
        bullet('Employee — see their own submitted leaves only; can submit new requests and cancel pending ones.'),

        h3('4.2  Leave Requests Tab — الإجازات'),
        p('The default tab lists all leaves accessible to the current user. Columns: employee name, department, leave type, start/end dates, number of working days, status, and reviewer. Status is colour-coded: pending (amber), approved (green), rejected (red).'),
        p('KPI cards at the top summarise total leaves, pending approvals, active leaves today, and approved count — each clickable as a filter shortcut.'),
        gap(),
        img('leaves_main.png', 620, 399),
        caption('Figure 11 — Leaves dashboard (KPI cards, status-filtered leave table)'),

        h3('4.3  Add Leave Modal'),
        p('Employees and managers submit leave requests via a modal dialog. Fields: employee (manager can select from department list), leave type (اعتيادية / طارئة / انتداب / أخرى), start date, end date, and optional notes. The system automatically computes working days — excluding weekends (Friday/Saturday) and any dates that fall within official holidays in the database.'),
        gap(),
        img('leaves_add_modal.png', 560, 420),
        caption('Figure 12 — Add leave request modal with automatic working-day calculation'),

        h3('4.4  Employees Tab — الموظفون'),
        p('A searchable table of all employees visible to the current user, showing their annual leave balance, leave days consumed this year, and total requests. Managers use this tab to cross-check balances before approving new requests.'),
        gap(),
        img('leaves_employees.png', 620, 399),
        caption('Figure 13 — Employees tab showing per-employee leave balances'),

        h3('4.5  Gantt Chart Tab — مخطط جانت'),
        p('A full calendar Gantt chart plots every approved leave as a coloured bar across a monthly timeline. Each row is one employee; weekends and official holidays are highlighted in a distinct background colour. The chart is horizontally scrollable and supports print-to-landscape output.'),
        gap(),
        img('leaves_gantt.png', 620, 399),
        caption('Figure 14 — Gantt chart showing concurrent leave coverage across employees'),

        h3('4.6  Official Holidays Tab — الإجازات الرسمية'),
        p('Admin and Deputy users manage the official holiday calendar here — adding, editing, or removing holiday blocks. Crucially, any mutation to the holiday calendar triggers an automatic server-side recalculation: every approved annual leave that overlaps the affected date range has its working-day count recomputed, and employee balances are adjusted accordingly.'),
        gap(),
        img('leaves_holidays.png', 620, 399),
        caption('Figure 15 — Official holidays calendar with add/edit controls'),

        h3('4.7  Reports Tab — التقارير'),
        p('Provides aggregated leave statistics by department: total requests, total approved days, breakdown by leave type (annual / emergency / secondment / other), and per-employee summaries. Designed to support HR reporting at department and authority level.'),
        gap(),
        img('leaves_reports.png', 620, 399),
        caption('Figure 16 — Leave reports tab (department-level aggregated summaries)'),

        pageBreak(),
        h3('4.8  Key Business Rules'),
        bullet('Annual leave balance is deducted automatically on approval; restored on rejection or manager deletion.'),
        bullet('Employees can only cancel their own pending requests — approved leaves cannot be cancelled without manager involvement.'),
        bullet('Managers can delete any leave in their department regardless of status; balance is restored if the deleted leave was approved annual leave.'),
        bullet('Adding a holiday that overlaps existing approved annual leaves triggers automatic recalculation — employee balances are refunded for the days that now fall on holidays.'),
        bullet('Removing a holiday has the inverse effect — affected employees\' balances are reduced for the newly billable days.'),
        gap(),
        infoBox('Working-day computation: the day-count function walks the date range day by day, skips Friday and Saturday (Saudi workweek), and skips any day whose date falls within an official_holidays record. This means the count is always accurate relative to the current holiday calendar, and recalculates automatically when holidays change.'),
        gap(),

        h3('4.9  Technical Architecture — Leaves'),
        gap(),
        dataTable(
            ['Layer', 'Technology', 'Purpose'],
            [
                ['Runtime',   'Node.js 20 + Express 5', 'API endpoints for leave CRUD, approval, holiday management'],
                ['Database',  'SQLite — leaves + official_holidays + employees tables', 'Stores requests, holiday blocks, and per-employee annual balance'],
                ['Real-time', 'SSE broadcast (shared)',  'All leave mutations broadcast to connected clients'],
                ['Frontend',  'Vanilla JS + Chart.js (CDN)', 'Gantt chart rendered as an HTML table; reports use Chart.js for department bars'],
                ['Print',     'CSS @media print',        'Gantt and leave-list pages have dedicated print layouts (landscape/portrait)'],
            ]
        ),
        gap(),
        h3('Data Model — leaves'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',            'TEXT',            'Primary key ("l_" prefix)'],
                ['employee_id',   'TEXT (FK)',        '→ employees.id'],
                ['employee_name', 'TEXT',             'Denormalised name for display'],
                ['dept_id',       'INTEGER (FK)',     '→ departments.id'],
                ['type',          'TEXT',             'اعتيادية / طارئة / انتداب / أخرى'],
                ['start_date',    'TEXT (ISO date)',  'Leave start'],
                ['end_date',      'TEXT (ISO date)',  'Leave end'],
                ['days',          'INTEGER',          'Computed working days (auto-calculated on submit and on holiday changes)'],
                ['status',        'TEXT',             'pending / approved / rejected'],
                ['notes',         'TEXT',             'Optional submission notes'],
                ['created_by',    'TEXT',             'Name of submitter'],
                ['created_at',    'TEXT (ISO)',        'Submission timestamp'],
                ['reviewed_by',   'TEXT',             'Name of approver/rejector'],
                ['reviewed_at',   'TEXT (ISO)',        'Review timestamp'],
            ]
        ),
        gap(),
        h4('official_holidays table'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',         'TEXT',           'Primary key ("h_" prefix)'],
                ['name',       'TEXT',           'Holiday name (e.g., عيد الفطر)'],
                ['type',       'TEXT',           'Holiday classification'],
                ['start_date', 'TEXT (ISO date)','Holiday start'],
                ['end_date',   'TEXT (ISO date)','Holiday end'],
                ['days',       'INTEGER',         'Duration in days'],
            ]
        ),
        gap(),
        h4('employees — leave-related columns'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['annual_leave_balance', 'INTEGER', 'Remaining annual leave days; deducted on approval, restored on reversal'],
            ]
        ),
        gap(),
        h3('API Endpoints — Leaves'),
        gap(),
        dataTable(
            ['Method', 'Endpoint', 'Access', 'Description'],
            [
                ['GET',    '/api/leaves',               'All',            'Fetch leaves (scoped by role)'],
                ['POST',   '/api/leaves',               'All',            'Submit new leave request'],
                ['PATCH',  '/api/leaves/:id/approve',   'Manager+',       'Approve leave; deducts annual balance if type = اعتيادية'],
                ['PATCH',  '/api/leaves/:id/reject',    'Manager+',       'Reject leave request'],
                ['DELETE', '/api/leaves/:id',           'Owner / Manager+','Delete leave; restores balance if approved annual leave'],
                ['GET',    '/api/leaves/holidays',      'All',            'Fetch official holiday list'],
                ['POST',   '/api/leaves/holidays',      'Deputy, Admin',  'Add holiday; triggers balance recalculation for affected leaves'],
                ['PUT',    '/api/leaves/holidays/:id',  'Deputy, Admin',  'Update holiday; recalculates over union of old and new date ranges'],
                ['DELETE', '/api/leaves/holidays/:id',  'Deputy, Admin',  'Remove holiday; adjusts balances for affected leaves'],
            ]
        ),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION 5 — APPRAISAL
// ══════════════════════════════════════════════════════════════════════════════

function sectionAppraisal() {
    return [
        pageBreak(),
        h2('5. Performance Appraisal System — تقييم الأداء'),
        p('The Performance Appraisal System manages structured employee evaluation cycles. Managers rate their staff against weighted objectives; the system tracks score distribution, flags deviations from organisational targets, and correlates performance scores with actual task and transaction workload.'),

        h3('5.1  Access'),
        bullet('Admin / Deputy — full access across all departments; can create, close, and delete evaluation cycles; manage settings (target average and band quotas).'),
        bullet('Manager — manage appraisal entries for their own department only; can add employees, enter scores, and view dashboard within the active cycle.'),
        bullet('Employee — read-only view of their own evaluation results for any completed cycle.'),

        h3('5.2  Appraisal Cycles'),
        p('All evaluation activity is scoped to a named cycle (e.g., "Q1 2026" or "Annual 2025"). A cycle can be Open or Closed. Managers add employees and enter scores only while the cycle is open. Closing a cycle freezes all scores for that period. Cycles can be reopened if corrections are needed (Deputy/Admin only).'),
        gap(),
        img('appraisal_staff.png', 620, 399),
        caption('Figure 17 — Staff tab: employee list within active appraisal cycle with scores and performance bands'),

        h3('5.3  Staff Tab — الموظفون'),
        p('The main tab lists all employees in the current cycle with their overall weighted score, performance band, job title, and grade. Colour-coded band labels:'),
        bullet('Band 5 (ممتاز) — green — outstanding performance.'),
        bullet('Band 4 (جيد جداً) — light green.'),
        bullet('Band 3 (جيد) — blue — meets expectations.'),
        bullet('Band 2 (مقبول) — amber — below standard.'),
        bullet('Band 1 (ضعيف) — red — significantly below standard.'),
        p('Clicking an employee\'s row opens the scoring modal where individual objective weights and scores can be entered or updated.'),

        h3('5.4  Scoring Modal'),
        p('The scoring modal displays the selected employee\'s profile (name, title, grade) and a table of appraisal objectives. Each objective has a weight (%) and a score (1–5). The system:'),
        bullet('Validates that objective weights sum to exactly 100%.'),
        bullet('Computes a real-time weighted average score as weights and scores are entered.'),
        bullet('Shows an impact indicator: how far the employee\'s average is from the cycle\'s configured target average.'),

        h3('5.5  Dashboard Tab — لوحة المعلومات'),
        p('The Dashboard tab provides an authority-level overview of appraisal results for the selected cycle:'),
        bullet('Summary block — total employees rated, cycle average score, and distribution bar showing proportion in each performance band.'),
        bullet('Per-department collapsible cards — each showing department average, band distribution bar, and the employee table for that department.'),
        bullet('Workload correlation panel — cross-references each employee\'s appraisal score with their actual task assignment count and transaction handling count for the same period.'),
        gap(),
        img('appraisal_dashboard.png', 620, 399),
        caption('Figure 18 — Dashboard tab: authority-level score distribution, department breakdown, and workload correlation'),

        h3('5.6  Settings'),
        p('Deputy and Admin users can configure two global parameters (per authority, persisted in app_settings):'),
        bullet('Target average score — the baseline the system compares department and individual scores against. Default: 3.5.'),
        bullet('Band quotas — the percentage of employees expected to fall in each band (e.g., Band 5: 5%, Band 4: 10%, Band 3: 70%, Band 2: 10%, Band 1: 5%). Used to highlight bands with overrepresentation or underrepresentation.'),
        gap(),
        infoBox('Workload correlation: the /api/appraisals/workload endpoint counts each employee\'s approved tasks and transactions for the selected year and joins the result with their appraisal score — letting managers see whether high performers correlate with high workload or whether some employees are carrying disproportionate volume relative to their rating.'),
        gap(),

        pageBreak(),
        h3('5.7  Technical Architecture — Appraisal'),
        gap(),
        dataTable(
            ['Layer', 'Technology', 'Purpose'],
            [
                ['Runtime',   'Node.js 20 + Express 5', 'REST API for cycles, entries, workload, and settings'],
                ['Database',  'SQLite — appraisal_cycles, appraisal_entries, app_settings tables', 'Cycle metadata, scored entries with JSON objectives, and global settings KV store'],
                ['Frontend',  'Vanilla JS + Chart.js',  'Distribution bar charts rendered client-side; scoring table is plain HTML'],
                ['Cross-data','SQLite joins (tasks + transactions + appraisal_entries)', 'Workload endpoint joins all three tables for the correlation view'],
            ]
        ),
        gap(),
        h3('Data Model — appraisal_cycles'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',         'TEXT',     'Primary key ("ac_" prefix)'],
                ['name',       'TEXT',     'Cycle label (e.g., "Annual 2025")'],
                ['year',       'INTEGER',  'Calendar year of the cycle'],
                ['status',     'TEXT',     'open / closed'],
                ['created_by', 'TEXT',     'Name of creator'],
                ['created_at', 'TEXT',     'ISO timestamp'],
            ]
        ),
        gap(),
        h4('appraisal_entries table'),
        gap(),
        dataTable(
            ['Column', 'Type', 'Description'],
            [
                ['id',            'TEXT',         'Primary key ("ae_" prefix)'],
                ['cycle_id',      'TEXT (FK)',     '→ appraisal_cycles.id'],
                ['employee_id',   'TEXT (FK)',     '→ employees.id'],
                ['employee_name', 'TEXT',          'Denormalised name'],
                ['dept_id',       'INTEGER (FK)',  '→ departments.id'],
                ['title',         'TEXT',          'Job title at time of evaluation'],
                ['grade',         'TEXT',          'Pay grade'],
                ['objectives',    'TEXT (JSON)',   'Array of {name, weight, score} objects'],
                ['created_at',    'TEXT (ISO)',    'Entry creation timestamp'],
            ]
        ),
        gap(),
        h3('API Endpoints — Appraisal'),
        gap(),
        dataTable(
            ['Method', 'Endpoint', 'Access', 'Description'],
            [
                ['GET',    '/api/appraisals/cycles',         'All',           'List all evaluation cycles (sorted by year desc)'],
                ['POST',   '/api/appraisals/cycles',         'Manager+',      'Create new cycle'],
                ['PATCH',  '/api/appraisals/cycles/:id/close',   'Manager+', 'Close cycle (freeze scores)'],
                ['PATCH',  '/api/appraisals/cycles/:id/reopen',  'Manager+', 'Reopen cycle'],
                ['DELETE', '/api/appraisals/cycles/:id',     'Deputy, Admin', 'Delete cycle and all its entries'],
                ['GET',    '/api/appraisals/entries',        'All',           'Fetch entries for a cycle (scoped by role)'],
                ['POST',   '/api/appraisals/entries',        'Manager+',      'Add employee to cycle (unique per employee/cycle pair)'],
                ['PUT',    '/api/appraisals/entries/:id',    'Manager+',      'Update score/objectives for entry'],
                ['DELETE', '/api/appraisals/entries/:id',    'Manager+',      'Remove employee from cycle'],
                ['GET',    '/api/appraisals/workload',       'Manager+',      'Task + transaction counts per employee (cross-table join)'],
                ['GET',    '/api/appraisals/settings',       'All',           'Read target average and band quota settings'],
                ['PUT',    '/api/appraisals/settings',       'Deputy, Admin', 'Update target average and band quotas'],
            ]
        ),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  APPENDIX A — SharePoint Mapping
// ══════════════════════════════════════════════════════════════════════════════

function appendixSharePoint() {
    return [
        pageBreak(),
        h1('Appendix A — SharePoint Equivalents Mapping'),
        p('The table below maps each current-stack component to its nearest SharePoint / Microsoft 365 equivalent, providing a starting point for the re-implementation effort. The goal is not a direct port but a functionally equivalent system that leverages the target platform\'s native capabilities.'),
        gap(),
        dataTable(
            ['Tadawul (Current)', 'Technology', 'SharePoint / M365 Equivalent', 'Notes'],
            [
                ['SQLite — tasks, leaves, appraisals',   'better-sqlite3',     'SharePoint Lists',                     'One List per entity; metadata columns map to table columns; lookups via List relationships'],
                ['SQLite — transactions (JSON blob)',     'better-sqlite3',     'SharePoint List + JSON column or Document Library', 'If schema varies, store raw JSON in a Multiline Text column or attach Excel to a library item'],
                ['JWT authentication / session',         'jsonwebtoken',       'Azure Active Directory (AAD) / SharePoint OAuth', 'AAD handles identity; SharePoint enforces permissions via groups and site permissions'],
                ['Role-based access (admin/deputy/manager/employee)', 'Custom middleware', 'SharePoint Groups + Permission Levels', 'Map each role to a SharePoint group; restrict list/item CRUD via item-level permissions or Power Apps logic'],
                ['Server-Sent Events (SSE) — real-time broadcast', 'Custom Express SSE', 'Power Automate + Power Apps signals or SignalR (Azure)', 'Native real-time is limited in SharePoint; Power Automate flows can trigger app refreshes; Azure SignalR is the closest equivalent'],
                ['Express REST API',                     'Express 5',          'Power Automate HTTP triggers or Azure Functions', 'Business logic lives in Power Automate flows or serverless Azure Functions called from Power Apps'],
                ['HTML frontend (deputy/manager/employee/leaves/appraisal)', 'Vanilla JS', 'Power Apps (Canvas Apps)', 'Canvas Apps provide the equivalent responsive multi-screen UI; connect to SharePoint Lists as data source'],
                ['Letter & Memo generation (client-side docx.js)', 'docx.js (browser)', 'Power Automate + Word Online template', 'Power Automate "Populate a Microsoft Word template" action; store output in SharePoint Document Library'],
                ['Chart.js analytics charts',            'Chart.js (CDN)',      'Power BI embedded or Power Apps charts', 'Power BI report embedded in SharePoint page is the closest equivalent for rich analytics'],
                ['SheetJS — Excel import/export',        'SheetJS (CDN)',       'Power Automate "Get rows" from Excel / "Create table" action', 'Import: upload Excel to SharePoint, flow reads rows; Export: Power Automate "Create CSV table" or use Excel Online'],
                ['Hijri date conversion',                'Custom JS converter', 'Power Apps DateAdd with custom locale or Azure API', 'Power Apps has limited built-in Hijri support; a custom connector calling an external Hijri API is the cleanest approach'],
                ['SQLite FTS / manual search',           'SQL LIKE queries',    'SharePoint Search (KQL)',              'SharePoint\'s built-in search indexes List items; KQL queries can filter by managed properties'],
                ['Node.js cron / scheduled logic',       'node-cron (if used)', 'Power Automate scheduled flows',      'Scheduled cloud flows trigger at set intervals; replace any server-side timed jobs'],
                ['Express static file serving',          'express.static',     'SharePoint pages / SPFx web parts',   'Static pages become SharePoint Site Pages or SPFx web part bundles deployed to the app catalog'],
            ]
        ),
        gap(),
        p('Key implementation considerations for the SharePoint re-build:'),
        bullet('Permissions model: SharePoint\'s item-level permissions can be expensive to manage at scale. Consider a single-layer permission model (group-based) and enforce field-level restrictions in Power Apps logic rather than SharePoint item permissions.'),
        bullet('Real-time updates: SharePoint has no native SSE equivalent. For task dashboards requiring live updates, consider a polling interval (Power Apps Timer control) or Azure SignalR as a custom connector.'),
        bullet('Arabic / RTL support: Power Apps supports RTL layout via the LayoutDirection property; set it globally in the app settings. SharePoint modern pages are LTR by default — use an RTL CSS injection if needed.'),
        bullet('Offline / low-connectivity: the current system relies on the local network being up. SharePoint Online is cloud-hosted, removing this concern entirely — but requires internet access for all users.'),
        bullet('Document generation: Word template fills in Power Automate are the recommended path for letter/memo generation; store generated documents in a dedicated SharePoint Document Library with metadata columns for reference number, date, and type.'),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  APPENDIX B — Markdown Reference Format
// ══════════════════════════════════════════════════════════════════════════════

function appendixMarkdown() {
    return [
        pageBreak(),
        h1('Appendix B — Markdown Reference Format'),
        p('In addition to this Word document, a Markdown version of the documentation is planned for use in the project\'s Git repository (e.g., README.md or /docs/). This appendix defines the structure and conventions for that format.'),

        h3('B.1  Purpose'),
        bullet('Serve as the living technical reference — updated alongside the code with each release.'),
        bullet('Render cleanly on GitHub / GitLab, Azure DevOps wikis, and in developer IDEs.'),
        bullet('Be machine-parseable for future doc-generation pipelines (e.g., Docusaurus, MkDocs, or a SharePoint wiki sync).'),

        h3('B.2  Proposed File Structure'),
        gap(),
        infoBox(
            '/docs/\n' +
            '  index.md              ← top-level overview + TOC\n' +
            '  01-tasks.md           ← Task Management System\n' +
            '  02-transactions.md    ← Transactions System\n' +
            '  03-letters.md         ← Letters & Memos System\n' +
            '  04-leaves.md          ← Leave Management System\n' +
            '  05-appraisal.md       ← Performance Appraisal System\n' +
            '  appendix-sharepoint.md ← SharePoint mapping\n' +
            '  appendix-api.md       ← Full API reference (auto-generated)\n' +
            '  /screenshots/         ← PNG assets referenced by docs'
        ),
        gap(),

        h3('B.3  Per-Module Document Template'),
        p('Each system document follows this heading structure:'),
        gap(),
        infoBox(
            '# [N]. [System Name]\n' +
            '\n' +
            '## Overview\n' +
            'One paragraph. Purpose, who uses it, key value delivered.\n' +
            '\n' +
            '## Access & Roles\n' +
            'Table: Role | Scope | Permissions\n' +
            '\n' +
            '## UX Walkthrough\n' +
            '### [Screen/Tab name]\n' +
            'Description + screenshot reference: ![caption](../screenshots/filename.png)\n' +
            '\n' +
            '## Business Rules\n' +
            '- Bullet list of invariants, constraints, approval flows.\n' +
            '\n' +
            '## Data Model\n' +
            'Markdown table per database table/entity.\n' +
            '\n' +
            '## API Reference\n' +
            'Table: Method | Endpoint | Access | Description\n' +
            '\n' +
            '## Notes & Known Limitations\n' +
            'Any edge cases, known gaps, or pending features.'
        ),
        gap(),

        h3('B.4  Markdown Conventions'),
        bullet('Use ATX headings (#, ##, ###) — no underline-style headings.'),
        bullet('Table column order: always left-to-right (LTR) even for Arabic content — insert Arabic text in cells.'),
        bullet('Code blocks: use fenced ``` blocks with language tags (js, sql, bash).'),
        bullet('Screenshots: always include an alt-text caption and a relative path from the doc file to /screenshots/.'),
        bullet('Link internal sections with anchor links: [see §4.8](#48-key-business-rules).'),
        bullet('Dates: ISO 8601 (YYYY-MM-DD) throughout; add Hijri date in parentheses where relevant.'),
        bullet('Arabic terms: include in parentheses after the English equivalent on first use, e.g., "annual leave (اعتيادية)".'),
        gap(),

        h3('B.5  Relationship Between Word and Markdown Versions'),
        gap(),
        dataTable(
            ['Attribute', 'Word (.docx)', 'Markdown (.md)'],
            [
                ['Primary audience',  'Dev team (initial briefing)',          'Developers (ongoing reference)'],
                ['Update frequency',  'Per major release or requirement change', 'Continuous — updated with every code change'],
                ['Screenshots',       'Embedded inline (fixed at generation time)', 'Referenced as relative file paths (always current)'],
                ['Distribution',      'Shared as attachment / printed',        'Committed to repository; rendered on git hosting'],
                ['Searchability',     'Limited (Word\'s built-in search)',     'Full-text search via GitHub/GitLab/DevOps search'],
                ['Arabic rendering',  'Native Word RTL support',              'Depends on Markdown renderer; modern platforms handle it'],
                ['Version history',   'Manual versioning (v1.0, v1.1...)',     'Git history tracks every change with author and date'],
            ]
        ),
        gap(),
        note('An Arabic version of both the Word document and the Markdown docs is planned for a future iteration. The structure defined in this appendix will remain the same; only the language of the prose changes.'),
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
//  BUILD
// ══════════════════════════════════════════════════════════════════════════════

async function build() {
    const doc = new Document({
        styles: {
            default: { document: { run: { font: SF, size: 22 } } },
        },
        sections: [{
            properties: {
                page: {
                    size:   { width: A4_W, height: A4_H },
                    margin: MAR,
                },
            },
            children: [
                coverBlock(),
                gap(2),
                ...toc(),
                pageBreak(),
                ...sectionTasks(),
                ...sectionTransactions(),
                ...sectionLetters(),
                ...sectionLeaves(),
                ...sectionAppraisal(),
                ...appendixSharePoint(),
                ...appendixMarkdown(),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    const out    = path.join(DIR, 'tadawul_documentation.docx');
    fs.writeFileSync(out, buffer);
    console.log('Done →', out);
}

build().catch(e => { console.error(e.message); process.exit(1); });
