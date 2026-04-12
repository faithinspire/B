import { execSync } from 'child_process';

try {
  console.log('Staging changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Rebuild admin pages with enhanced error handling and logging"', { stdio: 'inherit' });
  
  console.log('Pushing to master...');
  execSync('git push origin master', { stdio: 'inherit' });
  
  console.log('✅ Commit and push successful!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
