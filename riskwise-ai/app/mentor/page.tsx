"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, LogOut, ShieldCheck, Search, ArrowUpDown,
  User, Calendar, Bell, TrendingUp, AlertTriangle,
  BookOpen, ClipboardEdit, CheckCircle2, X, Send,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { allStudents, mentors, type Student, type Intervention } from "@/data/mock";
import { RiskBadge } from "@/components/RiskBadge";
import { RiskRing } from "@/components/RiskRing";

const MENTOR = mentors[0];

// Sort students by risk descending (already sorted but keep for clarity)
const mentorStudents = allStudents
  .filter((s) => s.assignedMentorId === MENTOR.id)
  .sort((a, b) => b.overallRiskScore - a.overallRiskScore);

export default function MentorDashboard() {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [interventionText, setInterventionText] = useState("");
  const [interventionDate, setInterventionDate] = useState("2024-02-18");
  const [interventionSubmitting, setInterventionSubmitting] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState(false);
  const [notifSent, setNotifSent] = useState(false);
  const [localInterventions, setLocalInterventions] = useState<Record<string, Intervention[]>>({});

  const filteredStudents = mentorStudents.filter((s) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highRisk = mentorStudents.filter((s) => s.riskLevel === "High").length;
  const mediumRisk = mentorStudents.filter((s) => s.riskLevel === "Medium").length;
  const lowRisk = mentorStudents.filter((s) => s.riskLevel === "Low").length;

  const handleLogIntervention = async () => {
    if (!selectedStudent || !interventionText.trim()) return;
    setInterventionSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const newIntervention: Intervention = {
      id: `int_new_${Date.now()}`,
      date: interventionDate,
      mentorName: MENTOR.name,
      feedback: interventionText,
      preScore: selectedStudent.overallRiskScore + 5,
      postScore: selectedStudent.overallRiskScore,
    };

    setLocalInterventions((prev) => ({
      ...prev,
      [selectedStudent.id]: [newIntervention, ...(prev[selectedStudent.id] || [])],
    }));

    setInterventionText("");
    setInterventionSubmitting(false);
    setInterventionSuccess(true);
    setTimeout(() => setInterventionSuccess(false), 3000);
  };

  const handleSendNotification = async () => {
    if (!selectedStudent) return;
    setNotifSent(true);
    setTimeout(() => setNotifSent(false), 3000);
  };

  const getStudentInterventions = (student: Student) => {
    return [...(localInterventions[student.id] || []), ...student.recentInterventions];
  };

  // Build chart data for pre/post intervention
  const buildInterventionChartData = (student: Student) => {
    const interventions = getStudentInterventions(student);
    if (interventions.length === 0 && student.markHistory) {
      return student.markHistory.map((m) => ({ month: m.month, score: m.marks }));
    }
    // Overlay mark history with intervention markers
    return student.markHistory.map((m, i) => ({
      month: m.month,
      score: m.marks,
      intervention: i === 5 && interventions.length > 0 ? interventions[0].preScore : null,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Faculty Mentor Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-300 flex items-center justify-center text-white text-xs font-bold">
                {MENTOR.name[0]}
              </div>
              <span className="text-sm font-medium text-teal-700">{MENTOR.name}</span>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Mentor Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            Assigned students sorted by highest academic risk. Click any row to drill down.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: mentorStudents.length, color: "text-slate-800", bg: "bg-white border-slate-200" },
            { label: "High Risk", value: highRisk, color: "text-red-600", bg: "bg-red-50 border-red-200" },
            { label: "Medium Risk", value: mediumRisk, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Low Risk", value: lowRisk, color: "text-teal-600", bg: "bg-teal-50 border-teal-200" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-2xl p-5 shadow-sm`}>
              <div className={`text-3xl font-extrabold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* ── Student Table ── */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Students by Risk Score</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="mentor-search"
                    type="text"
                    placeholder="Search by name or roll no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredStudents.map((student, i) => (
                  <button
                    key={student.id}
                    id={`student-row-${student.id}`}
                    onClick={() => { setSelectedStudent(student); setInterventionSuccess(false); setNotifSent(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-all ${
                      selectedStudent?.id === student.id ? "bg-teal-50 border-l-4 border-teal-400" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      student.riskLevel === "High" ? "bg-red-400" :
                      student.riskLevel === "Medium" ? "bg-amber-400" : "bg-teal-400"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{student.studentName}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{student.rollNo} • Att: {student.attendancePercentage}%</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-lg font-bold ${
                        student.riskLevel === "High" ? "text-red-600" :
                        student.riskLevel === "Medium" ? "text-amber-600" : "text-teal-600"
                      }`}>{student.overallRiskScore}</span>
                      <RiskBadge level={student.riskLevel} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Detail Panel ── */}
          <div className="xl:col-span-3">
            {!selectedStudent ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-teal-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Student</h3>
                <p className="text-sm text-slate-400">Click on any student in the table to view their detailed profile and log an intervention.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
                        selectedStudent.riskLevel === "High" ? "bg-red-400" :
                        selectedStudent.riskLevel === "Medium" ? "bg-amber-400" : "bg-teal-400"
                      }`}>
                        {selectedStudent.studentName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedStudent.studentName}</h2>
                        <p className="text-sm text-slate-500">{selectedStudent.rollNo} • {selectedStudent.branch} • Sem {selectedStudent.semester}</p>
                        <div className="mt-1">
                          <RiskBadge level={selectedStudent.riskLevel} score={selectedStudent.overallRiskScore} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="send-notification-btn"
                        onClick={handleSendNotification}
                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                          notifSent
                            ? "bg-teal-100 text-teal-700 border border-teal-200"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                        }`}
                      >
                        {notifSent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {notifSent ? "Sent!" : "Send Notification"}
                      </button>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-xl p-3 ${selectedStudent.attendancePercentage < 75 ? "bg-red-50 border border-red-100" : "bg-teal-50 border border-teal-100"}`}>
                      <div className={`text-xl font-bold ${selectedStudent.attendancePercentage < 75 ? "text-red-600" : "text-teal-600"}`}>
                        {selectedStudent.attendancePercentage}%
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">Attendance</div>
                    </div>
                    <div className={`rounded-xl p-3 ${selectedStudent.pendingAssignments.length > 0 ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-100"}`}>
                      <div className={`text-xl font-bold ${selectedStudent.pendingAssignments.length > 0 ? "text-amber-600" : "text-slate-600"}`}>
                        {selectedStudent.pendingAssignments.length}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">Pending Tasks</div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                      <div className="text-xl font-bold text-indigo-600">
                        {Math.round(selectedStudent.examMarks.reduce((s, m) => s + m.marks, 0) / selectedStudent.examMarks.length)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">Avg Marks</div>
                    </div>
                  </div>

                  {/* Risk reasons */}
                  {selectedStudent.riskReasons.length > 0 && (
                    <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Risk Factors
                      </div>
                      <ul className="space-y-1">
                        {selectedStudent.riskReasons.map((r, i) => (
                          <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Performance Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    Performance Trajectory
                    {getStudentInterventions(selectedStudent).length > 0 && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full ml-auto font-medium">
                        🔵 = Intervention Point
                      </span>
                    )}
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={buildInterventionChartData(selectedStudent)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                      {getStudentInterventions(selectedStudent).length > 0 && (
                        <ReferenceLine x="Jan" stroke="#6366f1" strokeDasharray="3 3" label={{ value: "Intervention", fontSize: 9, fill: "#6366f1" }} />
                      )}
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Performance"
                        stroke={selectedStudent.riskLevel === "High" ? "#ef4444" : selectedStudent.riskLevel === "Medium" ? "#f59e0b" : "#14b8a6"}
                        strokeWidth={2.5}
                        dot={{ fill: "white", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pending Assignments */}
                {selectedStudent.pendingAssignments.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      Pending Assignments
                    </h3>
                    <div className="space-y-2">
                      {selectedStudent.pendingAssignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{a.title}</p>
                            <p className="text-xs text-slate-400">{a.subject}</p>
                          </div>
                          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                            Due: {a.dueDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Log Intervention */}
                <div className="bg-white rounded-2xl shadow-sm border border-teal-200 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardEdit className="w-4 h-4 text-teal-500" />
                    Log Intervention
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />Session Date
                      </label>
                      <input
                        id="intervention-date"
                        type="date"
                        value={interventionDate}
                        onChange={(e) => setInterventionDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        <ClipboardEdit className="w-3.5 h-3.5 inline mr-1" />Intervention Notes
                      </label>
                      <textarea
                        id="intervention-text"
                        value={interventionText}
                        onChange={(e) => setInterventionText(e.target.value)}
                        placeholder="Describe the intervention session, actions taken, and follow-up plan..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 focus:bg-white resize-none transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        id="log-intervention-btn"
                        onClick={handleLogIntervention}
                        disabled={!interventionText.trim() || interventionSubmitting}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-md shadow-teal-200 transition-all flex items-center justify-center gap-2"
                      >
                        {interventionSubmitting ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {interventionSubmitting ? "Saving..." : "Log Intervention"}
                      </button>
                    </div>
                    {interventionSuccess && (
                      <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Intervention logged successfully!
                      </div>
                    )}
                  </div>

                  {/* Previous Interventions */}
                  {getStudentInterventions(selectedStudent).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Previous Interventions</p>
                      <div className="space-y-3">
                        {getStudentInterventions(selectedStudent).map((inv) => (
                          <div key={inv.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-teal-700">{inv.mentorName}</span>
                              <span className="text-xs text-slate-400">{inv.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{inv.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
