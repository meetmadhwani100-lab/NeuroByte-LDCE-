# RiskWise AI - Early Academic Risk Detection Platform

**Proactively detect academic risk factors in students and enable timely intervention by mentors, teachers, and coordinators.**

## 🌟 Features

### Core Platform
- 📊 **Risk Score Calculation** - Multi-factor academic risk assessment
- 👥 **Multi-role Dashboard** - Coordinator, Teacher, Mentor, Student views
- 📈 **Real-time Analytics** - Track student progress and interventions
- 🔔 **Smart Alerts** - Notify stakeholders of at-risk students

### 🤖 AI Chatbot (NEW!)
- **Academic Coach** - 24/7 AI-powered student support
- **Personalized Guidance** - Real-time risk factor analysis and recommendations
- **Report Generation** - AI-assisted student performance reports
- **Multi-key Rotation** - Unlimited scale with automatic API key rotation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install @google/generative-ai
```

### 2. Set Up Environment
Copy `.env.example` to `.env.local` and add your keys:
```
GEMINI_API_KEY_1=your_key_here
GEMINI_API_KEY_2=your_key_here
# ... add up to 5 keys for better rate limiting
```

### 3. Database Setup
Run the schema on Supabase:
```bash
# See supabase/chatbot_schema.sql
```

### 4. Start Development
```bash
npm run dev
```

## 📚 Documentation

### 📖 Full Guides
- **[CHATBOT.md](./CHATBOT.md)** - Complete chatbot setup and customization (1000+ lines)
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute quick start guide
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Technical implementation details

### 🎓 Integration Examples

#### Use in Student Dashboard
```tsx
import Chatbot from "@/components/Chatbot";

export default function Dashboard({ studentId }: { studentId: string }) {
  return <Chatbot studentId={studentId} />;
}
```

#### Floating Chat Widget
```tsx
import { FloatingChatWidget } from "@/components/ChatbotExamples";

export default function Page() {
  return <FloatingChatWidget studentId="student_123" />;
}
```

#### Server Actions
```typescript
import { handleChatMessage, getStudentContext } from "@/actions/chatbotActions";

const context = await getStudentContext("student_123");
const response = await handleChatMessage({
  studentId: "student_123",
  message: "How can I improve my risk score?",
});
```

## 🏗️ Project Structure

```
riskwise-ai/
├── lib/
│   ├── apiKeyRotator.ts        # API key rotation system
│   ├── chatbotService.ts       # Gemini integration
│   ├── types.ts                # Type definitions
│   └── utils.ts
├── actions/
│   ├── chatbotActions.ts       # Chatbot server actions
│   ├── studentActions.ts
│   ├── teacherActions.ts
│   └── mentorActions.ts
├── components/
│   ├── Chatbot.tsx             # Chat component
│   ├── ChatbotExamples.tsx     # Integration examples
│   ├── RiskBadge.tsx
│   ├── RiskRing.tsx
│   └── ui/
├── app/
│   ├── api/chat/route.ts       # Chat API endpoint
│   ├── chatbot/[studentId]/page.tsx
│   ├── student/page.tsx
│   ├── teacher/page.tsx
│   ├── mentor/page.tsx
│   └── coordinator/page.tsx
├── supabase/
│   ├── schema.sql
│   └── chatbot_schema.sql      # Chat history table
└── CHATBOT.md                  # Chatbot documentation
```

## 🔑 Gemini API Setup

### Get Your Keys
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy to `.env.local`

### Benefits of Multiple Keys
- **Rate Limiting** - 500 requests/key/day = 2500 with 5 keys
- **Automatic Rotation** - System cycles through keys automatically
- **Zero Downtime** - Seamless fallback if one key fails
- **Scalability** - Add more keys as usage grows

## 🤖 How the Chatbot Works

```
Student Query
    ↓
Fetch Student Context (attendance, marks, risk score)
    ↓
Build Context-Aware Prompt
    ↓
Rotate API Key → Call Gemini
    ↓
Generate Personalized Response + Suggestions
    ↓
Save to chat_history
    ↓
Display with Animations
```

## 📊 Student Benefits

The chatbot helps students:
- 📉 **Lower Risk Scores** - Specific, actionable advice
- 📚 **Study Better** - Personalized learning strategies
- ⏰ **Manage Time** - Assignment and deadline planning
- 🎯 **Track Progress** - Real-time feedback and encouragement
- 💬 **24/7 Support** - Always available academic coach

## 🔒 Security

✅ **Server-side API calls** - Keys never exposed to client
✅ **Environment variables** - Secrets in .env.local
✅ **Row-level security** - Students see only their data
✅ **Error handling** - Graceful degradation on failures

## 📈 Deployment

The platform is ready for production deployment on Vercel, Railway, or similar platforms.

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY_1 through GEMINI_API_KEY_5
```

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16.2.4 with App Router
- React 19.2.4
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts for analytics

**Backend:**
- Next.js Server Actions
- Supabase (PostgreSQL)
- Google Gemini API

**AI/ML:**
- Google's Gemini 1.5 Flash
- Automatic model switching for cost optimization

## 📞 Support & Issues

For detailed troubleshooting, see:
- **[CHATBOT.md](./CHATBOT.md)** - Comprehensive troubleshooting guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Common Q&A

## 📄 License

[Your License Here]

---

**RiskWise AI** - Empowering Early Intervention, Enabling Success 🚀
