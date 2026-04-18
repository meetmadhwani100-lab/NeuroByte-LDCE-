import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // First, fetch ANY valid student ID
  const { data: stData } = await supabase.from('students').select('id').limit(1);
  if (!stData || stData.length === 0) {
      console.log('No students found to map to.');
      return;
  }
  
  const targetId = stData[0].id;
  
  // Try inserting an empty row (or just student_id) to see what returns
  const { data, error } = await supabase
    .from('student_assignments')
    .insert({ student_id: targetId })
    .select('*');

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted successfully! Schema columns:');
    console.log(Object.keys(data[0]));
    
    // Cleanup
    await supabase.from('student_assignments').delete().eq('id', data[0].id);
  }
}

checkSchema();
