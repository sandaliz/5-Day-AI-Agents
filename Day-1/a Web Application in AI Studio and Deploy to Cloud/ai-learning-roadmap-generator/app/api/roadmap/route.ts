import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Ensure the API Key is accessed safely
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is missing on the server. Please set it in the Secrets panel." },
        { status: 500 }
      );
    }

    const { topic, level, duration } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return NextResponse.json(
        { error: "Please provide a valid learning topic." },
        { status: 400 }
      );
    }

    // Initialize the Google Gen AI SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const userPrompt = `Generate a highly structured and complete learning roadmap for the topic: "${topic}".
Target Difficulty Level: ${level || "Beginner"}.
Preferred Duration: ${duration || "Default duration based on topic depth"}.

Requirements for the text content:
1. Be technical, helpful, structured, and informative.
2. ABSOLUTELY DO NOT use any emojis anywhere in the text. Ensure no characters like emojis are generated in titles, content, keys, explanation, day descriptions, or anywhere.
3. Keep the content focused, precise, and practical.
`;

    // Request-response schema for content generation
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "You are an elite educational architect. Your task is to generate customized, high-quality, step-by-step learning roadmaps, key technical concepts, realistic recommended projects, and weekly schedules without any emojis or gradient details. Output clean, structured JSON conforming to the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { 
              type: Type.STRING, 
              description: "The topic of the learning roadmap." 
            },
            difficultyLevel: { 
              type: Type.STRING, 
              description: "The targeted difficulty (e.g. Beginner, Intermediate, Advanced)." 
            },
            estimatedTimeToComplete: { 
              type: Type.STRING, 
              description: "Estimated total time to finish (e.g. 6 Weeks, 3 Months)." 
            },
            roadmap: {
              type: Type.ARRAY,
              description: "Sequential phases of the study roadmap.",
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseNumber: { type: Type.INTEGER },
                  phaseTitle: { type: Type.STRING, description: "Do not use emojis in the title." },
                  phaseDescription: { type: Type.STRING, description: "Explanation of the phase. No emojis." },
                  milestone: { type: Type.STRING, description: "Specific verifiable milestone key result. No emojis." },
                  steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING, description: "Actionable study steps." }
                  }
                },
                required: ["phaseNumber", "phaseTitle", "phaseDescription", "milestone", "steps"]
              }
            },
            keyConcepts: {
              type: Type.ARRAY,
              description: "Essential underlying theories and features the student must grasp.",
              items: {
                type: Type.OBJECT,
                properties: {
                  conceptName: { type: Type.STRING },
                  explanation: { type: Type.STRING, description: "Technical plain explanation. No emojis." },
                  importance: { type: Type.STRING, description: "Why this is critical. No emojis." }
                },
                required: ["conceptName", "explanation", "importance"]
              }
            },
            recommendedProjects: {
              type: Type.ARRAY,
              description: "Practical projects to build and solidify the knowledge.",
              items: {
                type: Type.OBJECT,
                properties: {
                  projectName: { type: Type.STRING },
                  projectDescription: { type: Type.STRING, description: "What the project is about. No emojis." },
                  keyFeatures: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING, description: "Features to implement. No emojis." }
                  },
                  suggestedTechStack: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["projectName", "projectDescription", "keyFeatures", "suggestedTechStack"]
              }
            },
            weeklyStudySchedule: {
              type: Type.ARRAY,
              description: "Week-by-week timeline representing study intervals.",
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  weekTopic: { type: Type.STRING },
                  weeklyObjective: { type: Type.STRING, description: "Goal of the week. No emojis." },
                  timeCommitment: { type: Type.STRING, description: "Suggested hours per week. No emojis." },
                  dailyBreakdown: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.STRING, description: "Day window, e.g. Day 1, Day 2-3, Weekend." },
                        focus: { type: Type.STRING, description: "Focus area. No emojis." },
                        tasks: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING, description: "Tasks for this period. No emojis." }
                        }
                      },
                      required: ["day", "focus", "tasks"]
                    }
                  }
                },
                required: ["weekNumber", "weekTopic", "weeklyObjective", "timeCommitment", "dailyBreakdown"]
              }
            }
          },
          required: ["topic", "difficultyLevel", "estimatedTimeToComplete", "roadmap", "keyConcepts", "recommendedProjects", "weeklyStudySchedule"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text content received from the model.");
    }

    // Try parsing the JSON response
    const roadmapData = JSON.parse(response.text.trim());
    return NextResponse.json(roadmapData);

  } catch (error: any) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while generating the roadmap." },
      { status: 500 }
    );
  }
}
