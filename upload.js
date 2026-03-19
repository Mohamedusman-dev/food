const fs = require('fs');
const path = require('path');

async function uploadImage(filePath) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    
    // In Node 25, we can use File or Blob
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);
    formData.append('fileToUpload', blob, path.basename(filePath));

    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
}

async function main() {
    const htmlPath = 'index.html';
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Find all gallery images in index.html
    const regex = /images\/(gallery_\d+\.jpg)/g;
    let match;
    const imagesToUpload = new Set();
    while ((match = regex.exec(htmlContent)) !== null) {
        imagesToUpload.add(match[1]);
    }

    if (imagesToUpload.size === 0) {
        console.log("No gallery images found in index.html");
        return;
    }

    for (const image of imagesToUpload) {
        const localPath = path.join('images', image);
        if (!fs.existsSync(localPath)) {
            console.log(`File not found: ${localPath}`);
            continue;
        }
        console.log(`Uploading ${localPath}...`);
        try {
            const url = await uploadImage(localPath);
            console.log(`Uploaded to ${url}`);
            htmlContent = htmlContent.split(`images/${image}`).join(url);
        } catch (e) {
            console.error(`Failed to upload ${image}: ${e.message}`);
        }
        // Small delay to prevent rate limit
        await new Promise(r => setTimeout(r, 1000));
    }

    fs.writeFileSync(htmlPath, htmlContent);
    console.log('HTML file updated successfully.');
}

main();
