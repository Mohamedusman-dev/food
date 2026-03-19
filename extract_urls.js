const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const filesToScan = ['index.html', ...getFiles('css'), 'js/custom.js'];
const urls = new Set();
const regex = /https:\/\/files\.catbox\.moe\/[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|gif)/g;

for (const file of filesToScan) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            urls.add(match[0]);
        }
    }
}

fs.writeFileSync('cdn_urls.txt', Array.from(urls).join('\n'));
console.log('Saved ' + urls.size + ' URLs to cdn_urls.txt');
