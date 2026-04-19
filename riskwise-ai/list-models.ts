import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listModels() {
  const key = process.env.GEMINI_API_KEY_1;
  if (!key) return;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log("AVAILABLE MODELS:");
    if (data.models) {
      data.models.forEach((m: any) => console.log(m.name));
    } else {
      console.log(data);
    }
  } catch(e) { console.error(e); }
}

listModels();
