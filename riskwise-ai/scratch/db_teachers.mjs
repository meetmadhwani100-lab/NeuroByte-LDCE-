import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUsers() {
  const { data, error } = await supabase.from("users").select("id, email, full_name, role, subject_specialty").eq("role", "TEACHER");
  if (error) {
    console.error("Error fetching users:", error.message);
  } else {
    console.log("Teacher users:");
    console.table(data);
  }
}

checkUsers();
