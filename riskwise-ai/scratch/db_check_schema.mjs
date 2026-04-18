import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  // Postgrest allows querying information_schema if permissions allow, or we can just try to insert and see the error.
  // We already saw the error. Let's try to query the columns by fetching the swagger JSON if it's public.
  // Actually, we can just fetch the swagger endpoint directly or ping the API.
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    const swagger = await res.json();
    const tableDef = swagger?.definitions?.student_assignments;
    console.log('Swagger Table Def:', tableDef?.properties ? Object.keys(tableDef.properties) : 'Not found');
  } catch (e) {
    console.error('Error fetching swagger:', e);
  }
}

checkColumns();
