"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/Client";

import { calculateRiskScore } from "@/utils/riskEngine";

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

  // 3. Trigger risk engine to recalculate risk score for this student based on new grades
  const targetId = existing?.id || (await supabase.from("students").select("id").eq("user_id", studentUserId).single()).data?.id;
  if (targetId) {
    try {
      await calculateRiskScore(targetId);
    } catch (e) {
      console.error("Failed to automatically update risk score", e);
    }
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

  // 1. We need the student_id to run the risk engine
  const { data: asg } = await supabase.from("student_assignments").select("student_id").eq("id", assignmentId).single();
  if (asg?.student_id) {
    try {
      await calculateRiskScore(asg.student_id);
    } catch(e) {
      console.error("Risk score update failed after toggle", e);
    }
  }

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

// ── createBulkAssignment ──────────────────────────────────────────────────────
/**
 * Teacher: creates an assignment for ALL active students using the master record mapping.
 */
export async function createBulkAssignment(
  teacherUserId: string,
  title: string,
  dueDate: string
) {
  // 1. Fetch teacher's specialty
  const { data: teacher, error: teacherErr } = await supabase
    .from("users")
    .select("subject_specialty")
    .eq("id", teacherUserId)
    .single();

  if (teacherErr || !teacher) throw new Error("Could not verify teacher identity.");
  const specialty = (teacher.subject_specialty ?? "General").toLowerCase().trim();

  // 2. Fetch all valid student DB rows
  const { data: students, error: stdErr } = await supabase
    .from("students")
    .select("id");
    
  if (stdErr) throw new Error("Failed to fetch students list: " + stdErr.message);
  if (!students || students.length === 0) throw new Error("No active students found in the database to broadcast to.");

  // 3. Step B: Insert Master Record
  const { data: newAsg, error: asgErr } = await supabase
    .from("assignments")
    .insert({
      teacher_id: teacherUserId,
      subject_name: specialty,
      assignment_title: title,
      due_date: dueDate
    })
    .select("id")
    .single();

  if (asgErr) throw new Error("Could not create master assignment: " + asgErr.message);

  // 4. Step C/D: Broadcast to student_assignments using assignment_id mapping
  const payload = students.map((s) => ({
    assignment_id: newAsg.id,
    student_id: s.id,
    is_completed: false,
  }));

  // Bulk Insert
  const { error: insertErr } = await supabase
    .from("student_assignments")
    .insert(payload);

  if (insertErr) throw new Error("Broadcast failed: " + insertErr.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
  
  return { count: payload.length };
}

// ── getStudentAssignments ─────────────────────────────────────────────────────
/**
 * Fetches all assignments for a given student assigned specifically by this teacher.
 */
export async function getStudentAssignments(studentUserId: string, teacherUserId: string) {
  const { data: existing } = await supabase.from("students").select("id").eq("user_id", studentUserId).single();
  if (!existing) return []; // no student row means no assignments possible

  const { data, error } = await supabase
    .from("student_assignments")
    .select(`
      id,
      is_completed,
      student_reason,
      assignments!inner (
        id,
        assignment_title,
        subject_name,
        due_date,
        teacher_id
      )
    `)
    .eq("student_id", existing.id)
    .eq("assignments.teacher_id", teacherUserId);

  if (error) throw new Error(error.message);
  
  return (data || []).map((a: any) => ({
    id: a.id,
    is_completed: a.is_completed,
    student_reason: a.student_reason,
    assignment_title: a.assignments?.assignment_title || 'Untitled',
    subject: a.assignments?.subject_name || 'General',
    due_date: a.assignments?.due_date || 'N/A'
  })).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
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
