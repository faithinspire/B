#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

try {
  console.log('📝 Committing Task 7 changes...\n');

  // Stage files
  console.log('📦 Staging files...');
  execSync('git add "app/(admin)/admin/verification/page.tsx" DEPLOYMENT_GUIDE_COMPLETE_FINAL.md', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Commit
  console.log('\n✅ Committing...');
  execSync(
    'git commit -m "Task 7: Admin verification page + messaging/location fixes complete\n\n- Built admin verification page with pending braiders list\n- Document previews (ID + selfie)\n- Approve/reject functionality\n- Real-time message subscriptions\n- Real-time location tracking\n- Dual-schema API fallbacks\n- Ready for SQL migration in Supabase"',
    {
      cwd: projectRoot,
      stdio: 'inherit',
    }
  );

  // Push
  console.log('\n🚀 Pushing to master...');
  execSync('git push origin master', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  console.log('\n✨ Deployment complete! Netlify will auto-deploy.\n');
  console.log('📋 Next steps:');
  console.log('1. Run CRITICAL_DB_FIX_RUN_NOW.sql in Supabase SQL Editor');
  console.log('2. Test messages, location, and verification');
  console.log('3. Check Netlify deployment status\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
