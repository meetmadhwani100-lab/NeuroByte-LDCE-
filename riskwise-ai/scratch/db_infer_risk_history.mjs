import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('risk_history').select('*').limit(1);
  if (error) {
    console.error('Error fetching risk_history:', error);
  } else {
    console.log('risk_history exists! Sample data:', data);
  }
}

checkSchema();
