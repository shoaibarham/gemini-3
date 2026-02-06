import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { 
  ChevronLeft,
  Calculator,
  Play,
  Sparkles,
  Loader2,
  RotateCcw,
  Delete,
  Plus,
  Minus,
  X,
  Divide,
  Equal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

type OperationType = "addition" | "subtraction" | "multiplication" | "division";

interface ParsedEquation {
  operand1: number;
  operator: string;
  operand2: number;
  type: OperationType;
  answer: number;
}

const operatorMap: Record<string, OperationType> = {
  "+": "addition",
  "-": "subtraction",
  "×": "multiplication",
  "÷": "division",
};

function parseEquation(input: string): ParsedEquation | null {
  const cleaned = input.replace(/\s+/g, "");
  const match = cleaned.match(/^(\d+)([+\-×÷xX*/])(\d+)$/);
  if (!match) return null;

  const operand1 = parseInt(match[1], 10);
  let opChar = match[2];
  const operand2 = parseInt(match[3], 10);

  if (opChar === "*" || opChar === "x" || opChar === "X") opChar = "×";
  if (opChar === "/") opChar = "÷";

  const type = operatorMap[opChar];
  if (!type) return null;

  if (operand1 > 1000 || operand2 > 1000 || operand1 < 0 || operand2 < 0) return null;
  if (opChar === "÷" && operand2 === 0) return null;

  let answer: number;
  switch (type) {
    case "addition":
      answer = operand1 + operand2;
      break;
    case "subtraction":
      answer = operand1 - operand2;
      break;
    case "multiplication":
      answer = operand1 * operand2;
      break;
    case "division":
      answer = operand1 / operand2;
      break;
  }

  return { operand1, operator: opChar, operand2, type, answer };
}

const exampleEquations = [
  { label: "3 + 5", icon: Plus },
  { label: "12 - 4", icon: Minus },
  { label: "6 × 3", icon: X },
  { label: "20 ÷ 5", icon: Divide },
  { label: "7 + 8", icon: Plus },
  { label: "15 - 9", icon: Minus },
  { label: "4 × 7", icon: X },
  { label: "36 ÷ 6", icon: Divide },
];

export default function MathPage() {
  const [equation, setEquation] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedEquation | null>(null);
  const [vizVideoUrl, setVizVideoUrl] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getVisualization = useMutation({
    mutationFn: async (data: { type: string; operand1: number; operand2: number; answer: number }) => {
      const response = await apiRequest("POST", "/api/math-visualization", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.videoUrl) {
        setVizVideoUrl(data.videoUrl);
        setShowVisualization(true);
      }
    },
  });

  const getMathExplanation = useMutation({
    mutationFn: async (data: { problem: string; correctAnswer: number }) => {
      const response = await apiRequest("POST", "/api/math-help", {
        problem: data.problem,
        userAnswer: data.correctAnswer,
        correctAnswer: data.correctAnswer,
        isCorrect: true,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiFeedback(data.feedback);
    },
  });

  const handleVisualize = useCallback(() => {
    setParseError(null);
    setVizVideoUrl(null);
    setShowVisualization(false);
    setAiFeedback(null);

    const parsed = parseEquation(equation);
    if (!parsed) {
      setParseError("Type an equation like 3 + 5 or 12 × 4");
      setParsedResult(null);
      return;
    }

    setParsedResult(parsed);

    getVisualization.mutate({
      type: parsed.type,
      operand1: parsed.operand1,
      operand2: parsed.operand2,
      answer: parsed.answer,
    });

    const problemStr = `${parsed.operand1} ${parsed.operator} ${parsed.operand2}`;
    getMathExplanation.mutate({
      problem: problemStr,
      correctAnswer: parsed.answer,
    });
  }, [equation]);

  const handleExampleClick = (label: string) => {
    setEquation(label);
    setParseError(null);
    setVizVideoUrl(null);
    setShowVisualization(false);
    setAiFeedback(null);
    setParsedResult(null);
  };

  const handleNumberClick = (num: string) => {
    setEquation((prev) => prev + num);
    setParseError(null);
  };

  const handleOperatorClick = (op: string) => {
    setEquation((prev) => prev + " " + op + " ");
    setParseError(null);
  };

  const handleClear = () => {
    setEquation("");
    setParseError(null);
    setParsedResult(null);
    setVizVideoUrl(null);
    setShowVisualization(false);
    setAiFeedback(null);
  };

  const handleBackspace = () => {
    setEquation((prev) => prev.trimEnd().slice(0, -1).trimEnd());
    setParseError(null);
  };

  const operatorButtons = [
    { symbol: "+", icon: Plus, color: "text-emerald-600 dark:text-emerald-400" },
    { symbol: "-", icon: Minus, color: "text-blue-600 dark:text-blue-400" },
    { symbol: "×", icon: X, color: "text-purple-600 dark:text-purple-400" },
    { symbol: "÷", icon: Divide, color: "text-orange-600 dark:text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              <span className="font-child text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-math-title">Math Visualizer</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="font-child text-2xl font-bold" data-testid="text-page-heading">
              Type an equation and watch it come alive!
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter a math problem and see a step-by-step animated visualization
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div
                className={`relative flex items-center min-h-[72px] px-6 rounded-xl border-2 transition-colors ${
                  parseError
                    ? "border-red-500/50 bg-red-500/5"
                    : parsedResult
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-primary/30 bg-muted/30"
                }`}
                data-testid="equation-display"
              >
                {equation ? (
                  <span className="font-child text-3xl sm:text-4xl font-bold tracking-wide flex-1 text-center" data-testid="text-equation">
                    {equation}
                  </span>
                ) : (
                  <span className="font-child text-3xl sm:text-4xl font-bold tracking-wide flex-1 text-center text-muted-foreground/40" data-testid="text-equation-placeholder">
                    3 + 5
                  </span>
                )}
                {parsedResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-3xl sm:text-4xl text-muted-foreground">=</span>
                    <span className="font-child text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-answer">
                      {Number.isInteger(parsedResult.answer) ? parsedResult.answer : parsedResult.answer.toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </div>

              <AnimatePresence>
                {parseError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-500 text-center"
                    data-testid="text-parse-error"
                  >
                    {parseError}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-4 gap-2">
                {operatorButtons.map((op) => (
                  <Button
                    key={op.symbol}
                    variant="outline"
                    className="h-12 gap-1"
                    onClick={() => handleOperatorClick(op.symbol)}
                    data-testid={`button-op-${op.symbol}`}
                  >
                    <op.icon className={`h-4 w-4 ${op.color}`} />
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="secondary"
                    className="h-14 font-child text-2xl font-bold"
                    onClick={() => handleNumberClick(num.toString())}
                    data-testid={`button-num-${num}`}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="h-14"
                  onClick={handleClear}
                  data-testid="button-clear"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  className="h-14 font-child text-2xl font-bold"
                  onClick={() => handleNumberClick("0")}
                  data-testid="button-num-0"
                >
                  0
                </Button>
                <Button
                  variant="ghost"
                  className="h-14"
                  onClick={handleBackspace}
                  data-testid="button-backspace"
                >
                  <Delete className="h-5 w-5" />
                </Button>
              </div>

              <Button
                className="w-full h-14 gap-3 text-lg font-child font-bold"
                onClick={handleVisualize}
                disabled={!equation.trim() || getVisualization.isPending}
                data-testid="button-visualize"
              >
                {getVisualization.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Animation...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Visualize
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Try these examples:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {exampleEquations.map((ex) => (
                <Button
                  key={ex.label}
                  variant="outline"
                  size="sm"
                  className="gap-1 font-child"
                  onClick={() => handleExampleClick(ex.label)}
                  data-testid={`button-example-${ex.label.replace(/\s/g, "")}`}
                >
                  <ex.icon className="h-3 w-3" />
                  {ex.label}
                </Button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {(showVisualization || getVisualization.isPending) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-2 border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-500/15">
                        <Play className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-child text-sm font-bold text-purple-600 dark:text-purple-400" data-testid="text-viz-title">
                          Visual Explanation
                        </h3>
                        {parsedResult && (
                          <p className="text-xs text-muted-foreground" data-testid="text-viz-description">
                            {parsedResult.operand1} {parsedResult.operator} {parsedResult.operand2} = {Number.isInteger(parsedResult.answer) ? parsedResult.answer : parsedResult.answer.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {getVisualization.isPending && !vizVideoUrl ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 gap-4"
                        data-testid="viz-loading"
                      >
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-child text-sm font-medium text-purple-600 dark:text-purple-400">
                            Creating your animation...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This may take a few seconds
                          </p>
                        </div>
                      </motion.div>
                    ) : vizVideoUrl ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative rounded-lg overflow-hidden bg-[#1a1b26]"
                        data-testid="viz-video-container"
                      >
                        <video
                          ref={videoRef}
                          src={vizVideoUrl}
                          autoPlay
                          controls
                          playsInline
                          className="w-full rounded-lg"
                          style={{ aspectRatio: "16/9" }}
                          data-testid="viz-video"
                        />
                      </motion.div>
                    ) : getVisualization.isError ? (
                      <div className="text-center py-8" data-testid="viz-error">
                        <p className="text-sm text-muted-foreground">
                          Could not create the animation right now.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 gap-2"
                          onClick={handleVisualize}
                          data-testid="button-viz-retry"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(aiFeedback || getMathExplanation.isPending) && parsedResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/15 shrink-0">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-child text-sm font-bold text-blue-600 dark:text-blue-400">
                          AI Explanation
                        </h3>
                        <div className="text-sm font-child">
                          {getMathExplanation.isPending ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>AI is thinking...</span>
                            </div>
                          ) : aiFeedback ? (
                            <p data-testid="text-ai-feedback">{aiFeedback}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

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
    </div>
  );
}
