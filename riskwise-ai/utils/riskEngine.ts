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
export async function calculateRiskScore(studentId: string): Promise<RiskResult> {
  let score = 0;
  const reasons: string[] = [];

  // 1. Fetch academic records to calculate average attendance and marks
  const { data: records, error: recordsError } = await supabase
    .from("academic_records")
    .select("attendance_percentage, internal_marks")
    .eq("student_id", studentId);

  if (recordsError) throw new Error("Failed to fetch academic records");

  if (records && records.length > 0) {
    let totalAttendance = 0;
    let totalMarks = 0;

    records.forEach((r) => {
      totalAttendance += r.attendance_percentage;
      totalMarks += r.internal_marks;
    });

    const avgAttendance = totalAttendance / records.length;
    const avgMarks = totalMarks / records.length;

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

  // 2. Fetch assignments to check for overdue/pending statuses
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("status, due_date")
    .eq("student_id", studentId)
    .eq("status", "PENDING");

  if (assignmentsError) throw new Error("Failed to fetch assignments");

  if (assignments && assignments.length > 0) {
    const now = new Date();
    let pastDueCount = 0;

    assignments.forEach((assignment) => {
      const dueDate = new Date(assignment.due_date);
      if (dueDate < now) {
        pastDueCount++;
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

  // If score is high but no records found
  if (score === 0 && (!records || records.length === 0)) {
    reasons.push("No academic data is currently available for evaluation.");
  } else if (score === 0) {
    reasons.push("Student is performing well with no notable risk factors.");
  }

  // Optional: Update the student's risk profile in the database transparently
  await supabase
    .from("students")
    .update({
      current_risk_score: score,
      risk_category: category,
      top_risk_reasons: reasons.join(" | ")
    })
    .eq("id", studentId);

  return { score, category, reasons };
}
