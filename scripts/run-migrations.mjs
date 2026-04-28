#!/usr/bin/env node

/**
 * Execute Supabase migrations via REST API
 * This script reads SQL files and executes them directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Migrations to execute in order
const migrations = [
  {
    name: 'FIX_BRAIDER_SIGNUP_RACE_CONDITION',
    file: '../supabase/migrations/FIX_BRAIDER_SIGNUP_RACE_CONDITION.sql',
    description: 'Remove braider profile validation trigger causing race condition',
  },
  {
    name: 'FINAL_COMPLETE_FIX',
    file: '../supabase/migrations/FINAL_COMPLETE_FIX.sql',
    description: 'Add missing columns, disable RLS, grant permissions',
  },
];

async function executeSql(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function executeMigration(migration) {
  try {
    console.log(`\n📋 Executing: ${migration.name}`);
    console.log(`   Description: ${migration.description}`);

    const filePath = path.join(__dirname, migration.file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Execute the entire SQL file as one transaction
    const result = await executeSql(sql);

    if (result.success) {
      console.log(`   ✅ Migration executed successfully`);
      return true;
    } else {
      console.error(`   ❌ Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Migration failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase migrations...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await executeMigration(migration);
    if (!success) {
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allSuccess) {
    console.log('✅ All migrations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test braider signup');
    console.log('   2. Verify database schema');
    console.log('   3. Test payment flow');
  } else {
    console.log('⚠️  Some migrations had issues.');
    console.log('\n💡 Manual execution instructions:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste each migration file');
    console.log('   3. Execute each one');
    console.log('\n📂 Migration files:');
    for (const migration of migrations) {
      console.log(`   - ${migration.file}`);
    }
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
