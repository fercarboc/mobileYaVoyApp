
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewqnrcnsqtzkfavojeon.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cW5yY25zcXR6a2Zhdm9qZW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODA4NTksImV4cCI6MjA3NzY1Njg1OX0._A6uFllr5wzeVJoN7fVp7QRwj7rywDfFntL8BpUhF_s';

export const supabase = createClient(supabaseUrl, supabaseKey);
