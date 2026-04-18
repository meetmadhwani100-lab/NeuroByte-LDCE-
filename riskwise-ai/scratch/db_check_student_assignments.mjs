import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('student_assignments')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching student_assignments:', error);
  } else {
    console.log('Successfully fetched student_assignments.');
    if (data.length > 0) {
      console.log('Columns in first row:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, cannot infer columns from data.');
      // Try deliberately failing on a dummy column to get the hinted schema if possible
      const { error: err2 } = await supabase.from('student_assignments').select('non_existent_col').limit(1);
      console.log('Error output to see if it lists columns:', err2);
    }
  }
}

checkSchema();
