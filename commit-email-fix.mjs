#!/usr/bin/env node

/**
 * Commit script for email system hybrid fix
 * Commits the updated forgot-password endpoint with Supabase + Brevo hybrid delivery
 */

import { execSync } from 'child_process';

console.log('🚀 Committing email system hybrid fix...\n');

try {
  // Stage the changes
  console.log('📝 Staging changes...');
  execSync('git add app/api/auth/forgot-password/route.ts', { stdio: 'inherit' });

  // Commit
  console.log('\n💾 Committing...');
  execSync('git commit -m "Fix: Implement hybrid email delivery - Supabase primary + Brevo fallback for password reset"', { stdio: 'inherit' });

  // Push
  console.log('\n🚀 Pushing to origin/master...');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('\n✅ SUCCESS! Changes committed and pushed to origin/master');
  console.log('⏳ Vercel deployment will start automatically (5-10 minutes)');
  console.log('\n📋 Next steps:');
  console.log('1. Wait for Vercel deployment to complete');
  console.log('2. Go to /forgot-password');
  console.log('3. Test password reset with multiple users');
  console.log('4. Verify all users receive emails');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
