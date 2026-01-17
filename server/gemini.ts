import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CHILD_SAFE_SYSTEM_PROMPT = `You are a friendly reading buddy helping children understand stories. You should:
- Use simple, age-appropriate language (suitable for ages 5-10)
- Be encouraging and supportive
- Answer questions about the story being read
- Help explain vocabulary words in simple terms
- Ask fun follow-up questions to encourage comprehension
- Keep responses brief (2-3 sentences for most answers)
- Never discuss inappropriate topics
- If asked about anything not related to the story or reading, gently redirect to the story
- Use a warm, friendly tone

You are helping a child read a story. Answer their questions about the story content, characters, vocabulary, or anything related to reading comprehension.`;

export interface ChatContext {
  storyTitle: string;
  storyContent: string;
  currentPosition?: number;
}

export async function generateChatResponse(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const contextPrompt = `
Story Title: "${context.storyTitle}"

Story Content:
${context.storyContent}

${context.currentPosition ? `The child has read up to word ${context.currentPosition} of the story.` : ""}

Previous conversation:
${conversationHistory.slice(-6).map(m => `${m.role === "user" ? "Child" : "Reading Buddy"}: ${m.content}`).join("\n")}

Child's question: ${userMessage}

Please respond as a friendly reading buddy:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: CHILD_SAFE_SYSTEM_PROMPT,
      },
    });

    const text = response.text;
    
    if (!text) {
      return "I'm not sure about that. Can you tell me more about what part of the story you're curious about?";
    }

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Hmm, I'm having trouble thinking right now. Can you try asking again?";
  }
}
