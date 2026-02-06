import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Play, 
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Loader2,
  MessageCircle,
  Send,
  X,
  Trash2,
  MousePointer2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  RefreshCcw,
  Upload,
  FileText,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VibeMonitor } from "@/components/vibe-monitor";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import type { VibeStateType, Story, ChatMessage } from "@shared/schema";

type ReadingMode = "auto" | "cursor";

interface StorySection {
  title: string;
  content: string;
  wordCount: number;
}

export default function Reading() {
  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const currentStory = stories?.find(s => s.id === selectedStoryId) || null;

  const sections: StorySection[] = currentStory?.sections 
    ? JSON.parse(currentStory.sections) 
    : currentStory 
      ? [{ title: currentStory.title, content: currentStory.content, wordCount: currentStory.wordCount || 0 }]
      : [];

  const hasSections = sections.length > 1;
  const currentSection = sections[currentSectionIndex] || null;
  const sectionContent = currentSection?.content || "";

  const storyId = currentStory?.id || "";
  const userId = "user-1";

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${userId}/${storyId}`],
    enabled: !!storyId,
  });

  const [readingMode, setReadingMode] = useState<ReadingMode>("cursor");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentVibe, setCurrentVibe] = useState<VibeStateType>("focused");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isDefining, setIsDefining] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{ id: string; question: string; options: string[] }>>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalQuestions: number;
    passed: boolean;
    feedback: string;
    correctAnswers: number[];
  } | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const resetReadingState = useCallback(() => {
    setCurrentWordIndex(0);
    setHoveredWordIndex(null);
    setIsPlaying(false);
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizId(null);
    setSelectedAnswers({});
    setQuizResult(null);
    setQuizSubmitted(false);
  }, []);

  const saveReadingProgress = useMutation({
    mutationFn: async (data: { wordsRead: number; currentPosition: number; completed: boolean }) => {
      const response = await apiRequest("POST", "/api/reading-progress", {
        userId: "user-1",
        storyId: currentStory?.id,
        accuracy: 95,
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

  const sendChatMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        userId,
        storyId,
        message,
        currentPosition: currentWordIndex,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${userId}/${storyId}`] });
      setChatInput("");
      setSelectedWord(null);
      setIsDefining(false);
    },
  });

  const clearChat = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/chat/${userId}/${storyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${userId}/${storyId}`] });
    },
  });

  const generateQuiz = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quiz/generate/${storyId}`, { 
        userId,
        sectionIndex: hasSections ? currentSectionIndex : undefined,
        sectionContent: hasSections ? sectionContent : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.questions && data.questions.length > 0 && data.quizId) {
        setQuizQuestions(data.questions);
        setQuizId(data.quizId);
        setSelectedAnswers({});
        setQuizResult(null);
        setQuizSubmitted(false);
      }
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const answers = quizQuestions.map((_, i) => selectedAnswers[i] ?? -1);
      const response = await apiRequest("POST", `/api/quiz/${quizId}/submit`, { answers });
      return response.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setQuizSubmitted(true);
      queryClient.invalidateQueries({ queryKey: [`/api/quiz/user/${userId}`] });
    },
  });

  const handleUploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("userId", userId);

      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setSelectedStoryId(data.story.id);
      setCurrentSectionIndex(0);
      resetReadingState();
    } catch (error: any) {
      console.error("PDF upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const words = sectionContent.split(/(\s+)/).filter(w => w.trim());
  const totalWords = words.length;
  const effectiveWordIndex = readingMode === "cursor" && hoveredWordIndex !== null 
    ? hoveredWordIndex 
    : currentWordIndex;
  const progress = totalWords > 0 ? (effectiveWordIndex / totalWords) * 100 : 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (readingMode === "auto" && isPlaying && currentWordIndex < totalWords) {
      interval = setInterval(() => {
        setCurrentWordIndex((prev) => {
          const newIndex = Math.min(prev + 1, totalWords);
          if (newIndex % 20 === 0 || newIndex === totalWords) {
            saveReadingProgress.mutate({
              wordsRead: newIndex,
              currentPosition: newIndex,
              completed: newIndex === totalWords,
            });
          }
          return newIndex;
        });
      }, 600 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [readingMode, isPlaying, currentWordIndex, totalWords, playbackSpeed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying || (readingMode === "cursor" && hoveredWordIndex !== null)) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, readingMode, hoveredWordIndex]);

  useEffect(() => {
    if (progress > 75) {
      setCurrentVibe("happy");
    } else if (isPlaying || (readingMode === "cursor" && hoveredWordIndex !== null)) {
      setCurrentVibe("focused");
    }
  }, [progress, isPlaying, readingMode, hoveredWordIndex]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (readingMode === "cursor" && hoveredWordIndex !== null && hoveredWordIndex % 10 === 0) {
      saveReadingProgress.mutate({
        wordsRead: hoveredWordIndex,
        currentPosition: hoveredWordIndex,
        completed: hoveredWordIndex >= totalWords - 1,
      });
    }
  }, [hoveredWordIndex, readingMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (currentWordIndex >= totalWords) {
      setCurrentWordIndex(0);
    }
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    if (newIsPlaying) {
      saveVibeState.mutate("focused");
    }
  };

  const skipBack = () => setCurrentWordIndex(Math.max(0, currentWordIndex - 10));
  const skipForward = () => setCurrentWordIndex(Math.min(totalWords, currentWordIndex + 10));

  const handleSendMessage = () => {
    if (chatInput.trim() && !sendChatMessage.isPending) {
      sendChatMessage.mutate(chatInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    generateQuiz.mutate();
  };

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!quizId || quizQuestions.length === 0) return;
    if (Object.keys(selectedAnswers).length < quizQuestions.length) return;
    submitQuiz.mutate();
  };

  const handleRetryQuiz = () => {
    setQuizResult(null);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    generateQuiz.mutate();
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      resetReadingState();
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      resetReadingState();
    }
  };

  const handleSelectStory = (storyId: string) => {
    setSelectedStoryId(storyId);
    setCurrentSectionIndex(0);
    resetReadingState();
  };

  const isStoryComplete = progress >= 90;

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, "");
    if (cleanWord.length > 2) {
      setSelectedWord(cleanWord);
      setIsChatOpen(true);
      setIsDefining(true);
      sendChatMessage.mutate(`What does the word "${cleanWord}" mean? Please explain it simply.`);
    }
  };

  const handleWordHover = (index: number) => {
    if (readingMode === "cursor") {
      setHoveredWordIndex(index);
      setCurrentWordIndex(index);
    }
  };

  const renderWord = (word: string, index: number) => {
    const isCurrentWord = readingMode === "cursor" 
      ? index === hoveredWordIndex 
      : index === currentWordIndex;
    const isPastWord = readingMode === "cursor"
      ? hoveredWordIndex !== null && index < hoveredWordIndex
      : index < currentWordIndex;
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, "");
    const isClickable = cleanWord.length > 2;

    return (
      <Tooltip key={index}>
        <TooltipTrigger asChild>
          <motion.span
            className={`inline transition-all duration-200 cursor-pointer select-none ${
              isCurrentWord 
                ? "bg-primary/20 text-primary font-bold rounded px-1" 
                : isPastWord 
                  ? "text-muted-foreground" 
                  : "text-foreground"
            } ${isClickable ? "hover:underline" : ""}`}
            animate={{
              scale: isCurrentWord ? 1.05 : 1,
            }}
            onMouseEnter={() => handleWordHover(index)}
            onClick={() => handleWordClick(word)}
            data-testid={`word-${index}`}
          >
            {word}{" "}
          </motion.span>
        </TooltipTrigger>
        {isClickable && (
          <TooltipContent side="top" className="font-child">
            <p className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Click to learn about "{cleanWord}"
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!selectedStoryId || !currentStory) {
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
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-child text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-reading-title">Reading Library</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="font-child text-3xl font-bold" data-testid="text-library-heading">Choose What to Read</h1>
              <p className="text-muted-foreground">Pick a story or upload your own PDF!</p>
            </div>

            <Card className="border-2 border-dashed border-primary/30">
              <CardContent className="p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPdf(file);
                  }}
                  data-testid="input-pdf-upload"
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                <h3 className="font-child text-xl font-bold mb-2">Upload a PDF</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Upload any PDF file and read it section by section with AI-powered quizzes!
                </p>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-upload-pdf"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div>
              <h2 className="font-child text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Available Stories
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {stories?.map((story) => (
                  <Card 
                    key={story.id} 
                    className="hover-elevate cursor-pointer transition-all duration-200"
                    onClick={() => handleSelectStory(story.id)}
                    data-testid={`card-story-${story.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                          story.sourceType === "pdf" ? "bg-blue-500/10" : "bg-emerald-500/10"
                        }`}>
                          {story.sourceType === "pdf" ? (
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-child font-bold truncate" data-testid={`text-story-title-${story.id}`}>
                            {story.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {story.wordCount} words
                            </span>
                            {story.sourceType === "pdf" && story.sections && (
                              <Badge variant="secondary" className="text-xs">
                                <Layers className="h-3 w-3 mr-1" />
                                {JSON.parse(story.sections).length} sections
                              </Badge>
                            )}
                            {story.sourceType === "pdf" && (
                              <Badge variant="outline" className="text-xs">PDF</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {story.content.substring(0, 120)}...
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedStoryId(null)}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-child text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-reading-title">Reading</span>
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

      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-8 flex-1 ${isChatOpen ? "max-w-2xl" : "max-w-4xl mx-auto"}`}
          >
            <div className="text-center space-y-2">
              <h1 className="font-child text-3xl font-bold" data-testid="text-story-title">{currentStory.title}</h1>
              {hasSections && (
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={currentSectionIndex === 0}
                    onClick={handlePrevSection}
                    data-testid="button-prev-section"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Badge variant="secondary" className="font-child" data-testid="badge-section-indicator">
                    <Layers className="h-3 w-3 mr-1" />
                    Section {currentSectionIndex + 1} of {sections.length}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={currentSectionIndex >= sections.length - 1}
                    onClick={handleNextSection}
                    data-testid="button-next-section"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <p className="text-muted-foreground">
                {readingMode === "cursor" 
                  ? "Move your cursor over words to read along" 
                  : "Read along with the highlighted words"}
              </p>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <Badge 
                        variant={readingMode === "cursor" ? "default" : "secondary"}
                        className="text-xs"
                        data-testid="badge-reading-mode"
                      >
                        {readingMode === "cursor" ? (
                          <><MousePointer2 className="h-3 w-3 mr-1" /> Cursor Mode</>
                        ) : (
                          <><Play className="h-3 w-3 mr-1" /> Auto Mode</>
                        )}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium" data-testid="text-word-progress">{effectiveWordIndex} / {totalWords} words</span>
                  </div>
                  <Progress value={progress} className="h-2" data-testid="progress-bar" />
                </div>

                <div 
                  className="font-child text-2xl leading-relaxed max-h-[50vh] overflow-y-auto p-4 rounded-xl bg-muted/30"
                  data-testid="text-story-content"
                  onMouseLeave={() => readingMode === "cursor" && setHoveredWordIndex(null)}
                >
                  {words.map((word, index) => renderWord(word, index))}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Click on any word to get an AI explanation!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={readingMode === "cursor" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setReadingMode("cursor");
                        setIsPlaying(false);
                      }}
                      className="gap-2"
                      data-testid="button-cursor-mode"
                    >
                      <MousePointer2 className="h-4 w-4" />
                      Cursor Tracking
                    </Button>
                    <Button
                      variant={readingMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReadingMode("auto")}
                      className="gap-2"
                      data-testid="button-auto-mode"
                    >
                      <Play className="h-4 w-4" />
                      Auto Read
                    </Button>
                  </div>

                  {readingMode === "auto" && (
                    <>
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={skipBack}
                          disabled={currentWordIndex === 0}
                          data-testid="button-skip-back"
                        >
                          <SkipBack className="h-5 w-5" />
                        </Button>

                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button 
                            size="lg" 
                            className="rounded-full"
                            onClick={togglePlay}
                            data-testid="button-play-pause"
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6 ml-1" />
                            )}
                          </Button>
                        </motion.div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={skipForward}
                          disabled={currentWordIndex >= totalWords}
                          data-testid="button-skip-forward"
                        >
                          <SkipForward className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 w-full max-w-xs">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Speed: {playbackSpeed}x
                          </label>
                          <Slider
                            value={[playbackSpeed]}
                            onValueChange={([value]) => setPlaybackSpeed(value)}
                            min={0.5}
                            max={2}
                            step={0.25}
                            className="w-full"
                            data-testid="slider-speed"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {readingMode === "cursor" && (
                    <p className="text-sm text-muted-foreground text-center">
                      Hover over words to track your reading. The highlighted word follows your cursor!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {hasSections && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="outline"
                      disabled={currentSectionIndex === 0}
                      onClick={handlePrevSection}
                      className="gap-2"
                      data-testid="button-prev-section-bottom"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Section
                    </Button>
                    <span className="text-sm text-muted-foreground font-child">
                      {currentSectionIndex + 1} / {sections.length}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentSectionIndex >= sections.length - 1}
                      onClick={handleNextSection}
                      className="gap-2"
                      data-testid="button-next-section-bottom"
                    >
                      Next Section
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isStoryComplete && !showQuiz && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                    <h3 className="font-child text-xl font-bold mb-2">
                      {hasSections ? `Great job reading Section ${currentSectionIndex + 1}!` : "Great job reading!"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Ready to test what you learned?
                    </p>
                    <Button
                      size="lg"
                      onClick={handleStartQuiz}
                      className="gap-2"
                      data-testid="button-start-quiz"
                    >
                      <Sparkles className="h-5 w-5" />
                      Take the Quiz
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {showQuiz && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="font-child flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Reading Comprehension Quiz
                      {hasSections && (
                        <Badge variant="secondary" className="ml-2">
                          Section {currentSectionIndex + 1}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {generateQuiz.isPending ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="font-child text-muted-foreground">Creating quiz questions...</p>
                      </div>
                    ) : generateQuiz.isError || (quizQuestions.length === 0 && !generateQuiz.isPending) ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <XCircle className="h-12 w-12 text-amber-500 mb-4" />
                        <p className="font-child font-medium mb-2">Couldn't create the quiz right now.</p>
                        <p className="text-muted-foreground text-sm mb-4">Let's try again in a moment!</p>
                        <Button onClick={() => generateQuiz.mutate()} className="gap-2" data-testid="button-retry-generate">
                          <RefreshCcw className="h-4 w-4" />
                          Try Again
                        </Button>
                      </div>
                    ) : quizResult ? (
                      <div className="space-y-6">
                        <div className={`text-center p-6 rounded-xl ${quizResult.passed ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                          {quizResult.passed ? (
                            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                          ) : (
                            <RefreshCcw className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                          )}
                          <h3 className="font-child text-2xl font-bold mb-2">
                            {quizResult.passed ? "Excellent Work!" : "Nice Try!"}
                          </h3>
                          <p className="text-3xl font-bold mb-4" data-testid="text-quiz-score">
                            {quizResult.score} / {quizResult.totalQuestions}
                          </p>
                          <p className="text-muted-foreground font-child" data-testid="text-quiz-feedback">
                            {quizResult.feedback}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {quizQuestions.map((q, qIdx) => {
                            const userAnswer = selectedAnswers[qIdx];
                            const isCorrect = userAnswer === quizResult.correctAnswers[qIdx];
                            return (
                              <div key={q.id} className="p-4 rounded-lg bg-muted/50">
                                <p className="font-child font-medium mb-2 flex items-center gap-2">
                                  {isCorrect ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  )}
                                  {q.question}
                                </p>
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Your answer: </span>
                                  <span className={isCorrect ? "text-emerald-600" : "text-red-600"}>
                                    {q.options[userAnswer]}
                                  </span>
                                </p>
                                {!isCorrect && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Correct answer: </span>
                                    <span className="text-emerald-600">
                                      {q.options[quizResult.correctAnswers[qIdx]]}
                                    </span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-center gap-4 flex-wrap">
                          {!quizResult.passed && (
                            <Button
                              variant="outline"
                              onClick={handleRetryQuiz}
                              className="gap-2"
                              data-testid="button-retry-quiz"
                            >
                              <RefreshCcw className="h-4 w-4" />
                              Try Again
                            </Button>
                          )}
                          {hasSections && currentSectionIndex < sections.length - 1 && quizResult.passed && (
                            <Button
                              variant="outline"
                              onClick={handleNextSection}
                              className="gap-2"
                              data-testid="button-quiz-next-section"
                            >
                              Next Section
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => setShowQuiz(false)}
                            className="gap-2"
                            data-testid="button-close-quiz"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {quizQuestions.map((q, qIdx) => (
                          <div key={q.id} className="space-y-3" data-testid={`quiz-question-${qIdx}`}>
                            <p className="font-child font-medium">
                              {qIdx + 1}. {q.question}
                            </p>
                            <div className="grid gap-2">
                              {q.options.map((option, optIdx) => (
                                <Button
                                  key={optIdx}
                                  variant={selectedAnswers[qIdx] === optIdx ? "default" : "outline"}
                                  className="justify-start text-left h-auto py-3 font-child"
                                  onClick={() => handleSelectAnswer(qIdx, optIdx)}
                                  data-testid={`quiz-option-${qIdx}-${optIdx}`}
                                >
                                  <span className="w-6 h-6 rounded-full border flex items-center justify-center mr-3 text-xs font-bold shrink-0">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  {option}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}

                        <Button
                          size="lg"
                          className="w-full gap-2"
                          disabled={Object.keys(selectedAnswers).length < quizQuestions.length || submitQuiz.isPending}
                          onClick={handleSubmitQuiz}
                          data-testid="button-submit-quiz"
                        >
                          {submitQuiz.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Checking answers...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-5 w-5" />
                              Submit Answers
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="flex justify-center gap-4 pb-20 flex-wrap">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setSelectedStoryId(null)}
                data-testid="button-back-library"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Library
              </Button>
              <Button
                variant={isChatOpen ? "secondary" : "default"}
                className="gap-2"
                onClick={() => setIsChatOpen(!isChatOpen)}
                data-testid="button-toggle-chat"
              >
                <MessageCircle className="h-4 w-4" />
                {isChatOpen ? "Close Chat" : "Ask AI Buddy"}
              </Button>
            </div>
          </motion.div>

          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 100, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "350px" }}
                exit={{ opacity: 0, x: 100, width: 0 }}
                className="shrink-0"
              >
                <Card className="h-[calc(100vh-200px)] sticky top-24 flex flex-col z-50">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4 border-b">
                    <CardTitle className="text-base font-child flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Reading Buddy
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearChat.mutate()}
                        disabled={clearChat.isPending || chatMessages.length === 0}
                        data-testid="button-clear-chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsChatOpen(false)}
                        data-testid="button-close-chat"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                    <div className="space-y-4">
                      {chatMessages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-child text-sm">Hi there! I'm your AI reading buddy!</p>
                          <p className="text-xs mt-2">Click on words in the story or ask me anything!</p>
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium">Try asking:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {["What is this about?", "What happens next?", "Help me understand"].map((q) => (
                                <Badge 
                                  key={q} 
                                  variant="outline" 
                                  className="cursor-pointer text-xs"
                                  onClick={() => {
                                    setChatInput(q);
                                    sendChatMessage.mutate(q);
                                  }}
                                >
                                  {q}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          data-testid={`chat-message-${msg.role}-${msg.id}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm font-child">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {sendChatMessage.isPending && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl px-4 py-2 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs font-child">
                              {isDefining ? `Learning about "${selectedWord}"...` : "Thinking..."}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask about the story..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendChatMessage.isPending}
                        className="font-child"
                        data-testid="input-chat"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || sendChatMessage.isPending}
                        data-testid="button-send-chat"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <VibeMonitor currentVibe={currentVibe} />
    </div>
  );
}
