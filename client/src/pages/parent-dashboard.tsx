import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Calculator, 
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Calendar,
  ChevronRight,
  Home,
  Settings,
  Sparkles,
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/progress-ring";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface DashboardResponse {
  user: { id: string; name: string; username: string; role: string };
  stats: {
    totalReadingTime: number;
    totalMathProblems: number;
    readingAccuracy: number;
    mathAccuracy: number;
    currentStreak: number;
  };
  recentSessions: Array<{
    id: string;
    type: string;
    startTime: string;
    duration: number;
  }>;
  recentVibes: Array<{
    id: string;
    state: string;
    timestamp: string;
  }>;
  readingProgress: Array<{
    id: string;
    storyId: string;
    wordsRead: number;
    accuracy: number;
    completed: boolean;
  }>;
  mathProgress: Array<{
    id: string;
    problemsAttempted: number;
    problemsCorrect: number;
    currentLevel: number;
    streak: number;
  }>;
}

interface QuizResult {
  quizId: string;
  storyId: string;
  storyTitle: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
}

function computeVibeScore(vibes: Array<{ state: string }>): number {
  if (vibes.length === 0) return 0;
  const positiveStates = ["focused", "happy"];
  const positiveCount = vibes.filter(v => positiveStates.includes(v.state)).length;
  return Math.round((positiveCount / vibes.length) * 100);
}

function buildWeeklyData(sessions: Array<{ type: string; startTime: string; duration: number }>) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const weekData: Array<{ day: string; reading: number; math: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    let reading = 0;
    let math = 0;
    for (const s of sessions) {
      const sDate = new Date(s.startTime);
      if (sDate >= dayStart && sDate < dayEnd) {
        if (s.type === "reading") reading += s.duration || 0;
        else if (s.type === "math") math += s.duration || 0;
      }
    }

    weekData.push({
      day: dayNames[dayStart.getDay()],
      reading,
      math,
    });
  }

  return weekData;
}

