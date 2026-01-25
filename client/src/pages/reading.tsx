import { useState, useEffect, useRef } from "react";
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
  BookOpen,
  Clock,
  Loader2,
  MessageCircle,
  Send,
  X,
  Trash2,
  MousePointer2,
  Sparkles
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

export default function Reading() {
  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const currentStory = stories?.[0] || {
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

  const storyId = currentStory.id;
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

  const saveReadingProgress = useMutation({
    mutationFn: async (data: { wordsRead: number; currentPosition: number; completed: boolean }) => {
      const response = await apiRequest("POST", "/api/reading-progress", {
        userId: "user-1",
        storyId: currentStory.id,
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

  const words = currentStory.content.split(/(\s+)/).filter(w => w.trim());
  const totalWords = words.length;
  const effectiveWordIndex = readingMode === "cursor" && hoveredWordIndex !== null 
    ? hoveredWordIndex 
    : currentWordIndex;
  const progress = (effectiveWordIndex / totalWords) * 100;

  // Auto-play mode effect
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying || (readingMode === "cursor" && hoveredWordIndex !== null)) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, readingMode, hoveredWordIndex]);

  // Vibe tracking
  useEffect(() => {
    if (progress > 75) {
      setCurrentVibe("happy");
    } else if (isPlaying || (readingMode === "cursor" && hoveredWordIndex !== null)) {
      setCurrentVibe("focused");
    }
  }, [progress, isPlaying, readingMode, hoveredWordIndex]);

  // Chat scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Save progress periodically in cursor mode
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

  const skipBack = () => {
    setCurrentWordIndex(Math.max(0, currentWordIndex - 10));
  };

  const skipForward = () => {
    setCurrentWordIndex(Math.min(totalWords, currentWordIndex + 10));
  };

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

  const handleWordClick = (word: string, index: number) => {
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
      // Update the current word index to track cursor position
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
            } ${isClickable ? "hover:bg-primary/10 hover:rounded" : ""}`}
            animate={{
              scale: isCurrentWord ? 1.05 : 1,
            }}
            onMouseEnter={() => handleWordHover(index)}
            onClick={() => handleWordClick(word, index)}
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
              <p className="text-muted-foreground">
                {readingMode === "cursor" 
                  ? "Move your cursor over words to read along" 
                  : "Read along with the highlighted words"}
              </p>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
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
                  {/* Mode Toggle */}
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

                  {/* Auto-play controls - only show in auto mode */}
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

            <div className="flex justify-center gap-4 pb-20">
              <Link href="/child">
                <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
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
                              {["Who is Finn?", "What happens next?", "Explain 'adventure'"].map((q) => (
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
