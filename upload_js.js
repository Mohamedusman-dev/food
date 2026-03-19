const fs = require('fs');
const path = require('path');

async function uploadImage(filePath) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);
    formData.append('fileToUpload', blob, path.basename(filePath));

    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                return await response.text();
            }
        } catch (e) { }
        await new Promise(r => setTimeout(r, 1000));
    }
    return null;
}

async function main() {
    const imagesToUpload = [
        'images/logo.png',
        'images/logo2.png',
        'images/logo3.png',
        'images/logo4.png',
        'images/ajax-loader.gif',
        'images/loader-animation.gif' // maybe they used this locally
    ];
    const replacements = {};

    for (const img of imagesToUpload) {
        if (!fs.existsSync(img)) continue;
        console.log(`Uploading ${img}...`);
        const url = await uploadImage(img);
        if (url) {
            console.log(` -> ${url}`);
            replacements[img] = url;
            // js might have "images/logo.png"
        }
    }

    const jsFile = 'js/custom.js';
    if (fs.existsSync(jsFile)) {
        let content = fs.readFileSync(jsFile, 'utf8');
        let changed = false;
        for (const [oldPath, newUrl] of Object.entries(replacements)) {
            if (content.includes(oldPath)) {
                content = content.split(oldPath).join(newUrl);
                changed = true;
            }
        }
        if (changed) {
            fs.writeFileSync(jsFile, content);
            console.log(`Updated ${jsFile}`);
        }
    }
}
main();
