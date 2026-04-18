"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, LogOut, CheckSquare, Square, TrendingUp, AlertTriangle,
  Calendar, BookOpen, User, ShieldCheck, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { allStudents } from "@/data/mock";
import { RiskRing } from "@/components/RiskRing";
import { RiskBadge } from "@/components/RiskBadge";

// Demo student = Arjun Verma (highest risk for demo purposes)
const DEMO_STUDENT = allStudents.find((s) => s.id === "s1")!;

export default function StudentDashboard() {
  const router = useRouter();
  const student = DEMO_STUDENT;
  const [checkedAssignments, setCheckedAssignments] = useState<Set<string>>(new Set());

  const toggleAssignment = (id: string) => {
    setCheckedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white w-4" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Student Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-blue-300 flex items-center justify-center text-white text-xs font-bold">
                {student.studentName[0]}
              </div>
              <span className="text-sm font-medium text-slate-700">{student.studentName}</span>
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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Good afternoon, {student.studentName.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {student.rollNo} • {student.branch} • Semester {student.semester}
          </p>
        </div>

        {/* Notifications */}
        {student.notifications.length > 0 && (
          <div className="mb-8 space-y-2">
            {student.notifications.map((notif, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-up ${
                  notif.includes("⚠️")
                    ? "bg-red-50 border-red-200 text-red-700"
                    : notif.includes("📅")
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                {notif}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Col ── */}
          <div className="space-y-6">
            {/* Risk Index Card */}
            <div className={`bg-white rounded-2xl shadow-sm border p-6 ${
              student.riskLevel === "High" ? "border-red-200 shadow-red-50" :
              student.riskLevel === "Medium" ? "border-amber-200 shadow-amber-50" :
              "border-teal-200 shadow-teal-50"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                  Academic Risk Index
                </h2>
                <RiskBadge level={student.riskLevel} />
              </div>
              <div className="flex items-center gap-6">
                <RiskRing score={student.overallRiskScore} level={student.riskLevel} size="lg" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Key Metrics</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Attendance</span>
                      <span className={`text-xs font-bold ${student.attendancePercentage < 75 ? "text-red-600" : "text-teal-600"}`}>
                        {student.attendancePercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Pending Tasks</span>
                      <span className={`text-xs font-bold ${student.pendingAssignments.length > 0 ? "text-amber-600" : "text-teal-600"}`}>
                        {student.pendingAssignments.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Avg Marks</span>
                      <span className="text-xs font-bold text-slate-700">
                        {Math.round(student.examMarks.reduce((s, m) => s + m.marks, 0) / student.examMarks.length)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2">Why this score?</div>
                <ul className="space-y-1.5">
                  {student.riskReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Subject Marks */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Subject Scores
              </h2>
              <div className="space-y-3">
                {student.examMarks.map((mark) => (
                  <div key={mark.subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{mark.subject}</span>
                      <span className={`font-bold ${mark.marks < 50 ? "text-red-600" : mark.marks < 65 ? "text-amber-600" : "text-teal-600"}`}>
                        {mark.marks}/{mark.maxMarks}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          mark.marks < 50 ? "bg-red-400" : mark.marks < 65 ? "bg-amber-400" : "bg-teal-400"
                        }`}
                        style={{ width: `${mark.marks}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Col (2 cols) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Academic Performance Trend
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Aug 2023 – Mar 2024</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={student.markHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 4 }}
                  />
                  {student.recentInterventions.map((inv) => (
                    <ReferenceLine
                      key={inv.id}
                      x="Jan"
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{ value: "🤝 Mentor", fontSize: 10, fill: "#6366f1", offset: 5 }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="marks"
                    stroke={student.riskLevel === "High" ? "#ef4444" : student.riskLevel === "Medium" ? "#f59e0b" : "#14b8a6"}
                    strokeWidth={2.5}
                    dot={{ fill: "white", stroke: student.riskLevel === "High" ? "#ef4444" : "#14b8a6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pending Assignments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pending Assignments
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                  {student.pendingAssignments.filter((a) => !checkedAssignments.has(a.id)).length} pending
                </span>
              </h2>
              {student.pendingAssignments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 text-teal-300" />
                  <p className="text-sm">All assignments submitted! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {student.pendingAssignments.map((assignment) => {
                    const checked = checkedAssignments.has(assignment.id);
                    const daysLeft = Math.ceil(
                      (new Date(assignment.dueDate).getTime() - new Date("2024-02-18").getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <button
                        key={assignment.id}
                        onClick={() => toggleAssignment(assignment.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          checked
                            ? "bg-teal-50 border-teal-200"
                            : daysLeft < 0
                            ? "bg-red-50 border-red-200 hover:border-red-300"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-5 h-5 text-teal-500 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${checked ? "line-through text-slate-400" : "text-slate-700"}`}>
                            {assignment.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{assignment.subject}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-semibold ${
                            daysLeft < 0 ? "text-red-600" : daysLeft < 3 ? "text-amber-600" : "text-slate-500"
                          }`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                          <p className="text-xs text-slate-400">Due: {assignment.dueDate}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mentor Interventions */}
            {student.recentInterventions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-500" />
                  Recent Mentor Sessions
                </h2>
                <div className="space-y-3">
                  {student.recentInterventions.map((inv) => (
                    <div key={inv.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-indigo-700">{inv.mentorName}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {inv.date}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">&quot;{inv.feedback}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
