import fs from 'fs';
import { execSync } from 'child_process';

console.log('⚡ Building & Syncing RideX Partner Captain App...');
execSync('npm run build:captain', { stdio: 'inherit' });

// Ensure android directory points to android-captain
if (fs.existsSync('android-captain')) {
  if (fs.existsSync('android')) fs.rmSync('android', { recursive: true, force: true });
  fs.cpSync('android-captain', 'android', { recursive: true });
}

fs.copyFileSync('capacitor.captain.json', 'capacitor.config.json');
execSync('npx cap sync android', { stdio: 'inherit' });

if (fs.existsSync('android')) {
  if (fs.existsSync('android-captain')) fs.rmSync('android-captain', { recursive: true, force: true });
  fs.renameSync('android', 'android-captain');
}

console.log('✅ RideX Partner Captain App Synced successfully to android-captain/');
