#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function run(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    const output = execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    console.log(`✅ ${description} complete`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function deploy() {
  try {
    console.log('\n🚀 TASK 7: DEPLOYING TO MASTER & VERCEL\n');
    console.log('═'.repeat(60));

    // Stage all Task 7 files
    console.log('\n📝 STEP 1: STAGING FILES');
    console.log('─'.repeat(60));

    const filesToStage = [
      'app/(admin)/admin/verification/page.tsx',
      'DEPLOYMENT_GUIDE_COMPLETE_FINAL.md',
      'TASK_7_COMPLETE_SUMMARY.md',
      'IMMEDIATE_ACTION_CARD_TASK7.md',
      'TASK_7_VISUAL_SUMMARY.md',
      'GIT_COMMIT_INSTRUCTIONS.md',
      'TASK_7_FINAL_REPORT.md',
      'TASK_7_DOCUMENTATION_INDEX.md',
      'QUICK_START_TASK7.md',
      'TASK_7_READY_TO_DEPLOY.md',
      'scripts/commit-task7.mjs',
      'scripts/deploy-task7.mjs',
    ];

    for (const file of filesToStage) {
      run(`git add "${file}"`, `Staging ${file}`);
    }

    // Verify staged files
    console.log('\n📋 STEP 2: VERIFYING STAGED FILES');
    console.log('─'.repeat(60));
    run('git status', 'Checking git status');

    // Commit
    console.log('\n💾 STEP 3: COMMITTING TO MASTER');
    console.log('─'.repeat(60));

    const commitMessage = `Task 7: Admin verification page + messaging/location fixes complete

- Built admin verification page with pending braiders list
- Document previews (ID + selfie)
- Approve/reject functionality with real-time updates
- Real-time message subscriptions (replaces polling)
- Real-time location tracking (replaces polling)
- Dual-schema API fallbacks for backward compatibility
- 3-tier fallback for message insert
- 4-tier fallback for location retrieval
- Resilient conversation fetch (creates if not found)
- All pages responsive (mobile, tablet, desktop)
- Ready for SQL migration in Supabase

Files:
- app/(admin)/admin/verification/page.tsx (NEW)
- DEPLOYMENT_GUIDE_COMPLETE_FINAL.md (NEW)
- TASK_7_COMPLETE_SUMMARY.md (NEW)
- IMMEDIATE_ACTION_CARD_TASK7.md (NEW)
- TASK_7_VISUAL_SUMMARY.md (NEW)
- GIT_COMMIT_INSTRUCTIONS.md (NEW)
- TASK_7_FINAL_REPORT.md (NEW)
- TASK_7_DOCUMENTATION_INDEX.md (NEW)
- QUICK_START_TASK7.md (NEW)
- TASK_7_READY_TO_DEPLOY.md (NEW)
- scripts/commit-task7.mjs (NEW)
- scripts/deploy-task7.mjs (NEW)`;

    run(`git commit -m "${commitMessage}"`, 'Committing to master');

    // Push to master
    console.log('\n🌐 STEP 4: PUSHING TO MASTER');
    console.log('─'.repeat(60));
    run('git push origin master', 'Pushing to master branch');

    // Verify push
    console.log('\n✅ STEP 5: VERIFYING DEPLOYMENT');
    console.log('─'.repeat(60));
    run('git log --oneline -3', 'Showing recent commits');

    console.log('\n' + '═'.repeat(60));
    console.log('\n✨ DEPLOYMENT COMPLETE!\n');
    console.log('📊 Summary:');
    console.log('  ✅ Files staged');
    console.log('  ✅ Committed to master');
    console.log('  ✅ Pushed to GitHub');
    console.log('  ✅ Vercel auto-deploy triggered\n');

    console.log('📋 Next Steps:');
    console.log('  1. Check Vercel deployment status');
    console.log('  2. Run SQL migration in Supabase');
    console.log('  3. Test all features\n');

    console.log('🔗 Links:');
    console.log('  - Vercel: https://vercel.com/dashboard');
    console.log('  - GitHub: https://github.com/your-repo');
    console.log('  - Supabase: https://supabase.com/dashboard\n');

    console.log('📚 Documentation:');
    console.log('  - QUICK_START_TASK7.md');
    console.log('  - DEPLOYMENT_GUIDE_COMPLETE_FINAL.md');
    console.log('  - TASK_7_FINAL_REPORT.md\n');

    console.log('═'.repeat(60));
    console.log('Status: DEPLOYED TO MASTER ✅');
    console.log('═'.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check git is configured');
    console.error('  2. Check you have push access');
    console.error('  3. Check internet connection');
    console.error('  4. Try: git status\n');
    process.exit(1);
  }
}

deploy();
