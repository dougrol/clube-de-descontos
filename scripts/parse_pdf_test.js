// Temporary script to extract text from the Eleva Mais PDF and understand its structure
const fs = require('fs');
const path = require('path');

async function extractPdfText() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const pdfPath = path.resolve('C:/Users/dougl/Downloads/SGA - RELATORIO DE VEICULOS.pdf');
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    
    console.log(`Total pages: ${doc.numPages}`);
    
    // Extract text from first 2 pages to understand the structure
    for (let pageNum = 1; pageNum <= Math.min(2, doc.numPages); pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        console.log(`\n=== PAGE ${pageNum} ===`);
        
        // Group items by Y position to reconstruct rows
        const rows = {};
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5]);
            const x = Math.round(item.transform[4]);
            if (!rows[y]) rows[y] = [];
            rows[y].push({ x, text: item.str });
        });
        
        // Sort by Y desc (top to bottom) and print each row
        const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);
        for (const y of sortedYs) {
            const cells = rows[y].sort((a, b) => a.x - b.x);
            const line = cells.map(c => `[x=${c.x}]${c.text}`).join('  ');
            if (line.trim()) {
                console.log(`[Y=${y}] ${line}`);
            }
        }
    }
}

extractPdfText().catch(console.error);
