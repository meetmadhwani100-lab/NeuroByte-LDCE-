/**
 * Example: Integration in Student Dashboard
 * 
 * This shows how to add a chat widget to an existing dashboard page.
 */

"use client";

import { useState } from "react";
import Chatbot from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";

interface StudentDashboardProps {
  studentId: string;
  studentName: string;
}

/**
 * Floating Chat Widget - Can be added to any page
 */
export function FloatingChatWidget({ studentId }: { studentId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Button (Bottom Right Corner) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40"
          title="Open Academic Coach"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50 rounded-lg shadow-2xl overflow-hidden">
          <Chatbot
            studentId={studentId}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}

/**
 * Embedded Chat Section - For full-page integration
 */
export function EmbeddedChatSection({ studentId }: { studentId: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <h2 className="text-xl font-bold text-white">Need Help?</h2>
        <p className="text-blue-100 text-sm">Chat with your Academic Coach</p>
      </div>
      <div className="h-96">
        <Chatbot studentId={studentId} />
      </div>
    </div>
  );
}

/**
 * Example: Student Dashboard with Chat
 */
export default function StudentDashboard({
  studentId,
  studentName,
}: StudentDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome, {studentName}
        </h1>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Risk Score Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Risk Score</div>
            <div className="text-3xl font-bold text-red-600">42</div>
            <div className="text-sm text-gray-600 mt-2">Medium Risk</div>
          </div>

          {/* Attendance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Attendance</div>
            <div className="text-3xl font-bold text-blue-600">78%</div>
            <div className="text-sm text-gray-600 mt-2">Needs Improvement</div>
          </div>

          {/* GPA Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Average Marks</div>
            <div className="text-3xl font-bold text-green-600">3.5</div>
            <div className="text-sm text-gray-600 mt-2">Good Performance</div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="mb-8">
          <EmbeddedChatSection studentId={studentId} />
        </div>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChatWidget studentId={studentId} />
    </div>
  );
}
