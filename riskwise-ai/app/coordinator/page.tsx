"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, LogOut, ShieldCheck, Search, Download,
  TrendingUp, Users, AlertTriangle, Activity, Filter,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getCoordinatorDashboardData, createUserInPlatform } from "@/actions/coordinatorActions";
import { supabase } from "@/lib/Client";
import { RiskBadge } from "@/components/RiskBadge";

const RISK_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#14b8a6",
};

const PAGE_SIZE = 20;

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"risk" | "name" | "attendance">("risk");

  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [coordinatorName, setCoordinatorName] = useState("Coordinator");

  // Add User Form State
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "STUDENT" });
  const [formState, setFormState] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false, error: null, success: null
  });

  useEffect(() => {
    const enforceSecurity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (userData?.role !== 'COORDINATOR') {
        router.push('/login');
        return;
      }
      setCoordinatorName(userData.full_name || "Coordinator");

      try {
        const { allStudents, departmentStats } = await getCoordinatorDashboardData();
        setLiveStudents(allStudents);
        setLiveStats(departmentStats);
      } catch (err) {
        console.error("Dashboard failed to initialize", err);
      }

      setIsAuthorized(true);
    };
    enforceSecurity();
  }, [router]);

  const pieData = [
    { name: "High Risk", value: liveStats?.highRisk ?? 0, color: RISK_COLORS.High },
    { name: "Medium Risk", value: liveStats?.mediumRisk ?? 0, color: RISK_COLORS.Medium },
    { name: "Low Risk", value: liveStats?.lowRisk ?? 0, color: RISK_COLORS.Low },
  ];

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0–20", count: 0 },
      { range: "21–40", count: 0 },
      { range: "41–60", count: 0 },
      { range: "61–80", count: 0 },
      { range: "81–100", count: 0 },
    ];
    liveStudents.forEach((s) => {
      if (s.overallRiskScore <= 20) buckets[0].count++;
      else if (s.overallRiskScore <= 40) buckets[1].count++;
      else if (s.overallRiskScore <= 60) buckets[2].count++;
      else if (s.overallRiskScore <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [liveStudents]);

  const filtered = useMemo(() => {
    let result = liveStudents;
    if (filterRisk !== "All") result = result.filter((s) => s.riskLevel === filterRisk);
    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortBy === "risk") result = [...result].sort((a, b) => b.overallRiskScore - a.overallRiskScore);
    else if (sortBy === "name") result = [...result].sort((a, b) => a.studentName.localeCompare(b.studentName));
    else if (sortBy === "attendance") result = [...result].sort((a, b) => a.attendancePercentage - b.attendancePercentage);
    return result;
  }, [liveStudents, searchQuery, filterRisk, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setFormState({ loading: false, error: "Name and email are required.", success: null });
      return;
    }
    setFormState({ loading: true, error: null, success: null });
    const res = await createUserInPlatform(newUser.name, newUser.email, newUser.role);
    if (res.success) {
      setFormState({ loading: false, error: null, success: res.message || "User created successfully." });
      setNewUser({ name: "", email: "", role: "STUDENT" });
      // Re-fetch stats so the new user displays if they are a student
      if (newUser.role === "STUDENT") {
        const { allStudents, departmentStats } = await getCoordinatorDashboardData();
        setLiveStudents(allStudents);
        setLiveStats(departmentStats);
      }
    } else {
      setFormState({ loading: false, error: res.error || "Failed", success: null });
    }
  };

  if (!isAuthorized || !liveStats) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading department data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Academic Coordinator Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center text-white text-xs font-bold">
                {coordinatorName[0]}
              </div>
              <span className="text-sm font-medium text-purple-700">{coordinatorName}</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Department Academic Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            Comprehensive view of all {liveStats.totalStudents} students. Sorted by highest risk by default.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Dept. Risk Score",
              value: liveStats.departmentOverallRisk,
              sub: "/ 100",
              color: liveStats.departmentOverallRisk > 65 ? "text-red-600" : liveStats.departmentOverallRisk > 35 ? "text-amber-600" : "text-teal-600",
              bg: liveStats.departmentOverallRisk > 65 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200",
              icon: <Activity className="w-5 h-5" />,
            },
            {
              label: "Total Students",
              value: liveStats.totalStudents,
              sub: "enrolled",
              color: "text-indigo-600",
              bg: "bg-indigo-50 border-indigo-200",
              icon: <Users className="w-5 h-5" />,
            },
            {
              label: "High Risk Students",
              value: liveStats.highRisk,
              sub: "need intervention",
              color: "text-red-600",
              bg: "bg-red-50 border-red-200",
              icon: <AlertTriangle className="w-5 h-5" />,
            },
            {
              label: "Avg Attendance",
              value: `${liveStats.avgAttendance}%`,
              sub: "department-wide",
              color: liveStats.avgAttendance < 75 ? "text-red-600" : "text-teal-600",
              bg: liveStats.avgAttendance < 75 ? "bg-red-50 border-red-200" : "bg-teal-50 border-teal-200",
              icon: <TrendingUp className="w-5 h-5" />,
            },
          ].map((kpi) => (
            <div key={kpi.label} className={`${kpi.bg} border rounded-2xl p-5 shadow-sm`}>
              <div className={`${kpi.color} mb-2 opacity-70`}>{kpi.icon}</div>
              <div className={`text-3xl font-extrabold mb-0.5 ${kpi.color}`}>
                {kpi.value}
                {kpi.sub && <span className="text-sm font-normal text-slate-400 ml-1">{kpi.sub}</span>}
              </div>
              <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Add User Form Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Quick Add Platform User
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add new Members. System will auto-generate temporary password: <span className="font-mono text-purple-600 bg-purple-50 px-1 rounded">[role]123</span>
            </p>
          </div>
          
          <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Full Name</label>
              <input type="text" placeholder="e.g. Rahul Sharma" required
                value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                className="w-full text-sm placeholder-slate-400 bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 transition-all" />
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Email Address</label>
              <input type="email" placeholder="e.g. rahul@student.edu" required
                value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                className="w-full text-sm placeholder-slate-400 bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 transition-all" />
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">System Role</label>
              <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                className="w-full text-sm bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 transition-all appearance-none cursor-pointer">
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Subject Teacher</option>
                <option value="MENTOR">Faculty Mentor</option>
              </select>
            </div>
            <button disabled={formState.loading} type="submit" 
              className="w-full md:w-auto mt-2 md:mt-0 font-semibold text-sm px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all text-center">
              {formState.loading ? "Provisioning..." : "Add User"}
            </button>
          </form>

          {/* Form Feedback Alerts */}
          {formState.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-2">
              🚨 {formState.error}
            </div>
          )}
          {formState.success && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span>✅</span> {formState.success}
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                  formatter={(value: number) => [`${value} students`, ""]}
                />
                <Legend
                  formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Risk Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={index < 2 ? "#14b8a6" : index < 3 ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comprehensive Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="coordinator-search"
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full py-2 text-sm text-slate-700 focus:outline-none bg-transparent placeholder-slate-400"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                {(["All", "High", "Medium", "Low"] as const).map((level) => (
                  <button
                    key={level}
                    id={`filter-${level.toLowerCase()}`}
                    onClick={() => { setFilterRisk(level); setPage(1); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      filterRisk === level
                        ? level === "High" ? "bg-red-500 text-white" :
                          level === "Medium" ? "bg-amber-500 text-white" :
                          level === "Low" ? "bg-teal-500 text-white" :
                          "bg-slate-700 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "risk" | "name" | "attendance")}
                  className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                >
                  <option value="risk">Sort: Risk Score</option>
                  <option value="name">Sort: Name</option>
                  <option value="attendance">Sort: Attendance</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Showing {paginated.length} of {filtered.length} students
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Level</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Attendance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Mentor Intv.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Feedback Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-medium">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          student.riskLevel === "High" ? "bg-red-400" :
                          student.riskLevel === "Medium" ? "bg-amber-400" : "bg-teal-400"
                        }`}>
                          {student.studentName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{student.studentName}</p>
                          <p className="text-xs text-slate-400">{student.rollNo} • {student.branch}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-lg font-extrabold ${
                        student.riskLevel === "High" ? "text-red-600" :
                        student.riskLevel === "Medium" ? "text-amber-600" : "text-teal-600"
                      }`}>
                        {student.overallRiskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <RiskBadge level={student.riskLevel} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-semibold ${
                        student.attendancePercentage < 65 ? "text-red-600" :
                        student.attendancePercentage < 75 ? "text-amber-600" : "text-teal-600"
                      }`}>
                        {student.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {student.lastMentorIntervention || (
                        <span className="text-slate-300 italic">None recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      {student.lastMentorFeedback ? (
                        <p className="text-xs text-slate-500 truncate" title={student.lastMentorFeedback}>
                          {student.lastMentorFeedback.slice(0, 60)}
                          {student.lastMentorFeedback.length > 60 ? "..." : ""}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-300 italic">No feedback logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      page === p ? "bg-purple-600 text-white shadow-md" : "border border-slate-200 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
