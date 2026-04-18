/**
 * Chatbot Demo & Testing Guide
 * 
 * This file shows various ways to test and use the chatbot system
 */

// ============================================
// 1. TESTING THE API DIRECTLY
// ============================================

async function testChatAPI() {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studentId: "student_123",
      message: "I have a 65 risk score and 72% attendance. What should I do?",
      conversationHistory: [],
    }),
  });

  const data = await response.json();
  console.log("Chat Response:", data);
  // Expected output:
  // {
  //   reply: "Based on your profile...",
  //   suggestions: ["Improve attendance", ...],
  //   riskInsights: { currentRiskScore: 65, ... }
  // }
}

// ============================================
// 2. TESTING STATUS ENDPOINT
// ============================================

async function getChatbotStatus() {
  const response = await fetch("/api/chat");
  const status = await response.json();
  console.log("Chatbot Status:", status);
  // Expected output:
  // { available: true, keysCount: 5, message: "..." }
}

// ============================================
// 3. MULTI-TURN CONVERSATION
// ============================================

async function multiTurnConversation() {
  const studentId = "student_123";
  const conversation: Array<{ role: "user" | "assistant"; content: string }> =
    [];

  // First message
  const msg1 = "How can I lower my risk score?";
  console.log("Student:", msg1);

  let response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      studentId,
      message: msg1,
      conversationHistory: conversation,
    }),
    headers: { "Content-Type": "application/json" },
  });

  let data = await response.json();
  console.log("Coach:", data.reply);

  conversation.push(
    { role: "user", content: msg1 },
    { role: "assistant", content: data.reply }
  );

  // Second message (with context)
  const msg2 = "What about my 3 pending assignments?";
  console.log("\nStudent:", msg2);

  response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      studentId,
      message: msg2,
      conversationHistory: conversation,
    }),
    headers: { "Content-Type": "application/json" },
  });

  data = await response.json();
  console.log("Coach:", data.reply);
}

// ============================================
// 4. TESTING WITH SERVER ACTIONS
// ============================================

import {
  handleChatMessage,
  getStudentContext,
  getChatHistory,
  getChatbotStatus,
} from "@/actions/chatbotActions";

async function testServerActions() {
  const studentId = "student_123";

  // Get student context
  const context = await getStudentContext(studentId);
  console.log("Student Context:", context);
  // Output:
  // {
  //   studentId: "student_123",
  //   currentRiskScore: 65,
  //   riskCategory: "High",
  //   attendance: 72,
  //   averageMarks: 58,
  //   pendingAssignments: 3,
  //   ...
  // }

  // Get prior conversation history
  const history = await getChatHistory(studentId, 5);
  console.log("Chat History:", history);

  // Send a message
  const response = await handleChatMessage({
    studentId,
    message: "Help me create a study plan",
    conversationHistory: history,
  });
  console.log("Response:", response);
}

// ============================================
// 5. COMPONENT USAGE
// ============================================

// In your React component:
/*
"use client";

import { useState } from "react";
import Chatbot from "@/components/Chatbot";

export default function Page({ params }: { params: { studentId: string } }) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="h-screen">
      {isChatOpen && (
        <Chatbot
          studentId={params.studentId}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
*/

// ============================================
// 6. FLOATING WIDGET USAGE
// ============================================

/*
import { FloatingChatWidget } from "@/components/ChatbotExamples";

export default function DashboardPage() {
  return (
    <div>
      <h1>Student Dashboard</h1>
      {/* Main dashboard content */}
      
      {/* Floating chat in bottom-right corner */}
      <FloatingChatWidget studentId="student_123" />
    </div>
  );
}
*/

// ============================================
// 7. CURL COMMANDS FOR TESTING
// ============================================

/*
# Test 1: Basic chat message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "message": "How can I improve my grades?"
  }'

# Test 2: With conversation history
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "message": "What about my assignments?",
    "conversationHistory": [
      {
        "role": "user",
        "content": "How can I improve my grades?"
      },
      {
        "role": "assistant",
        "content": "You can improve by..."
      }
    ]
  }'

# Test 3: Get chatbot status
curl -X GET http://localhost:3000/api/chat

# Test 4: With jq for pretty printing
curl -X GET http://localhost:3000/api/chat | jq .
*/

