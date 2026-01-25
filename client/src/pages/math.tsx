import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { 
  ChevronLeft,
  Calculator,
  Star,
  Flame,
  Check,
  X,
  RotateCcw,
  Lightbulb,
  Clock,
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VibeMonitor } from "@/components/vibe-monitor";
import { ThemeToggle } from "@/components/theme-toggle";
import { Celebration } from "@/components/celebration";
import { apiRequest } from "@/lib/queryClient";
import type { VibeStateType, MathProblem } from "@shared/schema";

const generateProblem = (level: number): MathProblem => {
  const types: MathProblem["type"][] = ["addition", "subtraction", "multiplication", "division"];
  const type = types[Math.floor(Math.random() * Math.min(level + 1, types.length))];
  
  let operand1: number, operand2: number, answer: number;
  
  switch (type) {
    case "addition":
      operand1 = Math.floor(Math.random() * (10 * level)) + 1;
      operand2 = Math.floor(Math.random() * (10 * level)) + 1;
      answer = operand1 + operand2;
      break;
    case "subtraction":
      operand1 = Math.floor(Math.random() * (10 * level)) + 10;
      operand2 = Math.floor(Math.random() * Math.min(operand1, 10 * level)) + 1;
      answer = operand1 - operand2;
      break;
    case "multiplication":
      operand1 = Math.floor(Math.random() * (5 * level)) + 1;
      operand2 = Math.floor(Math.random() * 10) + 1;
      answer = operand1 * operand2;
      break;
    case "division":
      operand2 = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 10) + 1;
      operand1 = operand2 * answer;
      break;
    default:
      operand1 = 1;
      operand2 = 1;
      answer = 2;
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    operand1,
    operand2,
    answer,
  };
};

const operatorSymbols: Record<MathProblem["type"], string> = {
  addition: "+",
  subtraction: "-",
  multiplication: "×",
  division: "÷",
};

