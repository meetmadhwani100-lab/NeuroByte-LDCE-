import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testGemini() {
  console.log("Testing Gemini API Key...");
  const key = process.env.GEMINI_API_KEY_1;
  if (!key) {
    console.error("No API key found!");
    return;
  }
  console.log("Key starts with:", key.substring(0, 10));
  
  try {
    const ai = new GoogleGenerativeAI(key);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello");
    console.log("✅ API is WORKING! Response:", result.response.text());
  } catch (e: any) {
    console.error("❌ API ERROR:", e.message);
  }
}

testGemini();
