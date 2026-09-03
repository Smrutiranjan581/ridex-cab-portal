import fs from 'fs';
import { execSync } from 'child_process';

console.log('⚡ Building & Syncing RideX Rider App...');
execSync('npm run build:rider', { stdio: 'inherit' });

// Ensure android directory points to android-rider
if (fs.existsSync('android-rider')) {
  if (fs.existsSync('android')) fs.rmSync('android', { recursive: true, force: true });
  fs.cpSync('android-rider', 'android', { recursive: true });
}

fs.copyFileSync('capacitor.rider.json', 'capacitor.config.json');
execSync('npx cap sync android', { stdio: 'inherit' });

if (fs.existsSync('android')) {
  if (fs.existsSync('android-rider')) fs.rmSync('android-rider', { recursive: true, force: true });
  fs.renameSync('android', 'android-rider');
}

console.log('✅ RideX Rider App Synced successfully to android-rider/');
