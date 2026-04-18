"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/Client";

// ── Subject → column name mapping ─────────────────────────────────────────────
// Extend this map if you add more subjects to the schema.
const SUBJECT_MAP: Record<string, { marks: string; attendance: string }> = {
  math:    { marks: "math_marks",    attendance: "math_attendance" },
  physics: { marks: "physics_marks", attendance: "physics_attendance" },
  cs:      { marks: "cs_marks",      attendance: "cs_attendance" },
  english: { marks: "english_marks", attendance: "english_attendance" },
  biology: { marks: "biology_marks", attendance: "biology_attendance" },
};

// ── updateStudentSubjectData ───────────────────────────────────────────────────
/**
 * SECURITY-FIRST: Reads the calling teacher's subject_specialty from the users
 * table to determine which columns to update. The teacher never selects the
 * subject — the DB decides based on their account.
 */
export async function updateStudentSubjectData(
  teacherUserId: string,
  studentUserId: string,
  marks: number,
  attendance: number
) {
  // 1. Fetch teacher's subject_specialty
  const { data: teacher, error: teacherErr } = await supabase
    .from("users")
    .select("subject_specialty")
    .eq("id", teacherUserId)
    .single();

  if (teacherErr || !teacher) throw new Error("Could not verify teacher identity.");

  const specialty = (teacher.subject_specialty ?? "").toLowerCase().trim();
  const cols = SUBJECT_MAP[specialty];

  if (!cols) {
    throw new Error(
      `Teacher's subject_specialty "${specialty}" is not mapped. ` +
      `Valid values: ${Object.keys(SUBJECT_MAP).join(", ")}.`
    );
  }

  // 2. THE SMART GET-OR-CREATE
  // Because 'user_id' lacks a UNIQUE constraint in the hosted DB, 'upsert' fails.
  // We manually check for existence, then update or insert.
  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", studentUserId)
    .single();

  if (existing) {
    const { error: updateErr } = await supabase
      .from("students")
      .update({ [cols.marks]: marks, [cols.attendance]: attendance })
      .eq("id", existing.id);
    if (updateErr) throw new Error(updateErr.message);
  } else {
    const { error: insertErr } = await supabase
      .from("students")
      .insert({
        user_id: studentUserId,
        [cols.marks]: marks,
        [cols.attendance]: attendance,
      });
    if (insertErr) throw new Error(insertErr.message);
  }

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
}

// ── toggleAssignmentStatus ────────────────────────────────────────────────────
/**
 * Teacher: flips the is_completed flag on a student_assignments row.
 */
export async function toggleAssignmentStatus(
  assignmentId: string,
  isCompleted: boolean
) {
  const { error } = await supabase
    .from("student_assignments")
    .update({ is_completed: isCompleted })
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
}

// ── createAssignment ──────────────────────────────────────────────────────────
/**
 * Teacher: creates a new assignment row for a student.
 */
export async function createAssignment(
  teacherUserId: string,
  studentUserId: string,
  title: string,
  dueDate: string
) {
  // Derive subject label from teacher's specialty
  const { data: teacher } = await supabase
    .from("users")
    .select("subject_specialty")
    .eq("id", teacherUserId)
    .single();

  const specialty = teacher?.subject_specialty ?? "General";

  // Get or Create student row to get DB ID
  let internalStudentId = null;
  const { data: existing } = await supabase.from("students").select("id").eq("user_id", studentUserId).single();
  
  if (existing) {
    internalStudentId = existing.id;
  } else {
    const { data: newRow, error: insErr } = await supabase
      .from("students")
      .insert({ user_id: studentUserId })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    internalStudentId = newRow.id;
  }

  const { error } = await supabase.from("student_assignments").insert({
    student_id: internalStudentId,
    assignment_title: title,
    subject: specialty,
    due_date: dueDate,
    is_completed: false,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
}

// ── getStudentAssignments ─────────────────────────────────────────────────────
/**
 * Fetches all assignments for a given student DB ID.
 */
export async function getStudentAssignments(studentUserId: string) {
  const { data: existing } = await supabase.from("students").select("id").eq("user_id", studentUserId).single();
  if (!existing) return []; // no student row means no assignments possible

  const { data, error } = await supabase
    .from("student_assignments")
    .select("id, assignment_title, subject, due_date, is_completed, student_reason")
    .eq("student_id", existing.id)
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Backwards compat: keep old updateAcademicRecord ───────────────────────────
export async function updateAcademicRecord(
  studentId: string,
  subjectId: string,
  attendance: number,
  marks: number
) {
  const { data, error } = await supabase
    .from("academic_records")
    .upsert(
      {
        student_id: studentId,
        subject_id: subjectId,
        attendance_percentage: attendance,
        internal_marks: marks,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "student_id, subject_id" }
    )
    .select();

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
  return data;
}
