#!/usr/bin/env node

/**
 * Manual Vercel Deployment Trigger
 * This script manually triggers a Vercel deployment when webhooks aren't working
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || '';

if (!VERCEL_TOKEN) {
  console.error('❌ ERROR: VERCEL_TOKEN environment variable not set');
  console.error('');
  console.error('To fix this:');
  console.error('1. Go to https://vercel.com/account/tokens');
  console.error('2. Create a new token');
  console.error('3. Set it in your environment: export VERCEL_TOKEN="your_token_here"');
  console.error('');
  console.error('Or add to .env.local:');
  console.error('VERCEL_TOKEN=your_token_here');
  process.exit(1);
}

if (!VERCEL_PROJECT_ID) {
  console.error('❌ ERROR: VERCEL_PROJECT_ID environment variable not set');
  console.error('');
  console.error('To find your project ID:');
  console.error('1. Go to https://vercel.com/dashboard');
  console.error('2. Click on your project');
  console.error('3. Go to Settings > General');
  console.error('4. Copy the Project ID');
  console.error('');
  console.error('Then set it: export VERCEL_PROJECT_ID="your_project_id"');
  process.exit(1);
}

async function triggerDeployment() {
  try {
    console.log('🚀 Triggering manual Vercel deployment...');
    console.log(`📦 Project ID: ${VERCEL_PROJECT_ID}`);
    console.log(`👤 Team ID: ${VERCEL_TEAM_ID || 'personal'}`);
    console.log('');

    const url = `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'braidme',
        gitSource: {
          type: 'github',
          repo: 'faithinspire/B',
          ref: 'master',
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Deployment triggered successfully!');
      console.log('');
      console.log('📊 Deployment Details:');
      console.log(`   URL: ${data.url}`);
      console.log(`   Status: ${data.state}`);
      console.log(`   Created: ${new Date(data.createdAt).toLocaleString()}`);
      console.log('');
      console.log('🔗 View deployment:');
      console.log(`   https://vercel.com/dashboard/deployments/${data.id}`);
      console.log('');
      console.log('⏳ Deployment is now in progress. Check the dashboard for status.');
    } else {
      console.error('❌ Failed to trigger deployment');
      console.error('');
      console.error('Error details:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.error?.code === 'INVALID_TOKEN') {
        console.error('');
        console.error('💡 Your VERCEL_TOKEN might be invalid or expired.');
        console.error('   Generate a new one at: https://vercel.com/account/tokens');
      }
    }
  } catch (error) {
    console.error('❌ Error triggering deployment:');
    console.error(error.message);
    process.exit(1);
  }
}

triggerDeployment();
