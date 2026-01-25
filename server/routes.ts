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

  // Quiz API - Generate quiz for a story
  app.post("/api/quiz/generate/:storyId", async (req, res) => {
    try {
      const { storyId } = req.params;
      const { userId } = req.body;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "User ID is required" });
      }

      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Check if quiz already exists for this user/story
      const existingQuiz = await storage.getQuizByStory(userId, storyId);
      if (existingQuiz && !existingQuiz.completedAt) {
        // Return existing incomplete quiz
        const questions = JSON.parse(existingQuiz.questions);
        return res.json({ 
          quizId: existingQuiz.id, 
          questions: questions.map((q: any, i: number) => ({
            id: `q-${i}`,
            question: q.question,
            options: q.options
          }))
        });
      }

      // Generate new quiz questions
      const questions = await generateQuiz(story.title, story.content, 3);
      
      // Store quiz
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
