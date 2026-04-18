"use server";

import { supabase } from "@/lib/Client";

export type RiskResult = {
  score: number;
  category: "Low" | "Medium" | "High";
  reasons: string[];
};

/**
 * Algorithm used to calculate the risk score fallback based on attendance, marks, and assignments.
 * Fetches data directly using the studentId.
 */
export async function calculateRiskScore(studentDbId: string): Promise<RiskResult> {
  let score = 0;
  const reasons: string[] = [];

  // 1. Fetch academic records directly from the students table (Flat schema)
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("math_marks, math_attendance, physics_marks, physics_attendance, cs_marks, cs_attendance, english_marks, english_attendance, biology_marks, biology_attendance")
    .eq("id", studentDbId)
    .single();

  if (studentError) {
    console.error("RiskEngine: Failed to fetch student records", studentError);
  }

  if (student) {
    let totalAttendance = 0;
    let totalMarks = 0;
    let subjectsCount = 0;

    const subjects = ["math", "physics", "cs", "english", "biology"];
    subjects.forEach((sub) => {
      const marks = student[`${sub}_marks` as keyof typeof student];
      const att = student[`${sub}_attendance` as keyof typeof student];
      
      // If the subject has actual data written to it
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

      // Apply attendance rules
      if (avgAttendance < 60) {
        score += 50;
        reasons.push(`Critical: Average attendance is severely low (${Math.round(avgAttendance)}%).`);
      } else if (avgAttendance < 75) {
        score += 30;
        reasons.push(`Warning: Average attendance is below 75% (${Math.round(avgAttendance)}%).`);
      }

      // Apply marks rules
      if (avgMarks < 40) {
        score += 20;
        reasons.push(`Warning: Overall internal marks average is failing (${Math.round(avgMarks)}%).`);
      }
    }
  }

  // 2. Fetch assignments to check for overdue statuses (Option B Relational Schema)
  const { data: assignments, error: assignmentsError } = await supabase
    .from("student_assignments")
    .select(`
      is_completed,
      assignments!inner (
        due_date
      )
    `)
    .eq("student_id", studentDbId)
    .eq("is_completed", false);

  if (assignmentsError) {
    console.error("RiskEngine: Failed to fetch assignments", assignmentsError);
  }

  if (assignments && assignments.length > 0) {
    const now = new Date();
    let pastDueCount = 0;

    assignments.forEach((a: any) => {
      if (a.assignments?.due_date) {
        const dueDate = new Date(a.assignments.due_date);
        if (dueDate < now) {
          pastDueCount++;
        }
      }
    });

    if (pastDueCount > 0) {
      score += (pastDueCount * 10);
      reasons.push(`Action Required: ${pastDueCount} pending assignments are past their due date.`);
    }
  }

  // Ensure score is capped at 100
  if (score > 100) score = 100;

  // Determine Category
  let category: "Low" | "Medium" | "High" = "Low";
  if (score > 70) {
    category = "High";
  } else if (score >= 40) {
    category = "Medium";
  }

  // Formatting empty state
  if (score === 0 && subjectsCount === 0 && (!assignments || assignments.length === 0)) {
    reasons.push("No academic data is currently available for evaluation.");
  } else if (score === 0) {
    reasons.push("Student is performing well with no notable risk factors.");
  }

  // 3. Update the student's risk profile in the database transparently
  await supabase
    .from("students")
    .update({
      current_risk_score: score,
      risk_category: category,
      top_risk_reasons: reasons.join(" | ")
    })
    .eq("id", studentDbId);

  // 4. Force-log this calculation into risk_history so the dashboard chart populates!
  await supabase
    .from("risk_history")
    .insert([{
      student_id: studentDbId,
      risk_score: score,
      recorded_date: new Date().toISOString()
    }]);

  return { score, category, reasons };
}
