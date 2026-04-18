import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching assignments:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in assignments:', Object.keys(data[0]));
  } else {
    // Try inserting a dummy row
    const { data: d2, error: e2 } = await supabase.from('assignments').insert({}).select('*');
    if (d2 && d2.length > 0) console.log('Columns via insert:', Object.keys(d2[0]));
    else console.error('Insert error details:', e2);
  }
}

checkSchema();
