import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Calculator, 
  Trophy, 
  Star, 
  Flame,
  ChevronRight,
  Home,
  Target,
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/progress-ring";
import { VibeMonitor } from "@/components/vibe-monitor";
import { ThemeToggle } from "@/components/theme-toggle";
import type { VibeStateType } from "@shared/schema";

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

interface ChildDashboardResponse {
  user: { id: string; name: string; username: string; role: string; avatarUrl: string | null };
  todayGoals: {
    readingMinutes: number;
    targetReadingMinutes: number;
    mathProblems: number;
    targetMathProblems: number;
  };
  currentStreak: number;
  recentAchievements: string[];
}

export default function ChildDashboard() {
  const { data, isLoading, error } = useQuery<ChildDashboardResponse>({
    queryKey: ["/api/child-dashboard/user-1"],
  });

  const currentVibe: VibeStateType = "focused";
  
  const childData = data || {
    user: { name: "Alex", id: "user-1" },
    todayGoals: {
      readingMinutes: 12,
      targetReadingMinutes: 20,
      mathProblems: 5,
      targetMathProblems: 10,
    },
    currentStreak: 7,
    recentAchievements: [
      "Read for 5 days in a row!",
      "Solved 50 math problems!",
      "Perfect accuracy streak!",
    ],
  };

  const readingProgress = (childData.todayGoals.readingMinutes / childData.todayGoals.targetReadingMinutes) * 100;
  const mathProgress = (childData.todayGoals.mathProblems / childData.todayGoals.targetMathProblems) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-child text-lg font-bold">LearnBuddy</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-4xl">
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
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-child text-lg font-bold" data-testid="text-child-logo">LearnBuddy</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerChildren}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-6">
            <motion.div 
              className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <span className="font-child text-3xl text-white">{childData.user?.name?.charAt(0) || "S"}</span>
            </motion.div>
            <div>
              <h1 className="font-child text-3xl font-bold" data-testid="text-welcome">
                Hi {childData.user?.name || "Shoaib"}!
              </h1>
              <p className="text-muted-foreground">Ready to learn something awesome today?</p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-2 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                      <Flame className="h-7 w-7 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-child text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-streak">
                        {childData.currentStreak} Day Streak!
                      </p>
                      <p className="text-sm text-muted-foreground">Keep it going!</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`h-3 w-3 rounded-full ${
                          i < childData.currentStreak 
                            ? "bg-amber-500" 
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-child text-xl font-bold" data-testid="text-today-goals">Today's Goals</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="group hover-elevate transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                        <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-child text-lg font-bold">Reading</p>
                        <p className="text-sm text-muted-foreground">
                          {childData.todayGoals.readingMinutes}/{childData.todayGoals.targetReadingMinutes} minutes
                        </p>
                      </div>
                    </div>
                    <ProgressRing progress={readingProgress} size={60} strokeWidth={6} color="stroke-emerald-500">
                      <span className="font-child text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(readingProgress)}%
                      </span>
                    </ProgressRing>
                  </div>
                  <Link href="/reading">
                    <Button className="w-full gap-2 font-child" data-testid="button-continue-reading">
                      Continue Reading
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="group hover-elevate transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                        <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-child text-lg font-bold">Math</p>
                        <p className="text-sm text-muted-foreground">
                          {childData.todayGoals.mathProblems}/{childData.todayGoals.targetMathProblems} problems
                        </p>
                      </div>
                    </div>
                    <ProgressRing progress={mathProgress} size={60} strokeWidth={6} color="stroke-blue-500">
                      <span className="font-child text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(mathProgress)}%
                      </span>
                    </ProgressRing>
                  </div>
                  <Link href="/math">
                    <Button className="w-full gap-2 font-child" variant="secondary" data-testid="button-practice-math">
                      Practice Math
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-child text-xl font-bold" data-testid="text-achievements">Recent Achievements</h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {childData.recentAchievements.map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 rounded-xl bg-amber-500/5 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <span className="font-child font-medium" data-testid={`text-achievement-${index + 1}`}>{achievement}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} className="pb-20">
            <Link href="/parent">
              <Button variant="outline" className="w-full gap-2" data-testid="button-parent-mode">
                Switch to Parent Mode
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <VibeMonitor currentVibe={currentVibe} />
    </div>
  );
}
