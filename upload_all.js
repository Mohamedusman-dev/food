const fs = require('fs');
const path = require('path');

async function uploadImage(filePath) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);
    formData.append('fileToUpload', blob, path.basename(filePath));

    // Try multiple times in case of rate limit or error
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            console.error(`Attempt ${i+1} failed for ${filePath}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error(`Failed to upload ${filePath} after 3 attempts`);
}

function getFiles(dir, fileList = []) {
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

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [oldPath, newUrl] of Object.entries(replacements)) {
        // use split join for global replace
        // Try replacing exact relative path (e.g. 'images/logo.png')
        let searchPath = oldPath.replace(/\\/g, '/'); // ensure forward slashes
        if (content.includes(searchPath)) {
            content = content.split(searchPath).join(newUrl);
            changed = true;
        }
        // Also try with '../' for CSS files ('../images/banner.jpg')
        let cssSearchPath = '../' + searchPath;
        if (content.includes(cssSearchPath)) {
            content = content.split(cssSearchPath).join(newUrl);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

async function main() {
    console.log("Starting upload process...");
    const imageDir = 'images';
    if (!fs.existsSync(imageDir)) {
        console.error("Images directory not found!");
        return;
    }

    const imageFiles = fs.readdirSync(imageDir).filter(f => /\.(jpg|jpeg|png|gif|ico)$/i.test(f));
    const replacements = {};

    console.log(`Found ${imageFiles.length} images to upload.`);

    for (let i = 0; i < imageFiles.length; i++) {
        const img = imageFiles[i];
        const localPath = path.join(imageDir, img);
        console.log(`[${i+1}/${imageFiles.length}] Uploading ${localPath}...`);
        try {
            const url = await uploadImage(localPath);
            console.log(` -> ${url}`);
            replacements[localPath] = url;
            // Also add with forward slash explicitly for HTML/CSS matching
            replacements[imageDir + '/' + img] = url;
        } catch (e) {
            console.error(`Error uploading ${img}`, e);
        }
        // sleep to respect API limits
        await new Promise(r => setTimeout(r, 1000));
    }

    // Now replace in index.html
    replaceInFile('index.html', replacements);

    // Replace in all CSS files
    const cssFiles = getFiles('css').filter(f => f.endsWith('.css'));
    for (const cssFile of cssFiles) {
        replaceInFile(cssFile, replacements);
    }

    console.log("All updates complete!");
}

main();
