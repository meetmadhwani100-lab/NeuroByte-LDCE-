"use server";

import { supabase } from "@/lib/Client";
import { createClient } from "@supabase/supabase-js";

// Stateless client specifically for admin actions, bypasses browser session
const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
};


export async function getCoordinatorDashboardData() {
  // 1. Fetch all STUDENT users
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "STUDENT");

  if (uErr) throw new Error(uErr.message);

  // 2. Fetch all students with their interventions
  const { data: students, error: sErr } = await supabase
    .from("students")
    .select(`
      user_id,
      current_risk_score,
      risk_category,
      math_attendance,
      physics_attendance,
      cs_attendance,
      english_attendance,
      electronics_attendance,
      chemistry_attendance,
      interventions (
        session_date,
        mentor_feedback
      )
    `);

  if (sErr) throw new Error(sErr.message);

  const studentMap = new Map();
  students?.forEach((s) => studentMap.set(s.user_id, s));

  let totalRisk = 0;
  let totalAtt = 0;
  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;

  const allStudents = (users ?? []).map((u, i) => {
    const sData = studentMap.get(u.id);

    const score = sData?.current_risk_score ?? 0;
    const level = sData?.risk_category ?? "Low";

    if (level === "High") highRisk++;
    else if (level === "Medium") mediumRisk++;
    else lowRisk++;

    totalRisk += score;

    // Calculate generic attendance %
    const attFields = [
      sData?.math_attendance,
      sData?.physics_attendance,
      sData?.cs_attendance,
      sData?.english_attendance,
      sData?.electronics_attendance,
      sData?.chemistry_attendance
    ].filter(a => a !== null && a !== undefined) as number[];
    
    const attPercent = attFields.length > 0 
      ? Math.round(attFields.reduce((a, b) => a + b, 0) / attFields.length) 
      : 100;
    
    totalAtt += attPercent;

    // Interventions
    const invs = sData?.interventions ?? [];
    invs.sort((a: any, b: any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    const latestInv = invs[0];

    return {
      id: u.id,
      studentName: u.full_name || u.email || "Unknown Student",
      rollNo: `CE2024${String(i+1).padStart(3, "0")}`, // Dummy until DB adds this field
      branch: "Computer Engineering", // Dummy until DB adds this field
      overallRiskScore: score,
      riskLevel: level,
      attendancePercentage: attPercent,
      lastMentorIntervention: latestInv ? new Date(latestInv.session_date).toLocaleDateString() : null,
      lastMentorFeedback: latestInv ? latestInv.mentor_feedback : null,
    };
  });

  // Sort by risk descending
  allStudents.sort((a, b) => b.overallRiskScore - a.overallRiskScore);

  const totalS = allStudents.length || 1;
  const departmentStats = {
    totalStudents: allStudents.length,
    highRisk,
    mediumRisk,
    lowRisk,
    avgAttendance: Math.round(totalAtt / totalS),
    departmentOverallRisk: Math.round(totalRisk / totalS),
  };

  return { allStudents, departmentStats };
}

export async function createUserInPlatform(name: string, email: string, role: string) {
  try {
    const formattedRole = role.toUpperCase();
    const tempPassword = `${role.toLowerCase()}123`;
    
    // 1. Create auth user securely
    const adminSupabase = getAdminSupabase();
    const { data: authData, error: authError } = await adminSupabase.auth.signUp({
      email,
      password: tempPassword,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Could not create user auth. Email might be in use.");

    const userId = authData.user.id;

    // 2. Insert into users array
    const { error: insertUserError } = await adminSupabase.from("users").insert({
      id: userId,
      full_name: name,
      email: email.toLowerCase(),
      role: formattedRole,
      demo_password: tempPassword,
    });

    if (insertUserError) throw new Error(`User insertion failed: ${insertUserError.message}`);

    // 3. Fallback: if student, initialize student profile
    if (formattedRole === "STUDENT") {
      const { error: studentError } = await adminSupabase.from("students").insert({
        user_id: userId,
        current_risk_score: 0,
        risk_category: "Low",
        average_marks: null,
      });
      if (studentError) {
        console.error("Non-fatal: failed to init student table record: " + studentError.message);
      }
    }

    return { success: true, message: `Successfully registered ${name} as a ${role}.` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create user." };
  }
}
