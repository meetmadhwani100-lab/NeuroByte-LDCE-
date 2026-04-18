"use client";

/**
 * Example: Chatbot Page
 * 
 * This is a sample integration showing how to use the Chatbot component
 * in your student dashboard.
 */

import { useState } from "react";
import Chatbot from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";

interface ChatbotPageProps {
  params: {
    studentId: string;
  };
}

export default function ChatbotPage({ params }: ChatbotPageProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  if (!params.studentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error: No Student ID</h1>
          <p className="text-gray-600">Please access this page with a valid student ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Support</h1>
          <p className="text-gray-600">
            Chat with your AI Academic Coach to get personalized guidance on improving your academic performance.
          </p>
        </div>

        {/* Chatbot Container */}
        {isChatOpen ? (
          <div className="h-[600px] bg-white rounded-lg shadow-xl overflow-hidden">
            <Chatbot
              studentId={params.studentId}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        ) : (
          <div className="text-center">
            <Button
              onClick={() => setIsChatOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open Academic Coach
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 What can the Coach help with?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Understanding your risk score</li>
              <li>✓ Study strategies and tips</li>
              <li>✓ Assignment deadlines</li>
              <li>✓ Attendance improvement plans</li>
              <li>✓ Personalized recommendations</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">🎯 How to get the best help?</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Be specific about your concerns</li>
              <li>✓ Share what you've already tried</li>
              <li>✓ Ask follow-up questions</li>
              <li>✓ Use suggested prompts</li>
              <li>✓ Request specific action plans</li>
            </ul>
          </div>
        </div>

        {/* Sample Topics */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💬 Sample Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setIsChatOpen(true)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors text-sm text-gray-700"
            >
              "How can I improve my attendance?"
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors text-sm text-gray-700"
            >
              "What should I do to lower my risk score?"
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors text-sm text-gray-700"
            >
              "I have pending assignments, what's my priority?"
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors text-sm text-gray-700"
            >
              "Can you help me create a study plan?"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
