#!/usr/bin/env node
/**
 * Diagnostic Script: Test Supabase Connection & Permissions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

console.log('🔍 Supabase Diagnostic\n');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_KEY.substring(0, 20)}...${SUPABASE_KEY.slice(-10)}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Test 1: List projects
  console.log('Test 1: SELECT from projects');
  const { data: projects, error: selectError } = await supabase
    .from('projects')
    .select('*');
  
  if (selectError) {
    console.error('❌ SELECT failed:', selectError);
  } else {
    console.log(`✅ SELECT works - found ${projects?.length || 0} projects`);
    if (projects && projects.length > 0) {
      console.log('   Existing projects:', projects.map(p => p.name).join(', '));
    }
  }
  
  // Test 2: Try insert
  console.log('\nTest 2: INSERT into projects');
  const testName = `test_${Date.now()}`;
  const { data: newProject, error: insertError } = await supabase
    .from('projects')
    .insert({ name: testName })
    .select();
  
  if (insertError) {
    console.error('❌ INSERT failed');
    console.error('   Code:', insertError.code);
    console.error('   Message:', insertError.message);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);
    console.error('   Full error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ INSERT works');
    console.log('   Created:', newProject);
    
    // Clean up test
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('name', testName);
    
    if (deleteError) {
      console.warn('⚠️  Could not delete test project:', deleteError.message);
    } else {
      console.log('   Cleaned up test project');
    }
  }
  
  // Test 3: Check if using anon key instead of service role
  console.log('\nTest 3: Key type check');
  if (SUPABASE_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    console.log('✅ Using JWT key (service role or anon)');
    
    // Decode JWT to check role
    try {
      const payload = JSON.parse(Buffer.from(SUPABASE_KEY.split('.')[1], 'base64').toString());
      console.log('   Role:', payload.role);
      
      if (payload.role !== 'service_role') {
        console.error('   ❌ NOT using service_role key!');
        console.error('   You need the SERVICE ROLE key, not the anon key');
        console.error('   Find it in: Supabase Dashboard → Settings → API → service_role key');
      } else {
        console.log('   ✅ Correct service_role key');
      }
    } catch (e) {
      console.error('   ❌ Could not decode JWT:', e);
    }
  } else {
    console.error('❌ Key does not look like a JWT');
  }
  
  // Test 4: Check RLS
  console.log('\nTest 4: RLS Status');
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('check_table_rls', { table_name: 'projects' })
    .single();
  
  if (rlsError) {
    console.log('   ℹ️  Could not check RLS (function may not exist)');
  } else {
    console.log('   RLS enabled:', rlsStatus);
  }
}

main().catch(console.error);
