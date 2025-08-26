// services/pdf.service.js
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { log } = require('console');

/**
 * สร้าง PDF จากข้อมูล Record
 * @param {object} recordData - ข้อมูล Record ที่ได้จาก getRecordById
 * @returns {Promise<Buffer>} - คืนค่าเป็น Buffer ของไฟล์ PDF
 */
const createReportPdf = async (recordData) => {
    try {
        
        const templatePath = path.join(__dirname, '..', 'views', 'record-result-template.ejs');
        const template = fs.readFileSync(templatePath, 'utf-8');
        
        // 2. นำข้อมูลไปใส่ใน template (Render HTML)
        const html = ejs.render(template, {
            record: recordData,
            machine: recordData.machine
        });

        // 3. ใช้ Puppeteer สร้าง PDF
        const browser = await puppeteer.launch({
             args: ['--no-sandbox', '--disable-setuid-sandbox'] // สำหรับรันบน Server/Linux
        });
        const page = await browser.newPage();
        
        // กำหนดเนื้อหา HTML ให้กับหน้าเว็บ
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // สร้าง PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true // สำคัญมาก! เพื่อให้สีพื้นหลังและ CSS แสดงผล
        });

        await browser.close();

        return pdfBuffer;

    } catch (error) {
        console.error("Error creating PDF:", error);
        throw new Error("ไม่สามารถสร้างไฟล์ PDF ได้");
    }
};

module.exports = { createReportPdf };