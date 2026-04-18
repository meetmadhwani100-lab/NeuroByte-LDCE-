/**
 * TypeScript types for the Chatbot system
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  studentId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
  riskInsights?: {
    currentRiskScore?: number;
    category?: "Low" | "Medium" | "High";
    recommendations?: string[];
  };
}

export interface StudentContext {
  studentId: string;
  currentRiskScore?: number;
  riskCategory?: "Low" | "Medium" | "High";
  topRiskReasons?: string[];
  attendance?: number;
  averageMarks?: number;
  pendingAssignments?: number;
}

export interface ChatbotConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface APIKeyConfig {
  prefix: string;
  fallbackKey: string;
}