function getMathLevelLabel(level: number): string {
  switch (level) {
    case 1: return "Addition & Subtraction";
    case 2: return "Multiplication & Division";
    case 3: return "Advanced Problems";
    case 4: return "Master Level";
    default: return "Getting Started";
  }
}

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["/api/dashboard/user-1"],
  });

  const { data: quizResults = [] } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz/user/user-1"],
  });

  const quizStats = {
    totalQuizzes: quizResults.length,
    passedQuizzes: quizResults.filter(q => q.passed).length,
    averageScore: quizResults.length > 0 
      ? Math.round(quizResults.reduce((acc, q) => acc + (q.score / q.totalQuestions) * 100, 0) / quizResults.length)
      : 0,
  };

  const stats = data?.stats || {
    totalReadingTime: 0,
    totalMathProblems: 0,
    readingAccuracy: 0,
    mathAccuracy: 0,
    currentStreak: 0,
  };

  const vibeHistory = data?.recentVibes?.slice(0, 5).map(v => ({
    time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    state: v.state,
    label: v.state.charAt(0).toUpperCase() + v.state.slice(1),
  })) || [];

  const vibeScore = computeVibeScore(data?.recentVibes || []);

  const recentSessions = data?.recentSessions?.slice(0, 4).map(s => ({
    date: new Date(s.startTime).toLocaleDateString() === new Date().toLocaleDateString() ? "Today" : new Date(s.startTime).toLocaleDateString(),
    type: s.type.charAt(0).toUpperCase() + s.type.slice(1),
    duration: `${s.duration} min`,
    progress: s.type === "reading" ? "Reading session" : "Math session",
    status: "completed" as const,
  })) || [];

  const weeklyData = buildWeeklyData(data?.recentSessions || []);
  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.reading + d.math), 1);

  const mathLevel = data?.mathProgress?.[0]?.currentLevel || 1;
  const mathBestStreak = data?.mathProgress?.reduce((max, m) => Math.max(max, m.streak || 0), 0) || 0;
  const totalWordsRead = data?.readingProgress?.reduce((acc, r) => acc + (r.wordsRead || 0), 0) || 0;
  const storiesCompleted = data?.readingProgress?.filter(r => r.completed).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-child text-lg font-bold">LearnBuddy</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-home">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-child text-lg font-bold" data-testid="text-parent-logo">LearnBuddy</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" />
              Parent View
            </Badge>
            <ThemeToggle />
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerChildren}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Parent Dashboard</h1>
              <p className="text-muted-foreground">Track {data?.user?.name || "your child"}'s learning progress and insights</p>
            </div>
            <Link href="/child">
              <Button variant="outline" className="gap-2" data-testid="button-child-mode">
                Switch to Child Mode
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reading Time</p>
                    <p className="text-2xl font-bold" data-testid="text-reading-time">{stats.totalReadingTime} min</p>
                    <p className="text-xs text-muted-foreground">
                      {totalWordsRead > 0 ? `${totalWordsRead} words read` : "No reading yet"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Math Problems</p>
                    <p className="text-2xl font-bold" data-testid="text-math-problems">{stats.totalMathProblems}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalMathProblems > 0 ? `${stats.mathAccuracy}% accuracy` : "No problems yet"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vibe Score</p>
                    <p className="text-2xl font-bold" data-testid="text-vibe-score">
                      {(data?.recentVibes?.length || 0) > 0 ? `${vibeScore}%` : "--"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vibeScore >= 75 ? "Mostly focused & happy" : vibeScore >= 50 ? "Mixed engagement" : (data?.recentVibes?.length || 0) > 0 ? "Needs attention" : "No data yet"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold" data-testid="text-parent-streak">{stats.currentStreak} days</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.currentStreak > 0 ? "Keep it going!" : "Start a streak today"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="reading" data-testid="tab-reading">Reading</TabsTrigger>
                <TabsTrigger value="math" data-testid="tab-math">Math</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Weekly Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {weeklyData.every(d => d.reading === 0 && d.math === 0) ? (
                        <div className="text-center py-8">
                          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">No sessions this week yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {weeklyData.map((day) => (
                            <div key={day.day} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium w-10">{day.day}</span>
                                <span className="text-muted-foreground">{day.reading + day.math > 0 ? `${day.reading + day.math} min` : "--"}</span>
                              </div>
                              <div className="flex gap-1">
                                {day.reading > 0 && (
                                  <div 
                                    className="h-2 rounded-full bg-emerald-500"
                                    style={{ width: `${(day.reading / maxWeeklyMinutes) * 50}%` }}
                                  />
                                )}
                                {day.math > 0 && (
                                  <div 
                                    className="h-2 rounded-full bg-blue-500"
                                    style={{ width: `${(day.math / maxWeeklyMinutes) * 50}%` }}
                                  />
                                )}
                                {day.reading === 0 && day.math === 0 && (
                                  <div className="h-2 rounded-full bg-muted" style={{ width: "5%" }} />
                                )}
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center gap-4 pt-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-emerald-500" />
                              <span className="text-muted-foreground">Reading</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-blue-500" />
                              <span className="text-muted-foreground">Math</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Vibe History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vibeHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">No vibe data recorded yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {vibeHistory.map((vibe, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground w-16">{vibe.time}</span>
                                <Badge 
                                  variant="secondary"
                                  className={
                                    vibe.state === "focused" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    vibe.state === "happy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    vibe.state === "confused" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                                    vibe.state === "frustrated" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    "bg-muted text-muted-foreground"
                                  }
                                >
                                  {vibe.label}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No learning sessions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentSessions.map((session, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between rounded-xl bg-muted/50 p-4"
                            data-testid={`session-row-${index}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                session.type === "Reading" 
                                  ? "bg-emerald-500/10" 
                                  : "bg-blue-500/10"
                              }`}>
                                {session.type === "Reading" 
                                  ? <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                  : <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                }
                              </div>
                              <div>
                                <p className="font-medium">{session.type}</p>
                                <p className="text-sm text-muted-foreground">{session.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {session.duration}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reading" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <ProgressRing progress={stats.readingAccuracy} size={120} strokeWidth={10} color="stroke-emerald-500">
                        <div className="text-center">
                          <span className="text-2xl font-bold" data-testid="text-reading-accuracy">{stats.readingAccuracy}%</span>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                      </ProgressRing>
                      <p className="mt-4 font-medium">Reading Accuracy</p>
                      <p className="text-sm text-muted-foreground">{totalWordsRead} words read</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <ProgressRing progress={quizStats.averageScore} size={120} strokeWidth={10} color="stroke-purple-500">
                        <div className="text-center">
                          <span className="text-2xl font-bold" data-testid="text-quiz-score">{quizStats.averageScore}%</span>
                          <p className="text-xs text-muted-foreground">Quiz Score</p>
                        </div>
                      </ProgressRing>
                      <p className="mt-4 font-medium">Comprehension Score</p>
                      <p className="text-sm text-muted-foreground">Average quiz performance</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-quizzes-passed">
                          {quizStats.passedQuizzes}/{quizStats.totalQuizzes}
                        </span>
                      </div>
                      <p className="mt-4 font-medium">Quizzes Passed</p>
                      <p className="text-sm text-muted-foreground">
                        {storiesCompleted > 0 ? `${storiesCompleted} stories completed` : "Comprehension tests"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {quizResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Reading Comprehension Quizzes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {quizResults.map((quiz) => (
                          <div 
                            key={quiz.quizId}
                            className="flex items-center justify-between rounded-xl bg-muted/50 p-4"
                            data-testid={`quiz-result-${quiz.quizId}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                quiz.passed ? "bg-emerald-500/10" : "bg-amber-500/10"
                              }`}>
                                {quiz.passed ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{quiz.storyTitle}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(quiz.completedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold" data-testid={`quiz-score-${quiz.quizId}`}>
                                  {quiz.score}/{quiz.totalQuestions}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                                </p>
                              </div>
                              <Badge variant={quiz.passed ? "default" : "secondary"}>
                                {quiz.passed ? "Passed" : "Needs Review"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {quizResults.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="font-medium">No Quiz Results Yet</p>
                      <p className="text-sm text-muted-foreground">
                        Quizzes will appear here after your child completes reading stories.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="math" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <ProgressRing progress={stats.mathAccuracy} size={120} strokeWidth={10} color="stroke-blue-500">
                        <div className="text-center">
                          <span className="text-2xl font-bold" data-testid="text-math-accuracy">{stats.mathAccuracy}%</span>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                      </ProgressRing>
                      <p className="mt-4 font-medium">Math Accuracy</p>
                      <p className="text-sm text-muted-foreground">{stats.totalMathProblems} problems attempted</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10">
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-math-level">Lv.{mathLevel}</span>
                      </div>
                      <p className="mt-4 font-medium">Math Level</p>
                      <p className="text-sm text-muted-foreground">{getMathLevelLabel(mathLevel)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10">
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-math-best-streak">{mathBestStreak}</span>
                      </div>
                      <p className="mt-4 font-medium">Best Streak</p>
                      <p className="text-sm text-muted-foreground">Correct answers in a row</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
