const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const src  = 'file:///' + path.resolve(__dirname, 'sample_doc.html').replace(/\\/g, '/');

(async () => {
    const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(src, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: path.join(__dirname, 'sample_tasks_section.pdf'),
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '0', right: '0' }
    });
    await browser.close();
    console.log('PDF done →', path.join(__dirname, 'sample_tasks_section.pdf'));
})().catch(e => { console.error(e.message); process.exit(1); });
