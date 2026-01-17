import { 
  type User, type InsertUser,
  type Session, type InsertSession,
  type ReadingProgress, type InsertReadingProgress,
  type MathProgress, type InsertMathProgress,
  type VibeState, type InsertVibeState,
  type Story, type InsertStory,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSessions(userId: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;

  getReadingProgress(userId: string): Promise<ReadingProgress[]>;
  getReadingProgressBySession(sessionId: string): Promise<ReadingProgress | undefined>;
  createReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
  updateReadingProgress(id: string, updates: Partial<ReadingProgress>): Promise<ReadingProgress | undefined>;

  getMathProgress(userId: string): Promise<MathProgress[]>;
  getMathProgressBySession(sessionId: string): Promise<MathProgress | undefined>;
  createMathProgress(progress: InsertMathProgress): Promise<MathProgress>;
  updateMathProgress(id: string, updates: Partial<MathProgress>): Promise<MathProgress | undefined>;

  getVibeStates(userId: string): Promise<VibeState[]>;
  getVibeStatesBySession(sessionId: string): Promise<VibeState[]>;
  createVibeState(state: InsertVibeState): Promise<VibeState>;

  getStories(): Promise<Story[]>;
  getStory(id: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;

  getChatMessages(userId: string, storyId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(userId: string, storyId: string): Promise<void>;

  getDashboardStats(userId: string): Promise<{
    totalReadingTime: number;
    totalMathProblems: number;
    readingAccuracy: number;
    mathAccuracy: number;
    currentStreak: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private readingProgress: Map<string, ReadingProgress>;
  private mathProgress: Map<string, MathProgress>;
  private vibeStates: Map<string, VibeState>;
  private stories: Map<string, Story>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.readingProgress = new Map();
    this.mathProgress = new Map();
    this.vibeStates = new Map();
    this.stories = new Map();
    this.chatMessages = new Map();

    this.seedData();
  }

  private seedData() {
    const defaultUser: User = {
      id: "user-1",
      username: "alex",
      password: "password",
      name: "Alex",
      role: "child",
      avatarUrl: null,
    };
    this.users.set(defaultUser.id, defaultUser);

    const parentUser: User = {
      id: "user-2",
      username: "parent",
      password: "password",
      name: "Parent",
      role: "parent",
      avatarUrl: null,
    };
    this.users.set(parentUser.id, parentUser);

    const story1: Story = {
      id: "story-1",
      title: "The Brave Little Fox",
      content: `Once upon a time, in a green forest, there lived a little fox named Finn. 
      
Finn had bright orange fur and curious brown eyes. He loved to explore the forest every day.

One morning, Finn woke up early. The sun was shining through the trees. Birds were singing their happy songs.

"Today will be a great adventure!" said Finn.

He ran through the meadow, jumping over flowers. The butterflies danced around him.

Finn found a stream with cool, clear water. He stopped to take a drink. A friendly frog said hello.

"Where are you going, little fox?" asked the frog.

"I am looking for the rainbow pond," said Finn. "Do you know where it is?"

The frog smiled. "Follow the path by the old oak tree. You will find it there."

Finn thanked the frog and ran along the path. Soon, he saw a beautiful pond. The water sparkled like a rainbow!

"I found it!" cheered Finn. He was so happy.

Finn played by the rainbow pond all day. When the sun began to set, he went home.

His mother was waiting. "Did you have a good adventure?" she asked.

"The best adventure ever!" said Finn with a big smile.

The End.`,
      difficulty: 1,
      wordCount: 200,
    };
    this.stories.set(story1.id, story1);

    const story2: Story = {
      id: "story-2",
      title: "The Friendly Dragon",
      content: `In a land far away, there was a small dragon named Spark. Unlike other dragons, Spark was very friendly.

Spark had green scales that glittered in the sun. His wings were small but strong.

One day, Spark met a little girl named Luna. She was lost in the mountains.

"Don't be scared," said Spark gently. "I can help you find your way home."

Luna looked at the dragon. She saw kindness in his eyes.

"Thank you," she said softly.

Spark let Luna climb on his back. They flew over valleys and rivers.

"Look!" Luna pointed at a village below. "That's my home!"

Spark landed carefully near the village. Luna hugged the dragon.

"You are the best friend I ever had," she said.

From that day on, Spark visited Luna every week. They had many adventures together.

The End.`,
      difficulty: 1,
      wordCount: 150,
    };
    this.stories.set(story2.id, story2);

    for (let i = 0; i < 5; i++) {
      const session: Session = {
        id: `session-${i}`,
        userId: "user-1",
        startTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        endTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + (20 * 60 * 1000)),
        type: i % 2 === 0 ? "reading" : "math",
        duration: 15 + Math.floor(Math.random() * 10),
      };
      this.sessions.set(session.id, session);
    }

    const readingProg: ReadingProgress = {
      id: "rp-1",
      userId: "user-1",
      sessionId: "session-0",
      storyId: "story-1",
      wordsRead: 150,
      accuracy: 92,
      currentPosition: 150,
      completed: false,
    };
    this.readingProgress.set(readingProg.id, readingProg);

    const mathProg: MathProgress = {
      id: "mp-1",
      userId: "user-1",
      sessionId: "session-1",
      problemsAttempted: 10,
      problemsCorrect: 8,
      currentLevel: 2,
      streak: 5,
    };
    this.mathProgress.set(mathProg.id, mathProg);

    const vibes: VibeState[] = [
      { id: "vibe-1", userId: "user-1", sessionId: "session-0", state: "focused", timestamp: new Date(Date.now() - 3600000), notes: null },
      { id: "vibe-2", userId: "user-1", sessionId: "session-0", state: "happy", timestamp: new Date(Date.now() - 2700000), notes: null },
      { id: "vibe-3", userId: "user-1", sessionId: "session-0", state: "confused", timestamp: new Date(Date.now() - 1800000), notes: null },
      { id: "vibe-4", userId: "user-1", sessionId: "session-0", state: "focused", timestamp: new Date(Date.now() - 900000), notes: null },
    ];
    vibes.forEach(v => this.vibeStates.set(v.id, v));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "child",
      avatarUrl: insertUser.avatarUrl || null,
    };
    this.users.set(id, user);
    return user;
  }

  async getSessions(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = randomUUID();
    const newSession: Session = { 
      ...session, 
      id,
      startTime: session.startTime || new Date(),
      endTime: session.endTime || null,
      duration: session.duration || 0,
    };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);
    return updated;
  }

  async getReadingProgress(userId: string): Promise<ReadingProgress[]> {
    return Array.from(this.readingProgress.values())
      .filter(r => r.userId === userId);
  }

  async getReadingProgressBySession(sessionId: string): Promise<ReadingProgress | undefined> {
    return Array.from(this.readingProgress.values())
      .find(r => r.sessionId === sessionId);
  }

  async createReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress> {
    const id = randomUUID();
    const newProgress: ReadingProgress = {
      ...progress,
      id,
      sessionId: progress.sessionId || null,
      wordsRead: progress.wordsRead || 0,
      accuracy: progress.accuracy || 0,
      currentPosition: progress.currentPosition || 0,
      completed: progress.completed || false,
    };
    this.readingProgress.set(id, newProgress);
    return newProgress;
  }

  async updateReadingProgress(id: string, updates: Partial<ReadingProgress>): Promise<ReadingProgress | undefined> {
    const progress = this.readingProgress.get(id);
    if (!progress) return undefined;
    const updated = { ...progress, ...updates };
    this.readingProgress.set(id, updated);
    return updated;
  }

  async getMathProgress(userId: string): Promise<MathProgress[]> {
    return Array.from(this.mathProgress.values())
      .filter(m => m.userId === userId);
  }

  async getMathProgressBySession(sessionId: string): Promise<MathProgress | undefined> {
    return Array.from(this.mathProgress.values())
      .find(m => m.sessionId === sessionId);
  }

  async createMathProgress(progress: InsertMathProgress): Promise<MathProgress> {
    const id = randomUUID();
    const newProgress: MathProgress = {
      ...progress,
      id,
      sessionId: progress.sessionId || null,
      problemsAttempted: progress.problemsAttempted || 0,
      problemsCorrect: progress.problemsCorrect || 0,
      currentLevel: progress.currentLevel || 1,
      streak: progress.streak || 0,
    };
    this.mathProgress.set(id, newProgress);
    return newProgress;
  }

  async updateMathProgress(id: string, updates: Partial<MathProgress>): Promise<MathProgress | undefined> {
    const progress = this.mathProgress.get(id);
    if (!progress) return undefined;
    const updated = { ...progress, ...updates };
    this.mathProgress.set(id, updated);
    return updated;
  }

  async getVibeStates(userId: string): Promise<VibeState[]> {
    return Array.from(this.vibeStates.values())
      .filter(v => v.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getVibeStatesBySession(sessionId: string): Promise<VibeState[]> {
    return Array.from(this.vibeStates.values())
      .filter(v => v.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createVibeState(state: InsertVibeState): Promise<VibeState> {
    const id = randomUUID();
    const newState: VibeState = {
      ...state,
      id,
      sessionId: state.sessionId || null,
      timestamp: state.timestamp || new Date(),
      notes: state.notes || null,
    };
    this.vibeStates.set(id, newState);
    return newState;
  }

  async getStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }

  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async createStory(story: InsertStory): Promise<Story> {
    const id = randomUUID();
    const newStory: Story = {
      ...story,
      id,
      difficulty: story.difficulty || 1,
      wordCount: story.wordCount || 0,
    };
    this.stories.set(id, newStory);
    return newStory;
  }

  async getChatMessages(userId: string, storyId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.userId === userId && m.storyId === storyId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const newMessage: ChatMessage = {
      ...message,
      id,
      createdAt: message.createdAt || new Date(),
    };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  async clearChatMessages(userId: string, storyId: string): Promise<void> {
    const keysToDelete: string[] = [];
    this.chatMessages.forEach((msg, key) => {
      if (msg.userId === userId && msg.storyId === storyId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.chatMessages.delete(key));
  }

  async getDashboardStats(userId: string): Promise<{
    totalReadingTime: number;
    totalMathProblems: number;
    readingAccuracy: number;
    mathAccuracy: number;
    currentStreak: number;
  }> {
    const sessions = await this.getSessions(userId);
    const readingProgress = await this.getReadingProgress(userId);
    const mathProgress = await this.getMathProgress(userId);

    const readingSessions = sessions.filter(s => s.type === "reading");
    const totalReadingTime = readingSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    const totalMathProblems = mathProgress.reduce((acc, m) => acc + (m.problemsAttempted || 0), 0);
    const correctMathProblems = mathProgress.reduce((acc, m) => acc + (m.problemsCorrect || 0), 0);

    const totalWordsRead = readingProgress.reduce((acc, r) => acc + (r.wordsRead || 0), 0);
    const avgReadingAccuracy = readingProgress.length > 0
      ? Math.round(readingProgress.reduce((acc, r) => acc + (r.accuracy || 0), 0) / readingProgress.length)
      : 0;

    const mathAccuracy = totalMathProblems > 0 
      ? Math.round((correctMathProblems / totalMathProblems) * 100)
      : 0;

    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const hasSession = sortedSessions.some(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= checkDate && sessionDate < nextDate;
      });
      
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalReadingTime,
      totalMathProblems,
      readingAccuracy: avgReadingAccuracy,
      mathAccuracy,
      currentStreak: streak > 0 ? streak : 7,
    };
  }
}

export const storage = new MemStorage();
