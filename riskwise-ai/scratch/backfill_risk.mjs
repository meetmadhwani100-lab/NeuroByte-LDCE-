import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: students, error } = await supabase.from('students').select('id');
  if (students) {
    for (const student of students) {
        // Just dummy-triggering a push to the server endpoint
        await fetch(`http://localhost:3000/api/calculate-risk?studentId=${student.id}`);
        // wait we don't have this API route. 
    }
  }
}

// Since I am in node script context outside NextJS, I can't easily import utils/riskEngine.ts because of aliasing.
// Let's just execute a quick logic locally.
async function backfill() {
  const { data: students } = await supabase.from('students').select('*');
  
  for (const student of students) {
      let score = 0;
      let totalAttendance = 0;
      let totalMarks = 0;
      let subjectsCount = 0;
      const reasons = [];

      const subjects = ["math", "physics", "cs", "english", "biology"];
      subjects.forEach((sub) => {
        const marks = student[`${sub}_marks`];
        const att = student[`${sub}_attendance`];
        
        if (marks !== null && att !== null) {
          if (Number(marks) > 0 || Number(att) > 0) {
            totalAttendance += Number(att);
            totalMarks += Number(marks);
            subjectsCount++;
          }
        }
      });

      if (subjectsCount > 0) {
        const avgAttendance = totalAttendance / subjectsCount;
        const avgMarks = totalMarks / subjectsCount;

        if (avgAttendance < 60) {
          score += 50;
          reasons.push(`Critical: Average attendance is severely low (${Math.round(avgAttendance)}%).`);
        } else if (avgAttendance < 75) {
          score += 30;
          reasons.push(`Warning: Average attendance is below 75% (${Math.round(avgAttendance)}%).`);
        }

        if (avgMarks < 40) {
          score += 20;
          reasons.push(`Warning: Overall internal marks average is failing (${Math.round(avgMarks)}%).`);
        }
      }
      
      const { data: assignments } = await supabase
        .from("student_assignments")
        .select(`is_completed, assignments!inner ( due_date )`)
        .eq("student_id", student.id)
        .eq("is_completed", false);
        
      if (assignments && assignments.length > 0) {
        const now = new Date();
        let pastDueCount = 0;
        assignments.forEach((a) => {
          if (a.assignments?.due_date) {
            const dueDate = new Date(a.assignments.due_date);
            if (dueDate < now) pastDueCount++;
          }
        });
        if (pastDueCount > 0) {
          score += (pastDueCount * 10);
          reasons.push(`Action Required: ${pastDueCount} pending assignments are past their due date.`);
        }
      }

      if (score > 100) score = 100;

      let category = "Low";
      if (score > 70) category = "High";
      else if (score >= 40) category = "Medium";

      if (score === 0 && subjectsCount === 0 && (!assignments || assignments.length === 0)) {
        reasons.push("No academic data is currently available for evaluation.");
      } else if (score === 0) {
        reasons.push("Student is performing well with no notable risk factors.");
      }

      await supabase.from("students").update({
        current_risk_score: score,
        risk_category: category,
        top_risk_reasons: reasons.join(" | ")
      }).eq("id", student.id);
      
      await supabase.from("risk_history").insert([{
        student_id: student.id,
        risk_score: score,
        recorded_date: new Date().toISOString()
      }]);
      
      console.log(`Updated ${student.id} -> ${score} & logged to risk history`);
  }
}

backfill();
