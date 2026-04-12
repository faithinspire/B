import { execSync } from 'child_process';

try {
  console.log('🔧 Staging all changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log('📝 Committing changes...');
  execSync('git commit -m "Fix: Complete rebuild of admin pages - conversations, users, verification with proper schema alignment"', { stdio: 'inherit' });
  
  console.log('🚀 Pushing to master...');
  execSync('git push origin master', { stdio: 'inherit' });
  
  console.log('✅ SUCCESS! All changes committed and pushed to production');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
