import { execSync } from 'node:child_process';
import path from 'node:path';

const rootDir = process.cwd();
const pyScriptPath = path.join(rootDir, 'scripts', 'build-zip.py');

try {
  execSync(`python3 "${pyScriptPath}"`, { stdio: 'inherit' });
  console.log('Successfully generated Windows & Mac compatible ZIP archive at public/discord-clone-source.zip');
} catch (e) {
  console.error('Error generating zip:', e);
  process.exit(1);
}
