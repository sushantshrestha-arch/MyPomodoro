import { GoogleGenAI } from "@google/genai";
import { Priority, Task } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please check your secrets in AI Studio.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function organizeDay(input: string): Promise<Task[]> {
  const ai = getAI();
  const prompt = `
    You are an AI Productivity Assistant. The user has given you a messy description of their day:
    "${input}"
    
    Transform this into a structured list of tasks for Pomodoro sessions.
    Each task needs:
    - title: A concise, actionable title.
    - priority: One of "high", "medium", or "low".
    - estimatedBlocks: Total number of cycles.
    - subTasks: An array of objects with { title: string, estimatedMinutes: number }. Usually 25 minutes per subtask/cycle.
    
    Return ONLY a valid JSON array of objects with these keys. No markdown, no prose.
    Example: [{"title": "Design landing page", "priority": "high", "estimatedBlocks": 3, "subTasks": [{"title": "Wireframing", "estimatedMinutes": 25}, {"title": "Visual Design", "estimatedMinutes": 50}]}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text || "";
    // Basic cleanup in case Gemini adds markdown blocks
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedTasks = JSON.parse(jsonString);
    
    return parsedTasks.map((t: any) => ({
      ...t,
      id: Math.random().toString(36).substring(7),
      completedBlocks: 0,
      subTasks: (t.subTasks || []).map((st: any) => ({
        ...st,
        id: Math.random().toString(36).substring(7),
        completed: false
      }))
    }));
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
}
