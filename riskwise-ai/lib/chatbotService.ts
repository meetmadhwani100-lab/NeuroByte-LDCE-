/**
 * Chatbot Service - Handles communication with Gemini API
 * 
 * This service manages:
 * - API key rotation
 * - Context generation from student data
 * - Prompt construction
 * - API calls to Gemini
 */

import * as genai from "@google/generative-ai";
import { getAPIKeyRotator } from "./apiKeyRotator";
import type { ChatMessage, StudentContext, ChatResponse } from "./types";

// Configuration for the chatbot
const CHATBOT_CONFIG = {
  modelName: "gemini-1.5-flash",
  temperature: 0.7,
  maxTokens: 1024,
};

/**
 * Build a system prompt that includes student context
 */
function buildSystemPrompt(context?: StudentContext): string {
  const basePrompt = `You are an empathetic and supportive academic coach chatbot for the RiskWise AI platform. Your role is to:

1. Help students understand their academic risk factors
2. Provide actionable advice to lower their risk scores
3. Offer encouragement and motivation
4. Suggest concrete study strategies and interventions
5. Help with time management and assignment planning

Be warm, supportive, and non-judgmental. Always provide specific, actionable advice. If a student seems struggling, suggest they speak with their mentor or teacher.`;

  if (!context) return basePrompt;

  const contextInfo = `

CURRENT STUDENT PROFILE:
- Risk Score: ${context.currentRiskScore ?? "N/A"}/100
- Risk Category: ${context.riskCategory ?? "Unknown"}
- Attendance: ${context.attendance ?? "N/A"}%
- Average Marks: ${context.averageMarks ?? "N/A"}%
- Pending Assignments: ${context.pendingAssignments ?? "N/A"}
- Key Risk Factors: ${context.topRiskReasons?.join(", ") ?? "None identified"}

Address the student's specific situation and provide tailored recommendations based on these metrics.`;

  return basePrompt + contextInfo;
}

/**
 * Initialize the Gemini client with rotated API key
 */
function initializeGeminiClient(): genai.GoogleGenerativeAI {
  const rotator = getAPIKeyRotator();
  const apiKey = rotator.getNextKey();

  if (!apiKey) {
    throw new Error("Failed to retrieve API key from rotator");
  }

  return new genai.GoogleGenerativeAI(apiKey);
}

/**
 * Generate a response using Gemini API
 */
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  studentContext?: StudentContext
): Promise<ChatResponse> {
  try {
    const client = initializeGeminiClient();
    const model = client.getGenerativeModel({
      model: CHATBOT_CONFIG.modelName,
    });

    const systemPrompt = buildSystemPrompt(studentContext);

    // Format conversation history for Gemini
    const messages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    // Call Gemini API using startChat
    const chat = model.startChat();

    // Send the entire conversation
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.role === "user") {
        await chat.sendMessage(msg.parts[0].text);
      }
    }

    // Send the current user message and get response
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    // Generate smart suggestions based on risk category
    const suggestions = generateSuggestions(studentContext);

    return {
      reply,
      suggestions,
      riskInsights: studentContext
        ? {
            currentRiskScore: studentContext.currentRiskScore,
            category: studentContext.riskCategory,
            recommendations: generateRecommendations(studentContext),
          }
        : undefined,
    };
  } catch (error: any) {
    console.error("[Chatbot Service] Error:", error);

    // Provide a fallback response
    return {
      reply: "I encountered an error processing your request. Please try again later or contact your mentor for assistance.",
      suggestions: [
        "Contact your mentor",
        "Review pending assignments",
        "Check attendance records",
      ],
    };
  }
}

/**
 * Generate context-aware suggestions
 */
function generateSuggestions(context?: StudentContext): string[] {
  if (!context) {
    return [
      "Ask about study strategies",
      "Discuss assignment deadlines",
      "Learn about risk factors",
    ];
  }

  const suggestions: string[] = [];

  // Add suggestions based on attendance
  if (context.attendance && context.attendance < 75) {
    suggestions.push("Improve attendance");
  }

  // Add suggestions based on marks
  if (context.averageMarks && context.averageMarks < 50) {
    suggestions.push("Focus on weak subjects");
  }

  // Add suggestions based on pending assignments
  if (context.pendingAssignments && context.pendingAssignments > 0) {
    suggestions.push("Prioritize pending assignments");
  }

  // Add suggestions based on risk category
  if (context.riskCategory === "High") {
    suggestions.push("Create study schedule");
  }

  if (context.riskCategory === "Medium") {
    suggestions.push("Stay consistent");
  }

  // Ensure we have at least 3 suggestions
  const defaultSuggestions = [
    "Ask for help",
    "Review notes",
    "Take a break",
  ];

  return suggestions.length > 0
    ? suggestions.slice(0, 3)
    : defaultSuggestions;
}

/**
 * Generate specific recommendations based on student context
 */
function generateRecommendations(context: StudentContext): string[] {
  const recommendations: string[] = [];

  // Attendance-based recommendations
  if (context.attendance && context.attendance < 60) {
    recommendations.push(
      "URGENT: Attend all remaining classes. Every class matters for your risk score."
    );
  } else if (context.attendance && context.attendance < 75) {
    recommendations.push(
      "Try to improve attendance to at least 75%. This is critical for your academic success."
    );
  }

  // Marks-based recommendations
  if (context.averageMarks && context.averageMarks < 40) {
    recommendations.push(
      "Consider seeking extra tutoring or study groups to improve your marks."
    );
  } else if (context.averageMarks && context.averageMarks < 60) {
    recommendations.push(
      "Work on strengthening concepts in weaker subjects through consistent practice."
    );
  }

  // Assignment-based recommendations
  if (context.pendingAssignments && context.pendingAssignments > 3) {
    recommendations.push(
      `You have ${context.pendingAssignments} pending assignments. Create a priority list and tackle them one by one.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Keep up the good work! Maintain your current momentum.");
  }

  return recommendations;
}

/**
 * Get available keys count (for monitoring)
 */
export function getAvailableKeysCount(): number {
  const rotator = getAPIKeyRotator();
  return rotator.getKeyCount();
}

/**
 * Health check - test if Gemini API is accessible
 */
export async function checkGeminiHealth(): Promise<boolean> {
  try {
    const client = initializeGeminiClient();
    const model = client.getGenerativeModel({
      model: CHATBOT_CONFIG.modelName,
    });

    const result = await model.generateContent("Hello");
    return !!result.response.text();
  } catch (error) {
    console.error("[Chatbot Service] Health check failed:", error);
    return false;
  }
}
