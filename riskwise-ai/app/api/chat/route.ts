/**
 * API Route for Chat Endpoint
 * 
 * POST /api/chat
 * 
 * Handles incoming chat requests and returns AI-generated responses
 */

import { NextRequest, NextResponse } from "next/server";
import {
  handleChatMessage,
  getChatHistory,
  getChatbotStatus,
} from "@/actions/chatbotActions";
import type { ChatRequest } from "@/lib/types";

/**
 * POST /api/chat
 * Handle chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;

    // Validate required fields
    if (!body.studentId || !body.message) {
      return NextResponse.json(
        {
          error: "Missing required fields: studentId and message",
        },
        { status: 400 }
      );
    }

    // Fetch recent chat history if not provided
    let conversationHistory = body.conversationHistory || [];
    if (conversationHistory.length === 0) {
      conversationHistory = await getChatHistory(body.studentId, 5);
    }

    // Process the chat message
    const response = await handleChatMessage({
      studentId: body.studentId,
      message: body.message,
      conversationHistory,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[Chat API] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        reply: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * Get chatbot status and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const status = await getChatbotStatus();
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("[Chat API] Status check error:", error);

    return NextResponse.json(
      {
        available: false,
        keysCount: 0,
        message: "Unable to check chatbot status",
      },
      { status: 500 }
    );
  }
}
