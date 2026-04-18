import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: users, error: uErr } = await supabase.from('users').select('*').limit(1);
  console.log("Users schematic columns:", users ? Object.keys(users[0]) : uErr);
  
  const { data: students, error: sErr } = await supabase.from('students').select('*').limit(1);
  console.log("Students schematic columns:", students ? Object.keys(students[0]) : sErr);
}

checkSchema();