// ============================================
// 8. ERROR HANDLING TESTS
// ============================================

async function testErrorHandling() {
  // Missing studentId
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello", // Missing studentId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log("Error (expected 400):", error);
    }
  } catch (err) {
    console.error("Request error:", err);
  }

  // Empty message
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "student_123",
        message: "", // Empty
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log("Error (expected 400):", error);
    }
  } catch (err) {
    console.error("Request error:", err);
  }
}

// ============================================
// 9. PERFORMANCE TESTING
// ============================================

async function performanceTest() {
  const studentId = "student_123";
  const startTime = Date.now();

  console.log("Starting performance test...");

  // Measure first request (cold start)
  let response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId,
      message: "Hello",
    }),
  });

  const coldTime = Date.now() - startTime;
  console.log(`Cold start: ${coldTime}ms`);

  // Measure second request (warm)
  const warmStart = Date.now();
  response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId,
      message: "What else?",
    }),
  });

  const warmTime = Date.now() - warmStart;
  console.log(`Warm request: ${warmTime}ms`);

  // Measure 10 concurrent requests
  const concurrentStart = Date.now();
  const promises = Array(10)
    .fill(null)
    .map((_, i) =>
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          message: `Message ${i}`,
        }),
      })
    );

  await Promise.all(promises);
  const concurrentTime = Date.now() - concurrentStart;
  console.log(`10 concurrent: ${concurrentTime}ms (avg ${concurrentTime / 10}ms each)`);
}

// ============================================
// 10. MOCK STUDENT SCENARIOS
// ============================================

const mockStudents = [
  {
    id: "student_high_risk",
    description: "High risk student",
    testMessage: "I'm failing multiple subjects, what should I do?",
  },
  {
    id: "student_low_risk",
    description: "Low risk student",
    testMessage: "How can I maintain my good grades?",
  },
  {
    id: "student_medium_risk",
    description: "Medium risk student",
    testMessage: "I'm struggling with attendance, help!",
  },
];

async function testMockStudents() {
  for (const student of mockStudents) {
    console.log(`\n=== Testing: ${student.description} ===`);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        message: student.testMessage,
      }),
    });

    const data = await response.json();
    console.log(`Q: ${student.testMessage}`);
    console.log(`A: ${data.reply}`);
    console.log(`Suggestions: ${data.suggestions?.join(", ")}`);
  }
}

// ============================================
// RUNNING TESTS
// ============================================

/*
Run these tests in your browser console or with Node:

// Test API
await testChatAPI();

// Test Status
await getChatbotStatus();

// Multi-turn
await multiTurnConversation();

// Server actions (must be in server component)
await testServerActions();

// Error handling
await testErrorHandling();

// Performance
await performanceTest();

// Mock students
await testMockStudents();

Or use the curl commands above from terminal.
*/

// ============================================
// EXPECTED OUTPUTS
// ============================================

/*
✅ SUCCESSFUL RESPONSE:
{
  "reply": "Based on your profile showing a 65 risk score with 72% attendance...",
  "suggestions": ["Improve attendance", "Complete assignments", "Study more"],
  "riskInsights": {
    "currentRiskScore": 65,
    "category": "High",
    "recommendations": ["URGENT: Attend all remaining classes..."]
  }
}

❌ ERROR RESPONSE:
{
  "error": "Missing required fields: studentId and message"
}

✅ STATUS RESPONSE:
{
  "available": true,
  "keysCount": 5,
  "message": "Chatbot service is operational. 5 API key(s) configured."
}

⚠️ FALLBACK RESPONSE (if API fails):
{
  "reply": "I encountered an error. Please try again later.",
  "suggestions": ["Contact your mentor", "Review pending assignments"]
}
*/

export {};
