const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT  = __dirname;

async function shot(page, name) {
    await page.screenshot({ path: path.join(OUT, name) });
    console.log(name, 'done');
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function login(page, id) {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await wait(400);
    await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(600);
    await page.type('#empId', id);
    await page.type('#password', id);
    await page.click('#loginBtn');
    await wait(2500);
}

async function clickTab(page, idx) {
    const tabs = await page.$$('.tab');
    if (tabs[idx]) { await tabs[idx].click(); await wait(1000); }
}

(async () => {
    const browser = await puppeteer.launch({
        executablePath: EDGE,
        headless: true,
        args: ['--no-sandbox', '--window-size=1400,900'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // ── Login page ───────────────────────────────────────────────────────────────
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await wait(800);
    await shot(page, 'login.png');

    // ── Hub ──────────────────────────────────────────────────────────────────────
    await login(page, 'U292409');
    await page.goto('http://localhost:3000/hub.html', { waitUntil: 'networkidle2' });
    await wait(1500);
    await shot(page, 'hub.png');

    // ── Tasks — Deputy/Admin ─────────────────────────────────────────────────────
    await login(page, 'U292409');
    await page.goto('http://localhost:3000/deputy.html', { waitUntil: 'networkidle2' });
    await wait(2000);
    await shot(page, 'deputy_tasks.png');

    // Add task modal
    const addBtn = await page.$('#openAddBtn, button[onclick*="openAddModal"], button[onclick*="openAdd"]');
    if (addBtn) { await addBtn.click(); await wait(800); await shot(page, 'deputy_add_task.png'); }
    else {
        // try clicking anything that opens the modal
        await page.evaluate(() => { if (typeof openAddModal === 'function') openAddModal(); });
        await wait(800);
        await shot(page, 'deputy_add_task.png');
    }
    // close modal
    await page.keyboard.press('Escape');
    await wait(400);

    // ── Tasks — Manager ──────────────────────────────────────────────────────────
    await login(page, 'U292406');
    await page.goto('http://localhost:3000/manager.html', { waitUntil: 'networkidle2' });
    await wait(2000);
    await shot(page, 'manager_tasks.png');

    // ── Tasks — Employee ─────────────────────────────────────────────────────────
    await login(page, 'U292401');
    await page.goto('http://localhost:3000/employee.html', { waitUntil: 'networkidle2' });
    await wait(2000);
    await shot(page, 'employee_tasks.png');

    // ── Transactions ─────────────────────────────────────────────────────────────
    await login(page, 'U292409');
    await page.goto('http://localhost:3000/transactions.html', { waitUntil: 'networkidle2' });
    await wait(2500);
    await shot(page, 'transactions_main.png');

    await page.evaluate(() => window.scrollBy(0, 320));
    await wait(500);
    await shot(page, 'transactions_charts.png');

    // ── Letters ──────────────────────────────────────────────────────────────────
    await login(page, 'U292409');
    await page.goto('http://localhost:3000/letters.html', { waitUntil: 'networkidle2' });
    await wait(2500);
    await shot(page, 'letters_main.png');

    // Memo tab (index 1)
    await clickTab(page, 1);
    await shot(page, 'letters_memo.png');

    // ── Leaves ───────────────────────────────────────────────────────────────────
    await login(page, 'U292409');
    await page.goto('http://localhost:3000/leaves.html', { waitUntil: 'networkidle2' });
    await wait(2500);
    await shot(page, 'leaves_main.png');

    // Employees tab
    await clickTab(page, 1);
    await shot(page, 'leaves_employees.png');

    // Gantt tab
    await clickTab(page, 2);
    await wait(600);
    await shot(page, 'leaves_gantt.png');

    // Official Holidays tab
    await clickTab(page, 3);
    await shot(page, 'leaves_holidays.png');

    // Reports tab
    await clickTab(page, 4);
    await wait(800);
    await shot(page, 'leaves_reports.png');

    // Add leave modal — back to leaves tab first
    await clickTab(page, 0);
    await wait(600);
    const addLeaveBtns = await page.$$('.btn-add');
    if (addLeaveBtns.length) { await addLeaveBtns[0].click(); await wait(800); await shot(page, 'leaves_add_modal.png'); }
    await page.keyboard.press('Escape');
    await wait(300);

    // ── Appraisal ────────────────────────────────────────────────────────────────
    await login(page, 'U292409');
    await page.goto('http://localhost:3000/appraisal.html', { waitUntil: 'networkidle2' });
    await wait(2500);
    await shot(page, 'appraisal_staff.png');

    // Dashboard tab
    await clickTab(page, 1);
    await wait(1000);
    await shot(page, 'appraisal_dashboard.png');

    await browser.close();
    console.log('\nAll screenshots done.');
})().catch(e => { console.error(e.message); process.exit(1); });
