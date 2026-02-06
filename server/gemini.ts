import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GEMINI_MODEL = "gemini-3-pro-preview";
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

async function callGeminiWithRetry(
  params: { model: string; contents: string; config?: any },
  maxRetries: number = 1
): Promise<any> {
  const modelsToTry = [params.model, ...FALLBACK_MODELS];
  
  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({ ...params, model });
        if (model !== params.model) {
          console.log(`Gemini: used fallback model ${model} (primary ${params.model} was rate limited)`);
        }
        return response;
      } catch (error: any) {
        if (error?.status === 429) {
          if (attempt < maxRetries) {
            const retryMatch = error?.message?.match(/retry in (\d+(?:\.\d+)?)s/i);
            const waitTime = retryMatch ? Math.min(parseFloat(retryMatch[1]), 15) * 1000 : 5000;
            console.log(`Gemini ${model} rate limited, waiting ${Math.round(waitTime / 1000)}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            console.log(`Gemini ${model} quota exhausted, trying next model...`);
            break;
          }
        } else {
          throw error;
        }
      }
    }
  }
  
  throw new Error("All Gemini models exhausted their quotas");
}

// Enhanced agentic system prompt for Gemini
const AGENTIC_READING_BUDDY_PROMPT = `You are an intelligent, proactive AI Reading Buddy designed to help children learn and enjoy reading. You operate in an "agentic" mode - meaning you should be:

1. PROACTIVE: Don't just answer questions - suggest related concepts, ask follow-up questions, and guide the learning journey
2. CONTEXTUAL: Use the story context to provide rich, relevant explanations
3. EDUCATIONAL: Every response should teach something while being engaging
4. ENCOURAGING: Celebrate curiosity and make learning feel like an adventure

Your capabilities include:
- Explaining vocabulary words in child-friendly terms with examples
- Helping children understand story elements (characters, plot, setting, themes)
- Making connections between the story and real life
- Asking thought-provoking questions to deepen comprehension
- Suggesting what to look for as they continue reading
- Providing fun facts related to story elements

Guidelines:
- Use simple, age-appropriate language (suitable for ages 5-10)
- Keep responses brief but meaningful (2-4 sentences for most answers)
- Use enthusiasm and positive energy
- Include examples from everyday life when explaining concepts
- End responses with an engaging question or suggestion when appropriate
- If asked about anything inappropriate or off-topic, gently redirect to the story

You are powered by Gemini and should demonstrate advanced reasoning while keeping responses child-friendly.`;

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
    // Detect if this is a word definition request
    const isWordDefinition = userMessage.toLowerCase().includes("what does") && 
                             userMessage.toLowerCase().includes("mean");
    
    // Extract the word being asked about if it's a definition request
    const wordMatch = userMessage.match(/["']([^"']+)["']/);
    const targetWord = wordMatch ? wordMatch[1] : null;

    // Build context with reading position awareness
    const wordsArray = context.storyContent.split(/\s+/).filter(w => w.trim());
    const readProgress = context.currentPosition 
      ? Math.round((context.currentPosition / wordsArray.length) * 100)
      : 0;
    
    const surroundingContext = context.currentPosition 
      ? wordsArray.slice(
          Math.max(0, context.currentPosition - 15), 
          Math.min(wordsArray.length, context.currentPosition + 15)
        ).join(" ")
      : "";

    let agenticPrompt = `
STORY CONTEXT:
Title: "${context.storyTitle}"

Full Story:
${context.storyContent}

READING PROGRESS:
The child has read approximately ${readProgress}% of the story${context.currentPosition ? ` (around word ${context.currentPosition})` : ""}.
${surroundingContext ? `They are currently near this part: "...${surroundingContext}..."` : ""}

CONVERSATION HISTORY:
${conversationHistory.slice(-8).map(m => 
  `${m.role === "user" ? "Child" : "AI Buddy"}: ${m.content}`
).join("\n") || "This is the start of the conversation."}

CURRENT REQUEST:
Child: ${userMessage}

`;

    // Add special instructions for word definitions
    if (isWordDefinition && targetWord) {
      agenticPrompt += `
SPECIAL INSTRUCTION - WORD DEFINITION:
The child is asking about the word "${targetWord}". Provide:
1. A simple, child-friendly definition
2. An example using the word in a sentence
3. How this word is used in the story context
4. A fun fact or related word if appropriate

Be enthusiastic about their curiosity!
`;
    } else {
      agenticPrompt += `
AGENTIC RESPONSE GUIDELINES:
1. Answer their question thoroughly but concisely
2. Connect your answer to the story when possible
3. End with an engaging follow-up question or fun observation
4. If they seem stuck, offer helpful hints or encouragement
`;
    }

    agenticPrompt += `
Respond as an enthusiastic, intelligent AI Reading Buddy:`;

    const response = await callGeminiWithRetry({
      model: GEMINI_MODEL,
      contents: agenticPrompt,
      config: {
        systemInstruction: AGENTIC_READING_BUDDY_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const text = response.text;
    
    if (!text) {
      return "Hmm, that's a great question! Can you tell me more about what part of the story made you curious?";
    }

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Oops! My thinking cap slipped off for a moment. Can you ask me again? I really want to help!";
  }
}

// New agentic function for proactive reading suggestions
export async function generateReadingSuggestion(
  context: ChatContext,
  progressPercent: number
): Promise<string> {
  try {
    const prompt = `
Based on a child reading "${context.storyTitle}" who is ${progressPercent}% through the story, generate ONE short, encouraging observation or question to keep them engaged.

Story excerpt around their current position:
${context.storyContent.slice(0, 500)}...

Generate a brief (1 sentence) proactive suggestion or observation that:
- Encourages them to keep reading
- Highlights something interesting coming up
- Or asks a simple comprehension question

Keep it under 15 words and very child-friendly.`;

    const response = await callGeminiWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 50,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return "";
  }
}

// Quiz generation powered by Gemini
export async function generateQuiz(
  storyTitle: string,
  storyContent: string,
  numQuestions: number = 3
): Promise<Array<{ question: string; options: string[]; correctAnswer: number }>> {
  try {
    const prompt = `Generate ${numQuestions} reading comprehension quiz questions for a child (ages 5-10) based on this story.

STORY TITLE: "${storyTitle}"

STORY CONTENT:
${storyContent}

Requirements:
1. Questions should test understanding of the story (characters, events, themes)
2. Each question should have exactly 4 answer options
3. Options should be simple and clear for children
4. Mix different types: who/what/where/why questions
5. One option must be clearly correct

Return ONLY a valid JSON array in this exact format (no other text):
[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Where correctAnswer is the index (0-3) of the correct option.`;

    const response = await callGeminiWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 800,
      },
    });

    const text = response.text || "";
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.slice(0, numQuestions);
      }
    }

    // Fallback questions if parsing fails
    return getDefaultQuestions(storyTitle);
  } catch (error) {
    console.error("Gemini quiz generation error:", error);
    return getDefaultQuestions(storyTitle);
  }
}

function getDefaultQuestions(storyTitle: string): Array<{ question: string; options: string[]; correctAnswer: number }> {
  return [
    {
      question: "What was the main character doing in the story?",
      options: ["Going on an adventure", "Sleeping at home", "Going to school", "Eating dinner"],
      correctAnswer: 0
    },
    {
      question: "How did the story end?",
      options: ["Sadly", "Happily", "Mysteriously", "Suddenly"],
      correctAnswer: 1
    },
    {
      question: "What is this story about?",
      options: ["A big city", "Friendship and adventure", "A scary monster", "A boring day"],
      correctAnswer: 1
    }
  ];
}

// Evaluate quiz answers using AI
export async function evaluateQuizPerformance(
  storyTitle: string,
  score: number,
  totalQuestions: number,
  wrongQuestions: string[]
): Promise<string> {
  try {
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70;
    
    const prompt = passed
      ? `A child just completed a quiz about "${storyTitle}" and scored ${score}/${totalQuestions} (${percentage}%).
         Generate a short (2 sentences) celebratory message that:
         - Congratulates them on their excellent comprehension
         - Encourages them to keep reading
         Keep it enthusiastic and child-friendly!`
      : `A child just completed a quiz about "${storyTitle}" and scored ${score}/${totalQuestions} (${percentage}%).
         They had trouble with these concepts: ${wrongQuestions.join(", ") || "some questions"}.
         Generate a kind, encouraging message (2-3 sentences) that:
         - Praises their effort
         - Gently suggests re-reading parts of the story
         - Encourages them that they can try again
         Be supportive and never make them feel bad!`;

    const response = await callGeminiWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly, encouraging reading tutor for children ages 5-10. Be positive, clear, and supportive.",
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    });

    return response.text || (passed ? "Great job on the quiz!" : "Good try! You can always try again.");
  } catch (error) {
    console.error("Gemini quiz evaluation error:", error);
    return score >= Math.ceil(totalQuestions * 0.7) 
      ? "Wonderful work on the quiz! You really understood the story!" 
      : "Nice effort! Try reading the story again and you'll do even better next time!";
  }
}

// Math helper powered by Gemini
export async function generateMathHelp(
  problem: string,
  userAnswer: string,
  correctAnswer: string,
  isCorrect: boolean
): Promise<string> {
  try {
    const prompt = isCorrect
      ? `A child just correctly solved: ${problem} = ${correctAnswer}
         Generate a brief (1-2 sentences) celebratory message that:
         - Praises their effort
         - Maybe mentions a quick math tip or fun fact
         Keep it enthusiastic and child-friendly!`
      : `A child answered "${userAnswer}" for the problem: ${problem}
         The correct answer is ${correctAnswer}.
         Generate a kind, encouraging explanation (2-3 sentences) that:
         - Gently explains why their answer wasn't quite right
         - Shows how to get the correct answer step by step
         - Encourages them to try again
         Be supportive and never make them feel bad!`;

    const response = await callGeminiWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly, encouraging math tutor for children ages 5-10. Be positive, clear, and supportive.",
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    });

    return response.text || (isCorrect ? "Great job!" : "Good try! Let's figure this out together.");
  } catch (error) {
    console.error("Gemini math help error:", error);
    return isCorrect ? "Excellent work!" : "That's okay! Let's try another one.";
  }
}
