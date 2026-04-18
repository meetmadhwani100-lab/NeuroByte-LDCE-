/**
 * Chatbot Server Actions
 * 
 * Server-side actions for chatbot functionality
 */

"use server";

import { supabase } from "@/lib/Client";
import { generateChatResponse, getAvailableKeysCount } from "@/lib/chatbotService";
import type { ChatMessage, ChatRequest, ChatResponse, StudentContext } from "@/lib/types";

/**
 * Get student's academic context for chatbot
 */
export async function getStudentContext(
  studentId: string
): Promise<StudentContext | null> {
  try {
    const { data: student, error } = await supabase
      .from("students")
      .select(
        `
        id,
        current_risk_score,
        risk_category,
        top_risk_reasons
      `
      )
      .eq("id", studentId)
      .single();

    if (error) {
      console.error("Error fetching student context:", error.message);
      return null;
    }

    // Fetch academic records for attendance and marks
    const { data: records, error: recordsError } = await supabase
      .from("academic_records")
      .select("attendance_percentage, internal_marks")
      .eq("student_id", studentId);

    let avgAttendance = undefined;
    let avgMarks = undefined;

    if (!recordsError && records && records.length > 0) {
      avgAttendance =
        records.reduce((sum, r) => sum + r.attendance_percentage, 0) /
        records.length;
      avgMarks =
        records.reduce((sum, r) => sum + r.internal_marks, 0) / records.length;
    }

    // Fetch pending assignments count
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "PENDING");

    const pendingCount = !assignmentsError && assignments ? assignments.length : 0;

    return {
      studentId,
      currentRiskScore: student?.current_risk_score,
      riskCategory: student?.risk_category,
      topRiskReasons: student?.top_risk_reasons || [],
      attendance: avgAttendance,
      averageMarks: avgMarks,
      pendingAssignments: pendingCount,
    };
  } catch (error) {
    console.error("Error in getStudentContext:", error);
    return null;
  }
}

/**
 * Save chat message to database
 */
export async function saveChatMessage(
  studentId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  try {
    await supabase.from("chat_history").insert({
      student_id: studentId,
      role,
      message: content,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving chat message:", error);
  }
}

/**
 * Fetch chat history for a student
 */
export async function getChatHistory(
  studentId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  try {
    const { data: messages, error } = await supabase
      .from("chat_history")
      .select("role, message, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching chat history:", error.message);
      return [];
    }

    return (
      messages
        ?.reverse()
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.message,
          timestamp: new Date(msg.created_at),
        })) || []
    );
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return [];
  }
}

/**
 * Main chatbot handler - processes user message and returns response
 */
export async function handleChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    const { studentId, message, conversationHistory = [] } = request;

    // Get student context
    const context = await getStudentContext(studentId);

    // Generate response using Gemini
    const response = await generateChatResponse(
      message,
      conversationHistory,
      context || undefined
    );

    // Save messages to database
    await Promise.all([
      saveChatMessage(studentId, "user", message),
      saveChatMessage(studentId, "assistant", response.reply),
    ]);

    return response;
  } catch (error) {
    console.error("Error handling chat message:", error);

    return {
      reply: "I apologize for the error. Please try again or contact your mentor.",
      suggestions: ["Refresh the page", "Contact support", "Try again"],
    };
  }
}

/**
 * Generate a student report with chatbot assistance
 */
export async function generateStudentReport(studentId: string): Promise<string> {
  try {
    const context = await getStudentContext(studentId);

    if (!context) {
      return "Unable to generate report. Student data not found.";
    }

    const prompt = `Based on this student profile, generate a brief supportive report:
- Risk Score: ${context.currentRiskScore}/100
- Risk Category: ${context.riskCategory}
- Attendance: ${context.attendance?.toFixed(2)}%
- Average Marks: ${context.averageMarks?.toFixed(2)}%
- Pending Assignments: ${context.pendingAssignments}
- Key Issues: ${context.topRiskReasons?.join(", ")}

Include encouraging message and 3-5 specific actionable steps to improve.`;

    const response = await generateChatResponse(prompt, [], context);
    return response.reply;
  } catch (error) {
    console.error("Error generating student report:", error);
    return "Failed to generate report.";
  }
}

/**
 * Get system status and available API keys
 */
export async function getChatbotStatus(): Promise<{
  available: boolean;
  keysCount: number;
  message: string;
}> {
  try {
    const keysCount = getAvailableKeysCount();

    return {
      available: keysCount > 0,
      keysCount,
      message: `Chatbot service is ${keysCount > 0 ? "operational" : "unavailable"}. ${keysCount} API key(s) configured.`,
    };
  } catch (error) {
    return {
      available: false,
      keysCount: 0,
      message: "Chatbot service error. Please contact administrator.",
    };
  }
}
