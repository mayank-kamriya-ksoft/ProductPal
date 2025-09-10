// build-client.js
const { execSync } = require('child_process');
const path = require('path');

// Change to client directory and build
process.chdir('client');
execSync('npx vite build --outDir ../dist/public', { stdio: 'inherit' });