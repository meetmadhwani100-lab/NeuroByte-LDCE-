"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, LogOut, ShieldCheck, Search, Save, CheckCircle2,
  BookOpen, Users, TrendingUp, Edit3,
} from "lucide-react";
import { allStudents, teachers, SUBJECTS } from "@/data/mock";
import { RiskBadge } from "@/components/RiskBadge";

const TEACHER = teachers[0]; // Prof. Anita Patel — Physics
const SUBJECT = TEACHER.subject;

type StudentEdit = {
  marks: number;
  attendance: number;
  edited: boolean;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState(SUBJECT);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [edits, setEdits] = useState<Record<string, StudentEdit>>({});

  const subjectStudents = allStudents
    .map((s) => ({
      ...s,
      subjectMarks: s.examMarks.find((m) => m.subject === selectedSubject),
    }))
    .filter((s) => s.subjectMarks)
    .sort((a, b) => b.overallRiskScore - a.overallRiskScore);

  const filteredStudents = subjectStudents.filter((s) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMarks = (studentId: string, original: number) =>
    edits[studentId]?.marks ?? original;

  const getAttendance = (studentId: string, original: number) =>
    edits[studentId]?.attendance ?? original;

  const handleEdit = (studentId: string, field: "marks" | "attendance", value: number) => {
    setEdits((prev) => ({
      ...prev,
      [studentId]: {
        marks: prev[studentId]?.marks ?? allStudents.find(s => s.id === studentId)?.examMarks.find(m => m.subject === selectedSubject)?.marks ?? 0,
        attendance: prev[studentId]?.attendance ?? allStudents.find(s => s.id === studentId)?.attendancePercentage ?? 0,
        ...prev[studentId],
        [field]: value,
        edited: true,
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    // Mark all as saved
    setEdits((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = { ...next[k], edited: false }));
      return next;
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const totalEdited = Object.values(edits).filter((e) => e.edited).length;
  const avgMarks = Math.round(
    filteredStudents.reduce((sum, s) => sum + getMarks(s.id, s.subjectMarks?.marks ?? 0), 0) / Math.max(filteredStudents.length, 1)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Subject Teacher Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-300 flex items-center justify-center text-white text-xs font-bold">
                {TEACHER.name.split(" ")[1]?.[0] ?? "T"}
              </div>
              <span className="text-sm font-medium text-amber-700">{TEACHER.name}</span>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subject Grade Management</h1>
            <p className="text-slate-500 text-sm mt-1">
              Update internal marks and attendance for your subject. Sorted by highest risk.
            </p>
          </div>
          {totalEdited > 0 && (
            <button
              id="save-changes-btn"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-amber-200 transition-all"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : saving ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : saving ? "Saving..." : `Save ${totalEdited} Changes`}
            </button>
          )}
        </div>

        {/* Subject Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {SUBJECTS.map((subj) => (
            <button
              key={subj}
              id={`subject-tab-${subj.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => { setSelectedSubject(subj); setSearchQuery(""); setEdits({}); setSaved(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedSubject === subj
                  ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {subj}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Students", value: filteredStudents.length, color: "text-slate-800", bg: "bg-white border-slate-200" },
            { label: "High Risk", value: filteredStudents.filter(s => s.riskLevel === "High").length, color: "text-red-600", bg: "bg-red-50 border-red-200" },
            { label: `Avg ${selectedSubject} Marks`, value: `${avgMarks}%`, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Changes Pending", value: totalEdited, color: totalEdited > 0 ? "text-indigo-600" : "text-slate-400", bg: totalEdited > 0 ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-2xl p-5 shadow-sm`}>
              <div className={`text-3xl font-extrabold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="teacher-search"
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 text-sm text-slate-700 focus:outline-none bg-transparent placeholder-slate-400"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Click cells to edit marks & attendance</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {selectedSubject} Marks
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Attendance (%)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const isEdited = edits[student.id]?.edited;
                  return (
                    <tr key={student.id} className={`hover:bg-slate-50 transition-colors ${isEdited ? "bg-indigo-50/40" : ""}`}>
                      <td className="px-4 py-3.5 text-slate-400 font-medium text-sm">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            student.riskLevel === "High" ? "bg-red-400" :
                            student.riskLevel === "Medium" ? "bg-amber-400" : "bg-teal-400"
                          }`}>
                            {student.studentName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{student.studentName}</p>
                            <p className="text-xs text-slate-400">{student.rollNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge level={student.riskLevel} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={getMarks(student.id, student.subjectMarks?.marks ?? 0)}
                          onChange={(e) => handleEdit(student.id, "marks", Number(e.target.value))}
                          className={`w-20 text-center py-1.5 px-2 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all ${
                            isEdited ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={getAttendance(student.id, student.attendancePercentage)}
                          onChange={(e) => handleEdit(student.id, "attendance", Number(e.target.value))}
                          className={`w-20 text-center py-1.5 px-2 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all ${
                            isEdited ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-base font-bold ${
                          student.riskLevel === "High" ? "text-red-600" :
                          student.riskLevel === "Medium" ? "text-amber-600" : "text-teal-600"
                        }`}>
                          {student.overallRiskScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {saved && (
          <div className="mt-4 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            All changes saved successfully. Student risk scores will be recalculated.
          </div>
        )}
      </div>
    </div>
  );
}
