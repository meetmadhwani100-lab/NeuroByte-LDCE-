"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, ShieldCheck, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, GraduationCap, Bell, ClipboardList, BarChart3,
  PlusCircle, Square, CheckSquare2, Users, BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/Client";
import {
  updateStudentSubjectData,
  getStudentAssignments,
  toggleAssignmentStatus,
  createAssignment,
} from "@/actions/teacherActions";

type Assignment = {
  id: string;
  assignment_title: string;
  subject: string | null;
  due_date: string;
  is_completed: boolean;
  student_reason: string | null;
};

type DbStudent = {
  id: string;          // users.id (auth UID)
  dbId: string | null; // students.id (PK)
  studentName: string;
  email: string;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teacherUserId, setTeacherUserId] = useState("");
  const [teacherName, setTeacherName] = useState("Teacher");
  const [specialty, setSpecialty] = useState<string | null>(null); // e.g. "math"

  // students
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<DbStudent | null>(null);

  // form
  const [marks, setMarks] = useState("");
  const [attendance, setAttendance] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // assignments
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [asgLoading, setAsgLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // add assignment
  const [showAddAsg, setShowAddAsg] = useState(false);
  const [newAsgTitle, setNewAsgTitle] = useState("");
  const [newAsgDue, setNewAsgDue] = useState("");
  const [addAsgLoading, setAddAsgLoading] = useState(false);

  // ── Bouncer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: userData } = await supabase
        .from("users")
        .select("role, full_name, subject_specialty")
        .eq("id", session.user.id)
        .single();

      if (userData?.role !== "TEACHER") { router.push("/login"); return; }

      setTeacherUserId(session.user.id);
      setTeacherName(userData?.full_name || "Teacher");
      setSpecialty(userData?.subject_specialty ?? null);

      // Fetch all STUDENT users + their students.id
      const { data: studentUsers } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "STUDENT");

      if (studentUsers) {
        // For each student user, also look up their students row id
        const enriched: DbStudent[] = await Promise.all(
          studentUsers.map(async u => {
            const { data: sRow } = await supabase
              .from("students")
              .select("id")
              .eq("user_id", u.id)
              .single();
            return {
              id: u.id,
              dbId: sRow?.id ?? null,
              studentName: u.full_name || u.email,
              email: u.email,
            };
          })
        );
        setStudents(enriched);
      }

      setIsAuthorized(true);
    };
    run();
  }, [router]);

  // ── Load assignments ───────────────────────────────────────────────────────
  const loadAssignments = useCallback(async (dbId: string) => {
    setAsgLoading(true);
    try {
      const data = await getStudentAssignments(dbId);
      setAssignments(data as Assignment[]);
    } finally {
      setAsgLoading(false);
    }
  }, []);

  const handleSelectStudent = (s: DbStudent) => {
    setSelectedStudent(s);
    setMarks(""); setAttendance("");
    setFormSuccess(false); setFormError(null);
    setAssignments([]);
    loadAssignments(s.id);
  };

  // ── Submit marks ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    if (!specialty) {
      setFormError("Your account has no subject_specialty set. Ask your coordinator to update it in Supabase.");
      return;
    }
    const m = parseFloat(marks), a = parseFloat(attendance);
    if (isNaN(m) || m < 0 || m > 100) { setFormError("Marks must be 0–100."); return; }
    if (isNaN(a) || a < 0 || a > 100) { setFormError("Attendance must be 0–100."); return; }

    setFormLoading(true); setFormSuccess(false); setFormError(null);
    try {
      await updateStudentSubjectData(teacherUserId, selectedStudent.id, m, a);
      setFormSuccess(true); setMarks(""); setAttendance("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Toggle assignment ──────────────────────────────────────────────────────
  const handleToggle = async (asg: Assignment) => {
    setToggleLoading(asg.id);
    try {
      await toggleAssignmentStatus(asg.id, !asg.is_completed);
      setAssignments(prev => prev.map(a => a.id === asg.id ? { ...a, is_completed: !a.is_completed } : a));
    } finally {
      setToggleLoading(null);
    }
  };

  // ── Add assignment ─────────────────────────────────────────────────────────
  const handleAddAsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newAsgTitle.trim() || !newAsgDue) return;
    setAddAsgLoading(true);
    try {
      await createAssignment(teacherUserId, selectedStudent.id, newAsgTitle.trim(), newAsgDue);
      setNewAsgTitle(""); setNewAsgDue(""); setShowAddAsg(false);
      await loadAssignments(selectedStudent.id);
    } finally {
      setAddAsgLoading(false);
    }
  };

  if (!isAuthorized) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Verifying secure access...</div>;
  }

  const now = new Date();
  const specialtyLabel = specialty ? specialty.toUpperCase() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-amber-200">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-sm text-slate-500 font-medium">Teacher Portal</span>
          </div>
          <div className="flex items-center gap-3">
            {specialtyLabel && (
              <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-200 rounded-xl px-3 py-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700">Assigned: {specialtyLabel}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-300 flex items-center justify-center text-white text-xs font-bold">
                {teacherName[0]}
              </div>
              <span className="text-sm font-semibold text-amber-700">{teacherName}</span>
            </div>
            <button onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* No specialty warning */}
      {!specialty && (
        <div className="max-w-screen-xl mx-auto px-6 pt-4 w-full">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-2xl px-5 py-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Subject specialty not set on your account.</p>
              <p className="mt-0.5">Go to <strong>Supabase → users table</strong> and set the <code className="bg-amber-100 px-1 rounded">subject_specialty</code> column for your user to one of: <code className="bg-amber-100 px-1 rounded">math, physics, cs, english, biology</code>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Two-pane layout */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full overflow-hidden">

        {/* LEFT: Student list */}
        <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-amber-500" /> Your Students
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {students.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No students found.</div>
            ) : students.map(s => (
              <button key={s.id} onClick={() => handleSelectStudent(s)}
                className={`w-full text-left px-4 py-3.5 hover:bg-amber-50 transition-all ${selectedStudent?.id === s.id ? "bg-amber-50 border-l-4 border-amber-400" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {s.studentName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{s.studentName}</p>
                    <p className="text-xs text-slate-400 truncate">{s.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT: Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a student from the sidebar to enter their records.</p>
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{selectedStudent.studentName}</h1>
                <p className="text-sm text-slate-400">{selectedStudent.email}</p>
              </div>

              {/* Marks & Attendance Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Enter Academic Record</h2>
                    <p className="text-xs text-slate-400">
                      Updating: <strong className="text-amber-600">{specialtyLabel ?? "No Subject Set"}</strong> columns
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Internal Marks (%)
                      </label>
                      <input
                        type="number" min={0} max={100} placeholder="0–100"
                        value={marks} onChange={e => { setMarks(e.target.value); setFormSuccess(false); setFormError(null); }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Attendance (%)
                      </label>
                      <input
                        type="number" min={0} max={100} placeholder="0–100"
                        value={attendance} onChange={e => { setAttendance(e.target.value); setFormSuccess(false); setFormError(null); }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={formLoading || !specialty}
                    className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98]">
                    {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Bell className="w-4 h-4" />Submit &amp; Notify Parents</>}
                  </button>

                  {formSuccess && (
                    <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-3.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Saved to database!</p>
                        <p className="text-xs text-teal-600 mt-0.5">Updated <strong>{specialty}_marks</strong> and <strong>{specialty}_attendance</strong> for {selectedStudent.studentName}.</p>
                      </div>
                    </div>
                  )}
                  {formError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3.5 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{formError}</p>
                    </div>
                  )}
                </form>
              </div>

              {/* Assignments Panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800">Assignments</h2>
                      <p className="text-xs text-slate-400">Toggle completion, add new tasks</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddAsg(v => !v)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all">
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>

                {showAddAsg && (
                  <form onSubmit={handleAddAsg}
                    className="px-6 py-4 border-b border-slate-100 bg-indigo-50/40 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-40">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
                      <input value={newAsgTitle} onChange={e => setNewAsgTitle(e.target.value)}
                        placeholder="Assignment title"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div className="w-40">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date</label>
                      <input type="date" value={newAsgDue} onChange={e => setNewAsgDue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <button type="submit" disabled={addAsgLoading}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-60">
                      {addAsgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />} Save
                    </button>
                  </form>
                )}

                <div className="divide-y divide-slate-100">
                  {asgLoading ? (
                    <div className="py-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-sm">No assignments. Click + Add to create one.</div>
                  ) : assignments.map(asg => {
                    const overdue = !asg.is_completed && new Date(asg.due_date) < now;
                    return (
                      <div key={asg.id} className={`flex items-start gap-4 px-6 py-4 ${overdue ? "bg-red-50/40" : ""}`}>
                        <button onClick={() => handleToggle(asg)} disabled={toggleLoading === asg.id}
                          className="shrink-0 mt-0.5 text-indigo-600 hover:text-indigo-800 transition-all">
                          {toggleLoading === asg.id
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : asg.is_completed
                              ? <CheckSquare2 className="w-5 h-5 text-teal-500" />
                              : <Square className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${asg.is_completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {asg.assignment_title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {asg.subject ?? specialty} · Due: {asg.due_date}
                            {overdue && <span className="ml-2 text-red-500 font-semibold">Overdue</span>}
                          </p>
                          {asg.student_reason && (
                            <p className="text-xs text-indigo-600 mt-1.5 italic bg-indigo-50 rounded-lg px-3 py-1.5">
                              💬 Student: &quot;{asg.student_reason}&quot;
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          asg.is_completed ? "bg-teal-100 text-teal-700" :
                          overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {asg.is_completed ? "Done" : overdue ? "Overdue" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hint card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" /> How the Write-Lock Works
                </h3>
                <p className="text-sm text-slate-500">
                  Your account&apos;s <code className="bg-slate-100 px-1 rounded text-xs">subject_specialty</code> is <strong className="text-amber-600">&quot;{specialty ?? "not set"}&quot;</strong>.
                  When you submit, the server reads this value and updates only <code className="bg-slate-100 px-1 rounded text-xs">{specialty ?? "?"}_marks</code> and <code className="bg-slate-100 px-1 rounded text-xs">{specialty ?? "?"}_attendance</code> — no other subject&apos;s data can be overwritten.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
