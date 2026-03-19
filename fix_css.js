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

function fixCss(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    if (content.includes('../https://')) {
        content = content.replace(/\.\.\/https:\/\//g, 'https://');
        changed = true;
    }
    if (content.includes('../../https://')) { // just in case
        content = content.replace(/\.\.\/\.\.\/https:\/\//g, 'https://');
        changed = true;
    }
    // Also fix url(..https://...) which appeared in style.css:1660
    if (content.includes('..https://')) {
        content = content.replace(/\.\.https:\/\//g, 'https://');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed ${filePath}`);
    }
}

const cssFiles = getFiles('css').filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
    fixCss(file);
}
console.log('Done fixing css.');
