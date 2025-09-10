// build-client.js
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Change to client directory and build
process.chdir('client');
execSync('npx vite build --outDir ../dist/public', { stdio: 'inherit' });