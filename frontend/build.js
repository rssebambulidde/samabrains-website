const fs = require('fs');
const path = require('path');

// Grab the environment variable from Cloudflare
const backendUrl = process.env.VITE_BACKEND_URL;

if (!backendUrl) {
    console.error('\n\x1b[31m%s\x1b[0m', '❌ ERROR: VITE_BACKEND_URL environment variable is MISSING!');
    console.error('\x1b[33m%s\x1b[0m\n', 'You must add VITE_BACKEND_URL in your Cloudflare Pages dashboard -> Settings -> Environment Variables, then retry the deployment.');
    process.exit(1); // Fail the build to prevent shipping broken code
}

// Read the script file
const scriptPath = path.join(__dirname, 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Replace the placeholder with the actual environment variable securely
scriptContent = scriptContent.replace(/__BACKEND_URL__/g, backendUrl);

// Write it back
fs.writeFileSync(scriptPath, scriptContent);

console.log('\x1b[32m%s\x1b[0m', `✅ Successfully injected backend URL into script.js: ${backendUrl}`);
