import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ewqnrcnsqtzkfavojeon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cW5yY25zcXR6a2Zhdm9qZW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODA4NTksImV4cCI6MjA3NzY1Njg1OX0._A6uFllr5wzeVJoN7fVp7QRwj7rywDfFntL8BpUhF_s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-my-custom-header': 'yavoy-mobile'
    }
  }
});
