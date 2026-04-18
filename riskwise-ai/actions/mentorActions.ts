"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/Client";

// ── getAssignedStudents ───────────────────────────────────────────────────────
/**
 * Returns all users with role=STUDENT for the mentor list sidebar.
 */
export async function getAssignedStudents(_mentorId: string) {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "STUDENT");

  if (error) throw new Error(error.message);

  return (users ?? []).map(u => ({
    id: u.id,
    studentName: u.full_name || u.email || "Unknown Student",
    email: u.email,
  }));
}

// ── getStudentDetails ─────────────────────────────────────────────────────────
/**
 * Full student profile for mentor: all subject marks/attendance,
 * general_feedback, student_assignments (with student_reason), and interventions.
 * Pass the student's auth user ID (from users table).
 */
export async function getStudentDetails(studentUserId: string) {
  const { data: student, error } = await supabase
    .from("students")
    .select(`
      id,
      current_risk_score,
      risk_category,
      top_risk_reasons,
      general_feedback,
      math_marks, math_attendance,
      physics_marks, physics_attendance,
      cs_marks, cs_attendance,
      english_marks, english_attendance,
      biology_marks, biology_attendance,
      student_assignments (
        id,
        assignment_title,
        subject,
        due_date,
        is_completed,
        student_reason
      ),
      interventions (
        id,
        session_date,
        status,
        mentor_feedback,
        pre_intervention_score
      )
    `)
    .eq("user_id", studentUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return student;
}

// ── logIntervention ───────────────────────────────────────────────────────────
/**
 * Mentor: logs a completed intervention session.
 */
export async function logIntervention(
  studentDbId: string,
  mentorId: string,
  feedback: string,
  date: string,
  preScore: number
) {
  const { data, error } = await supabase
    .from("interventions")
    .insert([
      {
        student_id: studentDbId,
        mentor_id: mentorId,
        mentor_feedback: feedback,
        session_date: date,
        status: "COMPLETED",
        pre_intervention_score: preScore,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");

  return data;
}
