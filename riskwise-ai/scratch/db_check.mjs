import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from("student_assignments").select("*").limit(1);
  if (error) {
    console.error("Error fetching student_assignments:", error.message);
  } else {
    console.log("student_assignments columns:");
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log("Table is empty, cannot infer columns from data.");
    }
  }

  // Also check students table columns
  const { data: sData, error: sErr } = await supabase.from("students").select("*").limit(1);
  if (sErr) console.error("Error fetching students:", sErr.message);
  else if (sData.length > 0) console.log("students columns:", Object.keys(sData[0]));
}

check();
