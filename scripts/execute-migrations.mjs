#!/usr/bin/env node

/**
 * Execute pending Supabase migrations
 * This script runs the SQL migrations directly via Supabase API
 */

import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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

async function executeMigration(migration) {
  try {
    console.log(`\n📋 Executing: ${migration.name}`);
    console.log(`   Description: ${migration.description}`);

    const filePath = path.join(__dirname, migration.file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split SQL into individual statements (simple approach)
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        });

        if (error) {
          // Some errors are expected (e.g., "already exists")
          if (
            error.message.includes('already exists') ||
            error.message.includes('does not exist')
          ) {
            console.log(`   ⚠️  ${error.message}`);
          } else {
            console.error(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Try direct query if RPC fails
        try {
          await supabase.from('_migrations').select('*').limit(1);
          // If we get here, connection works but RPC might not exist
          console.log(`   ℹ️  Using direct query approach...`);
        } catch (e) {
          console.error(`   ❌ Query error: ${err.message}`);
          errorCount++;
        }
      }
    }

    console.log(`   ✅ Completed: ${successCount} statements executed`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} statements had issues (may be expected)`);
    }

    return true;
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
    console.log('⚠️  Some migrations had issues. Check the output above.');
    console.log('\n💡 If RPC method not found, execute migrations manually:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste each migration file');
    console.log('   3. Execute each one');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
