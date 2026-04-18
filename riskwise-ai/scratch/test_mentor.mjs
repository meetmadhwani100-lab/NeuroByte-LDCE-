import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data: users } = await supabase.from('users').select('*').eq('role', 'STUDENT');
  const ananya = users.find(u => u.full_name === 'Ananya Sharma' || u.email.includes('ananya'));
  
  if (!ananya) {
      console.log('Ananya not found in users table?');
      return;
  }

  console.log(`Ananya user_id: ${ananya.id}`);

  const { data: student, error } = await supabase
    .from("students")
    .select(`
      *,
      student_assignments (
        id,
        is_completed,
        student_reason,
        assignments (
          id,
          assignment_title,
          subject_name,
          due_date
        )
      ),
      interventions (
        id,
        session_date,
        status,
        mentor_feedback
      )
    `)
    .eq("user_id", ananya.id)
    .single();

  if (error) {
    console.error("fetch failed with:", error);
  } else {
    console.log("fetch succeeded:", student.id);
  }
}

testFetch();
