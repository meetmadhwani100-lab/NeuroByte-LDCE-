"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotFABProps {
  studentId: string;
  userRole: "STUDENT" | "MENTOR" | "TEACHER" | "COORDINATOR";
  contextData?: Record<string, any>;
}

export function ChatbotFAB({ studentId, userRole, contextData }: ChatbotFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm the RiskWise Academic Assistant. I can help you understand risk data, suggest interventions, or answer questions about the ${userRole.toLowerCase()} dashboard. How can I help?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat history from the database on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat?studentId=${studentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            setMessages(data.history);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    }
    loadHistory();
  }, [studentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || isLoading) return;
    
    setInput("");
    setActiveSuggestions([]);

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          message: text,
          conversationHistory: messages,
          userRole,
          contextData,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "I'm sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      }]);

      if (data.suggestions && data.suggestions.length > 0) {
        setActiveSuggestions(data.suggestions);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Network error. Please check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const roleColor = {
    STUDENT: "bg-indigo-600",
    MENTOR: "bg-teal-600",
    TEACHER: "bg-amber-500",
    COORDINATOR: "bg-purple-600",
  }[userRole];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 w-14 h-14 ${roleColor} text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform`}
          title="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-80 md:w-96 rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden flex flex-col"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className={`${roleColor} px-4 py-3 flex items-center justify-between text-white shrink-0`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">RiskWise AI Assistant</p>
                <p className="text-[10px] text-white/70">{userRole} Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                  m.role === "user" ? "bg-slate-200" : `${roleColor} text-white`
                }`}>
                  {m.role === "user" ? <User className="w-3.5 h-3.5 text-slate-600" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm markdown-body"
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className={`w-7 h-7 rounded-full shrink-0 ${roleColor} flex items-center justify-center`}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-slate-200 px-3 py-2.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {activeSuggestions.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 shrink-0">
              {activeSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(sug)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all hover:shadow-sm ${
                    userRole === "STUDENT" ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" :
                    userRole === "MENTOR" ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100" :
                    userRole === "TEACHER" ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" :
                    "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about risk data..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`w-9 h-9 ${roleColor} text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105`}
              >
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Powered by Gemini API Rotator • RiskWise AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}
