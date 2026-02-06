import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSessionSchema, 
  insertReadingProgressSchema,
  insertMathProgressSchema,
  insertVibeStateSchema,
  insertChatMessageSchema
} from "@shared/schema";
import { generateChatResponse, generateMathHelp, generateQuiz, evaluateQuizPerformance } from "./gemini";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import express from "express";

const execFileAsync = promisify(execFile);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

function splitIntoSections(text: string, targetWordsPerSection: number = 300): Array<{ title: string; content: string; wordCount: number }> {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sections: Array<{ title: string; content: string; wordCount: number }> = [];
  let currentContent = "";
  let currentWordCount = 0;
  let sectionIndex = 1;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    
    if (currentWordCount + words.length > targetWordsPerSection && currentContent.trim().length > 0) {
      sections.push({
        title: `Section ${sectionIndex}`,
        content: currentContent.trim(),
        wordCount: currentWordCount,
      });
      sectionIndex++;
      currentContent = trimmed;
      currentWordCount = words.length;
    } else {
      currentContent += (currentContent ? "\n\n" : "") + trimmed;
      currentWordCount += words.length;
    }
  }

  if (currentContent.trim().length > 0) {
    sections.push({
      title: `Section ${sectionIndex}`,
      content: currentContent.trim(),
      wordCount: currentWordCount,
    });
  }

  if (sections.length === 0) {
    sections.push({
      title: "Section 1",
      content: text.trim(),
      wordCount: text.trim().split(/\s+/).length,
    });
  }

  return sections;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/user/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/sessions/:userId", async (req, res) => {
    try {
      const sessions = await storage.getSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const parsed = insertSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const session = await storage.createSession(parsed.data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.get("/api/reading-progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getReadingProgress(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reading progress" });
    }
  });

  app.post("/api/reading-progress", async (req, res) => {
    try {
      const parsed = insertReadingProgressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const progress = await storage.createReadingProgress(parsed.data);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to create reading progress" });
    }
  });

  app.patch("/api/reading-progress/:id", async (req, res) => {
    try {
      const progress = await storage.updateReadingProgress(req.params.id, req.body);
      if (!progress) {
        return res.status(404).json({ error: "Reading progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reading progress" });
    }
  });

  app.get("/api/math-progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getMathProgress(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch math progress" });
    }
  });

  app.post("/api/math-progress", async (req, res) => {
    try {
      const parsed = insertMathProgressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const progress = await storage.createMathProgress(parsed.data);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to create math progress" });
    }
  });

  app.patch("/api/math-progress/:id", async (req, res) => {
    try {
      const progress = await storage.updateMathProgress(req.params.id, req.body);
      if (!progress) {
        return res.status(404).json({ error: "Math progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update math progress" });
    }
  });

  app.get("/api/vibe-states/:userId", async (req, res) => {
    try {
      const states = await storage.getVibeStates(req.params.userId);
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vibe states" });
    }
  });

  app.get("/api/vibe-states/session/:sessionId", async (req, res) => {
    try {
      const states = await storage.getVibeStatesBySession(req.params.sessionId);
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vibe states" });
    }
  });

  app.post("/api/vibe-states", async (req, res) => {
    try {
      const parsed = insertVibeStateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const state = await storage.createVibeState(parsed.data);
      res.status(201).json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to create vibe state" });
    }
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stats = await storage.getDashboardStats(req.params.userId);
      const sessions = await storage.getSessions(req.params.userId);
      const vibeStates = await storage.getVibeStates(req.params.userId);
      const readingProgress = await storage.getReadingProgress(req.params.userId);
      const mathProgress = await storage.getMathProgress(req.params.userId);

      const { password, ...safeUser } = user;

      res.json({
        user: safeUser,
        stats,
        recentSessions: sessions.slice(0, 10),
        recentVibes: vibeStates.slice(0, 10),
        readingProgress: readingProgress.slice(0, 5),
        mathProgress: mathProgress.slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/chat/:userId/:storyId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.userId, req.params.storyId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, storyId, message, currentPosition } = req.body;
      
      if (!userId || !storyId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (typeof message !== "string" || message.length > 500) {
        return res.status(400).json({ error: "Invalid message format" });
      }

      const userMessageData = {
        userId,
        storyId,
        role: "user" as const,
        content: message,
      };

      const parsed = insertChatMessageSchema.safeParse(userMessageData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }

      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      const userMsg = await storage.createChatMessage(parsed.data);

      const history = await storage.getChatMessages(userId, storyId);

      const aiResponse = await generateChatResponse(
        message,
        {
          storyTitle: story.title,
          storyContent: story.content,
          currentPosition,
        },
        history.map(m => ({ role: m.role, content: m.content }))
      );

      const assistantMessageData = {
        userId,
        storyId,
        role: "assistant",
        content: aiResponse,
      };
      const assistantMsg = await storage.createChatMessage(assistantMessageData);

      res.status(201).json({
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  app.delete("/api/chat/:userId/:storyId", async (req, res) => {
    try {
      await storage.clearChatMessages(req.params.userId, req.params.storyId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear chat messages" });
    }
  });

  app.get("/api/child-dashboard/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stats = await storage.getDashboardStats(req.params.userId);
      const sessions = await storage.getSessions(req.params.userId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= today && sessionDate < tomorrow;
      });

      const todayReadingTime = todaySessions
        .filter(s => s.type === "reading")
        .reduce((acc, s) => acc + (s.duration || 0), 0);

      const mathProgress = await storage.getMathProgress(req.params.userId);
      const todayMathProblems = mathProgress.length > 0 
        ? mathProgress[mathProgress.length - 1].problemsAttempted || 0
        : 0;

      const { password, ...safeUser } = user;

      res.json({
        user: safeUser,
        todayGoals: {
          readingMinutes: Math.min(todayReadingTime, 20),
          targetReadingMinutes: 20,
          mathProblems: Math.min(todayMathProblems, 10),
          targetMathProblems: 10,
        },
        currentStreak: stats.currentStreak,
        recentAchievements: [
          "Read for 5 days in a row!",
          "Solved 50 math problems!",
          "Perfect accuracy streak!",
        ],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child dashboard data" });
    }
  });

  // Agentic Math Help API - powered by Gemini
  app.post("/api/math-help", async (req, res) => {
    try {
      const { problem, userAnswer, correctAnswer, isCorrect } = req.body;
      
      // Validate request body
      if (typeof problem !== "string" || problem.length === 0 || problem.length > 100) {
        return res.status(400).json({ error: "Invalid problem format" });
      }
      if (typeof userAnswer !== "number" && typeof userAnswer !== "string") {
        return res.status(400).json({ error: "Invalid userAnswer format" });
      }
      if (typeof correctAnswer !== "number" && typeof correctAnswer !== "string") {
        return res.status(400).json({ error: "Invalid correctAnswer format" });
      }
      if (typeof isCorrect !== "boolean") {
        return res.status(400).json({ error: "Invalid isCorrect format" });
      }

      const feedback = await generateMathHelp(
        problem,
        String(userAnswer),
        String(correctAnswer),
        isCorrect
      );

      res.json({ feedback });
    } catch (error) {
      console.error("Math help error:", error);
      res.status(500).json({ error: "Failed to generate math help" });
    }
  });

  // Quiz API - Generate quiz for a story (supports section-based quizzes)
  app.post("/api/quiz/generate/:storyId", async (req, res) => {
    try {
      const { storyId } = req.params;
      const { userId, sectionIndex, sectionContent: clientSectionContent } = req.body;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "User ID is required" });
      }

      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      let quizContent = story.content;
      let quizTitle = story.title;

      if (sectionIndex !== undefined && story.sections) {
        const sections = JSON.parse(story.sections);
        const section = sections[sectionIndex];
        if (section) {
          quizContent = section.content;
          quizTitle = `${story.title} - ${section.title}`;
        }
      } else if (clientSectionContent && typeof clientSectionContent === "string") {
        quizContent = clientSectionContent;
      }

      const questions = await generateQuiz(quizTitle, quizContent, 3);
      
      const quiz = await storage.createQuiz({
        userId,
        storyId,
        questions: JSON.stringify(questions),
        totalQuestions: questions.length,
      });

      res.status(201).json({
        quizId: quiz.id,
        questions: questions.map((q, i) => ({
          id: `q-${i}`,
          question: q.question,
          options: q.options
        }))
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // Quiz API - Submit answers
  app.post("/api/quiz/:quizId/submit", async (req, res) => {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;

      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: "Answers must be an array" });
      }

      const quiz = await storage.getQuizzes("user-1").then(quizzes => 
        quizzes.find(q => q.id === quizId)
      );
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const questions = JSON.parse(quiz.questions);
      let score = 0;
      const wrongQuestions: string[] = [];

      answers.forEach((answer: number, index: number) => {
        if (questions[index] && answer === questions[index].correctAnswer) {
          score++;
        } else if (questions[index]) {
          wrongQuestions.push(questions[index].question);
        }
      });

      const passed = score >= Math.ceil(quiz.totalQuestions * 0.7);
      
      // Get story for feedback
      const story = await storage.getStory(quiz.storyId);
      const storyTitle = story?.title || "the story";

      // Get AI feedback
      const feedback = await evaluateQuizPerformance(
        storyTitle,
        score,
        quiz.totalQuestions,
        wrongQuestions
      );

      // Update quiz with results
      await storage.updateQuiz(quizId, {
        answers: JSON.stringify(answers),
        score,
        passed,
        completedAt: new Date(),
      });

      res.json({
        score,
        totalQuestions: quiz.totalQuestions,
        passed,
        feedback,
        correctAnswers: questions.map((q: any) => q.correctAnswer)
      });
    } catch (error) {
      console.error("Quiz submission error:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // PDF Upload API
  app.post("/api/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const userId = req.body.userId || "user-1";

      const parser = new PDFParse({ data: req.file.buffer });
      const textResult = await parser.getText();
      const text = textResult.text;
      await parser.destroy();

      if (!text || text.trim().length < 50) {
        return res.status(400).json({ error: "Could not extract enough text from the PDF. The file might be scanned or image-based." });
      }

      const fileName = req.file.originalname.replace(/\.pdf$/i, "");
      const sections = splitIntoSections(text, 300);
      const totalWords = sections.reduce((acc, s) => acc + s.wordCount, 0);

      const story = await storage.createStory({
        title: fileName,
        content: text,
        difficulty: 1,
        wordCount: totalWords,
        sourceType: "pdf",
        sections: JSON.stringify(sections),
        fileName: req.file.originalname,
        uploadedBy: userId,
      });

      res.status(201).json({
        story: {
          id: story.id,
          title: story.title,
          wordCount: totalWords,
          sectionCount: sections.length,
          fileName: story.fileName,
          sourceType: story.sourceType,
        },
        sections: sections.map((s, i) => ({
          index: i,
          title: s.title,
          wordCount: s.wordCount,
        })),
      });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      if (error.message === "Only PDF files are allowed") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to process PDF file" });
    }
  });

  // Delete a story (uploaded PDFs)
  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      await storage.deleteStory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  // Serve manim-cache static files
  const manimCacheDir = path.resolve(process.cwd(), "public", "manim-cache");
  if (!fs.existsSync(manimCacheDir)) {
    fs.mkdirSync(manimCacheDir, { recursive: true });
  }
  app.use("/manim-cache", express.static(manimCacheDir));

  // Math Visualization API - Generate Manim animation
  app.post("/api/math-visualization", async (req, res) => {
    try {
      const { type, operand1, operand2, answer, style } = req.body;

      if (!type || operand1 === undefined || operand2 === undefined || answer === undefined) {
        return res.status(400).json({ error: "Missing required fields: type, operand1, operand2, answer" });
      }

      const validTypes = ["addition", "subtraction", "multiplication", "division"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
      }

      if (typeof operand1 !== "number" || typeof operand2 !== "number" || typeof answer !== "number") {
        return res.status(400).json({ error: "operand1, operand2, and answer must be numbers" });
      }

      const validStyles = ["default", "numberline"];
      const sanitizedStyle = validStyles.includes(style) ? style : "default";

      const safeOp1 = Math.max(0, Math.min(1000, Math.abs(Math.floor(operand1))));
      const safeOp2 = Math.max(0, Math.min(1000, Math.abs(Math.floor(operand2))));
      const safeAnswer = Math.max(-1000, Math.min(10000, Math.floor(answer)));

      const problemData = JSON.stringify({
        type,
        operand1: safeOp1,
        operand2: safeOp2,
        answer: safeAnswer,
        style: sanitizedStyle,
      });

      const scriptPath = path.resolve(process.cwd(), "server", "manim", "render.py");

      const { stdout, stderr } = await execFileAsync(
        "python3",
        [scriptPath, problemData],
        { timeout: 90000, cwd: process.cwd() }
      );

      if (stderr) {
        console.warn("Manim stderr:", stderr.slice(0, 500));
      }

      const trimmed = stdout.trim();
      if (!trimmed) {
        console.error("Manim render produced no output");
        return res.status(500).json({ error: "Failed to generate visualization" });
      }

      const lines = trimmed.split("\n");
      const lastLine = lines[lines.length - 1];

      let result;
      try {
        result = JSON.parse(lastLine);
      } catch {
        console.error("Failed to parse Manim output:", lastLine.slice(0, 200));
        return res.status(500).json({ error: "Failed to generate visualization" });
      }

      if (result.error) {
        console.error("Manim render error:", result.error);
        return res.status(500).json({ error: "Failed to generate visualization" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Math visualization error:", error.message);
      if (error.killed) {
        return res.status(504).json({ error: "Visualization rendering timed out" });
      }
      res.status(500).json({ error: "Failed to generate visualization" });
    }
  });

  // Quiz API - Get user's quiz history
  app.get("/api/quiz/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const quizzes = await storage.getQuizzes(userId);
      
      // Get story titles for each quiz
      const quizzesWithStories = await Promise.all(
        quizzes.filter(q => q.completedAt).map(async (quiz) => {
          const story = await storage.getStory(quiz.storyId);
          return {
            quizId: quiz.id,
            storyId: quiz.storyId,
            storyTitle: story?.title || "Unknown Story",
            score: quiz.score,
            totalQuestions: quiz.totalQuestions,
            passed: quiz.passed,
            completedAt: quiz.completedAt,
          };
        })
      );

      res.json(quizzesWithStories);
    } catch (error) {
      console.error("Quiz history error:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  return httpServer;
}
