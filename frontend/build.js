const fs = require('fs');
const path = require('path');

// Grab the environment variable from Cloudflare
const backendUrl = process.env.VITE_BACKEND_URL;

if (!backendUrl) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: VITE_BACKEND_URL environment variable is not set. Defaulting to localhost fallback in script.js.');
    process.exit(0);
}

// Read the script file
const scriptPath = path.join(__dirname, 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Replace the placeholder with the actual environment variable securely
scriptContent = scriptContent.replace(/__BACKEND_URL__/g, backendUrl);

// Write it back
fs.writeFileSync(scriptPath, scriptContent);

console.log('\x1b[32m%s\x1b[0m', `✅ Successfully injected backend URL into script.js: ${backendUrl}`);