export default function MathPage() {
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(generateProblem(1));
  const [userInput, setUserInput] = useState("");
  const [problemsCompleted, setProblemsCompleted] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [showResult, setShowResult] = useState<"correct" | "incorrect" | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentVibe, setCurrentVibe] = useState<VibeStateType>("focused");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const saveMathProgress = useMutation({
    mutationFn: async (data: { problemsAttempted: number; problemsCorrect: number; currentLevel: number; streak: number }) => {
      const response = await apiRequest("POST", "/api/math-progress", {
        userId: "user-1",
        ...data,
      });
      return response.json();
    },
  });

  const saveVibeState = useMutation({
    mutationFn: async (state: string) => {
      const response = await apiRequest("POST", "/api/vibe-states", {
        userId: "user-1",
        state,
      });
      return response.json();
    },
  });

  const getMathHelp = useMutation({
    mutationFn: async (data: { problem: string; userAnswer: number; correctAnswer: number; isCorrect: boolean }) => {
      const response = await apiRequest("POST", "/api/math-help", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiFeedback(data.feedback);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (streak >= 3) {
      setCurrentVibe("happy");
      saveVibeState.mutate("happy");
    } else if (problemsCompleted > 0 && correctAnswers / problemsCompleted < 0.5) {
      setCurrentVibe("confused");
      saveVibeState.mutate("confused");
    } else {
      setCurrentVibe("focused");
    }
  }, [streak, problemsCompleted, correctAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNumberClick = (num: string) => {
    if (showResult) return;
    if (userInput.length < 4) {
      setUserInput(userInput + num);
    }
  };

  const handleClear = () => {
    setUserInput("");
    setShowHint(false);
  };

  const handleBackspace = () => {
    setUserInput(userInput.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!userInput || showResult) return;
    
    const userAnswer = parseInt(userInput, 10);
    const isCorrect = userAnswer === currentProblem.answer;
    
    setShowResult(isCorrect ? "correct" : "incorrect");
    setAiFeedback(null);
    const newProblemsCompleted = problemsCompleted + 1;
    setProblemsCompleted(newProblemsCompleted);
    
    let newCorrectAnswers = correctAnswers;
    let newStreak = streak;
    let newLevel = level;

    // Get AI feedback
    const problemStr = `${currentProblem.operand1} ${operatorSymbols[currentProblem.type]} ${currentProblem.operand2}`;
    getMathHelp.mutate({
      problem: problemStr,
      userAnswer,
      correctAnswer: currentProblem.answer,
      isCorrect,
    });

    if (isCorrect) {
      newCorrectAnswers = correctAnswers + 1;
      setCorrectAnswers(newCorrectAnswers);
      newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      
      if (newCorrectAnswers % 5 === 0) {
        newLevel = Math.min(level + 1, 4);
        setLevel(newLevel);
      }
      
      if (newStreak >= 2) {
        setShowCelebration(true);
      }
    } else {
      setStreak(0);
      newStreak = 0;
    }

    saveMathProgress.mutate({
      problemsAttempted: newProblemsCompleted,
      problemsCorrect: newCorrectAnswers,
      currentLevel: newLevel,
      streak: newStreak,
    });
    
    // Longer timeout to allow reading AI feedback
    setTimeout(() => {
      setShowResult(null);
      setUserInput("");
      setShowHint(false);
      setAiFeedback(null);
      setCurrentProblem(generateProblem(level));
    }, 3500);
  };

  const getHint = () => {
    const { type, operand1, operand2 } = currentProblem;
    switch (type) {
      case "addition":
        return `Count up from ${operand1}: ${operand1}, ${operand1 + 1}, ${operand1 + 2}...`;
      case "subtraction":
        return `Count down from ${operand1}: ${operand1}, ${operand1 - 1}, ${operand1 - 2}...`;
      case "multiplication":
        return `Think of ${operand2} groups of ${operand1}`;
      case "division":
        return `How many ${operand2}s fit into ${operand1}?`;
      default:
        return "Take your time!";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Celebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
      
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Link href="/child">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-child text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-math-title">Math</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span data-testid="text-elapsed-time">{formatTime(elapsedTime)}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Star className="h-4 w-4" />
                  <span className="font-child text-lg font-bold" data-testid="text-correct">{correctAnswers}</span>
                </div>
                <p className="text-xs text-muted-foreground">Correct</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="font-child text-lg font-bold" data-testid="text-streak">{streak}</span>
                </div>
                <p className="text-xs text-muted-foreground">Streak</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <span className="font-child text-lg font-bold text-blue-500" data-testid="text-level">Lv.{level}</span>
                <p className="text-xs text-muted-foreground">Level</p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentProblem.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-6"
                >
                  <div className="flex items-center justify-center gap-4">
                    <motion.span 
                      className="font-child text-5xl font-bold"
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      data-testid="text-operand1"
                    >
                      {currentProblem.operand1}
                    </motion.span>
                    <span className="text-4xl text-primary font-bold" data-testid="text-operator">
                      {operatorSymbols[currentProblem.type]}
                    </span>
                    <motion.span 
                      className="font-child text-5xl font-bold"
                      initial={{ x: 20 }}
                      animate={{ x: 0 }}
                      data-testid="text-operand2"
                    >
                      {currentProblem.operand2}
                    </motion.span>
                    <span className="text-4xl text-muted-foreground">=</span>
                    <div 
                      className={`min-w-[100px] h-16 flex items-center justify-center rounded-xl border-2 transition-colors ${
                        showResult === "correct" 
                          ? "border-emerald-500 bg-emerald-500/10" 
                          : showResult === "incorrect"
                            ? "border-red-500 bg-red-500/10"
                            : "border-primary/50 bg-muted/50"
                      }`}
                      data-testid="input-answer"
                    >
                      <span className="font-child text-4xl font-bold" data-testid="text-user-input">
                        {userInput || "?"}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                      >
                        <div 
                          className={`flex items-center justify-center gap-2 text-lg font-medium ${
                            showResult === "correct" ? "text-emerald-500" : "text-red-500"
                          }`}
                          data-testid="text-result"
                        >
                          {showResult === "correct" ? (
                            <>
                              <Check className="h-5 w-5" />
                              <span>Great job!</span>
                            </>
                          ) : (
                            <>
                              <X className="h-5 w-5" />
                              <span>The answer is {currentProblem.answer}</span>
                            </>
                          )}
                        </div>
                        
                        {/* AI Feedback */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className={`flex items-start gap-2 p-3 rounded-xl ${
                            showResult === "correct" 
                              ? "bg-emerald-500/10 border border-emerald-500/20" 
                              : "bg-blue-500/10 border border-blue-500/20"
                          }`}
                          data-testid="ai-feedback"
                        >
                          <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div className="text-sm font-child">
                            {getMathHelp.isPending ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>AI is thinking...</span>
                              </div>
                            ) : aiFeedback ? (
                              <span data-testid="text-ai-feedback">{aiFeedback}</span>
                            ) : (
                              <span>{showResult === "correct" ? "Excellent work!" : "Keep trying, you'll get it!"}</span>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showHint && !showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl p-3"
                    >
                      <Lightbulb className="h-5 w-5" />
                      <span className="text-sm font-medium" data-testid="text-hint">{getHint()}</span>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="secondary"
                    className="h-14 font-child text-2xl font-bold"
                    onClick={() => handleNumberClick(num.toString())}
                    disabled={showResult !== null}
                    data-testid={`button-num-${num}`}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="h-14"
                  onClick={handleClear}
                  disabled={showResult !== null}
                  data-testid="button-clear"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  className="h-14 font-child text-2xl font-bold"
                  onClick={() => handleNumberClick("0")}
                  disabled={showResult !== null}
                  data-testid="button-num-0"
                >
                  0
                </Button>
                <Button
                  variant="ghost"
                  className="h-14"
                  onClick={handleBackspace}
                  disabled={showResult !== null}
                  data-testid="button-backspace"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowHint(true)}
                  disabled={showHint || showResult !== null}
                  data-testid="button-hint"
                >
                  <Lightbulb className="h-4 w-4" />
                  Hint
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={!userInput || showResult !== null}
                  data-testid="button-submit"
                >
                  <Check className="h-4 w-4" />
                  Check
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pb-20">
            <Link href="/child">
              <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <VibeMonitor currentVibe={currentVibe} />
    </div>
  );
}
