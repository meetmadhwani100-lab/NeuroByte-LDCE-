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
  modelName: "gemini-2.5-flash",
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

CURRENT DASHBOARD CONTEXT:
- Viewing as Role: ${context.userRole ?? "Unknown"}
- Relevant Data Loaded on Screen: ${JSON.stringify(context.contextData, null, 2)}

Address the user based on their Role (if Student, speak directly to them. If Mentor/Teacher/Coordinator, advise them on how to manage the students in the data). Provide tailored recommendations based strictly on the metrics presented above.`;

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

    // Format conversation history for Gemini (strictly alternating user/model)
    // We prepend the system prompt as a user message, and a generic acknowledgment as the model
    const historyParts: any[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to assist based on the provided dashboard context." }],
      }
    ];

    // Append the past conversation
    for (const msg of conversationHistory) {
      if (msg.content.trim() === "") continue; // Skip empty
      historyParts.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Call Gemini API using startChat with seeded history
    const chat = model.startChat({
      history: historyParts,
    });

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

  const role = context.userRole;
  const data = context.contextData || {};

  if (role === "STUDENT") {
    // Add suggestions based on attendance
    if (data.activeSubjects?.some((s: any) => s.attendance < 75)) {
      suggestions.push("How to improve attendance");
    }
    // Add suggestions based on risk category
    if (data.riskLevel === "High") {
      suggestions.push("Create a study schedule");
    }
    suggestions.push("Explain my risk factors");
  } else if (role === "MENTOR") {
    suggestions.push(`Analyze ${data.selectedStudent || "my"} students`);
    if (data.highRiskStudents > 0) {
      suggestions.push("Action plan for high-risk students");
    }
    suggestions.push("Draft warning email template");
  } else {
    suggestions.push("Analyze current dashboard data");
    suggestions.push("Suggest interventions");
  }

  // Ensure we have at least 3 suggestions
  const defaultSuggestions = [
    "Summarize dashboard",
    "Identify critical risks",
    "How does RiskWise work?",
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

  recommendations.push("Utilize the suggested interventions to mitigate risk.");
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
