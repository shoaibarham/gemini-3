import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("child"),
  avatarUrl: text("avatar_url"),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  type: text("type").notNull(),
  duration: integer("duration").default(0),
});

export const readingProgress = pgTable("reading_progress", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  sessionId: varchar("session_id", { length: 36 }),
  storyId: varchar("story_id", { length: 36 }).notNull(),
  wordsRead: integer("words_read").default(0),
  accuracy: integer("accuracy").default(0),
  currentPosition: integer("current_position").default(0),
  completed: boolean("completed").default(false),
});

export const mathProgress = pgTable("math_progress", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  sessionId: varchar("session_id", { length: 36 }),
  problemsAttempted: integer("problems_attempted").default(0),
  problemsCorrect: integer("problems_correct").default(0),
  currentLevel: integer("current_level").default(1),
  streak: integer("streak").default(0),
});

export const vibeStates = pgTable("vibe_states", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  sessionId: varchar("session_id", { length: 36 }),
  state: text("state").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes"),
});

export const stories = pgTable("stories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  difficulty: integer("difficulty").default(1),
  wordCount: integer("word_count").default(0),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  storyId: varchar("story_id", { length: 36 }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  storyId: varchar("story_id", { length: 36 }).notNull(),
  questions: text("questions").notNull(),
  answers: text("answers"),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export const insertReadingProgressSchema = createInsertSchema(readingProgress).omit({ id: true });
export const insertMathProgressSchema = createInsertSchema(mathProgress).omit({ id: true });
export const insertVibeStateSchema = createInsertSchema(vibeStates).omit({ id: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type InsertMathProgress = z.infer<typeof insertMathProgressSchema>;
export type MathProgress = typeof mathProgress.$inferSelect;
export type InsertVibeState = z.infer<typeof insertVibeStateSchema>;
export type VibeState = typeof vibeStates.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type VibeStateType = "focused" | "happy" | "confused" | "frustrated" | "tired" | "neutral";

export interface ChildDashboardData {
  user: User;
  todayGoals: {
    readingMinutes: number;
    targetReadingMinutes: number;
    mathProblems: number;
    targetMathProblems: number;
  };
  recentAchievements: string[];
  currentStreak: number;
}

export interface ParentDashboardData {
  child: User;
  readingStats: {
    totalWordsRead: number;
    averageAccuracy: number;
    sessionsThisWeek: number;
  };
  mathStats: {
    totalProblemsCorrect: number;
    averageAccuracy: number;
    currentLevel: number;
  };
  recentVibes: VibeState[];
  recentSessions: Session[];
}

export interface ReadingSessionData {
  story: Story;
  progress: ReadingProgress;
  currentWord: number;
  isPlaying: boolean;
}

export interface MathProblem {
  id: string;
  type: "addition" | "subtraction" | "multiplication" | "division";
  operand1: number;
  operand2: number;
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface MathSessionData {
  currentProblem: MathProblem;
  problemsCompleted: number;
  correctAnswers: number;
  streak: number;
  level: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizResult {
  quizId: string;
  storyId: string;
  storyTitle: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: Date;
}
