// Test script to verify database connection and permissions
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ewqnrcnsqtzkfavojeon.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cW5yY25zcXR6a2Zhdm9qZW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODA4NTksImV4cCI6MjA3NzY1Njg1OX0._A6uFllr5wzeVJoN7fVp7QRwj7rywDfFntL8BpUhF_s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  // 1. Test SELECT on VoyUsers
  console.log('1️⃣ Testing SELECT on VoyUsers:');
  const { data: users, error: selectError } = await supabase
    .from('VoyUsers')
    .select('*')
    .limit(5);
  
  if (selectError) {
    console.error('❌ SELECT Error:', selectError);
  } else {
    console.log('✅ SELECT Success. Found users:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('   First user structure:', Object.keys(users[0]));
    }
  }

  // 2. Test user signup and profile creation
  console.log('\n2️⃣ Testing user signup:');
  const testEmail = `test${Date.now()}@test.com`;
  const testPassword = '123456';
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: 'Test User' }
    }
  });

  if (authError) {
    console.error('❌ Auth Signup Error:', authError);
  } else {
    console.log('✅ Auth Signup Success. User ID:', authData.user?.id);
    console.log('   Session exists:', !!authData.session);

    if (authData.user) {
      // 3. Test INSERT into VoyUsers
      console.log('\n3️⃣ Testing INSERT into VoyUsers:');
      const { data: profile, error: insertError } = await supabase
        .from('VoyUsers')
        .insert({
          auth_user_id: authData.user.id,
          full_name: 'Test User',
          email: testEmail,
          role: 'WORKER',
          city: 'Madrid'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ INSERT Error:', insertError);
        console.error('   Error details:', JSON.stringify(insertError, null, 2));
      } else {
        console.log('✅ INSERT Success. Profile created:', profile);
      }

      // Cleanup - delete test user from VoyUsers
      if (profile) {
        await supabase.from('VoyUsers').delete().eq('auth_user_id', authData.user.id);
        console.log('\n🧹 Cleanup: Test profile deleted');
      }
    }
  }

  console.log('\n✅ Database test completed!');
}

testDatabase().catch(console.error);
