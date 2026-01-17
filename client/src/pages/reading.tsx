import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Play, 
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronLeft,
  BookOpen,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { VibeMonitor } from "@/components/vibe-monitor";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import type { VibeStateType, Story } from "@shared/schema";

export default function Reading() {
  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const currentStory = stories?.[0] || {
    id: "1",
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentVibe, setCurrentVibe] = useState<VibeStateType>("focused");
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const words = currentStory.content.split(/(\s+)/).filter(w => w.trim());
  const totalWords = words.length;
  const progress = (currentWordIndex / totalWords) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentWordIndex < totalWords) {
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
  }, [isPlaying, currentWordIndex, totalWords, playbackSpeed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (progress > 75) {
      setCurrentVibe("happy");
    } else if (isPlaying) {
      setCurrentVibe("focused");
    }
  }, [progress, isPlaying]);

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

  const renderWord = (word: string, index: number) => {
    const isCurrentWord = index === currentWordIndex;
    const isPastWord = index < currentWordIndex;

    return (
      <motion.span
        key={index}
        className={`inline transition-all duration-200 ${
          isCurrentWord 
            ? "bg-primary/20 text-primary font-bold rounded px-1" 
            : isPastWord 
              ? "text-muted-foreground" 
              : "text-foreground"
        }`}
        animate={{
          scale: isCurrentWord ? 1.05 : 1,
        }}
        data-testid={`word-${index}`}
      >
        {word}{" "}
      </motion.span>
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

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="font-child text-3xl font-bold" data-testid="text-story-title">{currentStory.title}</h1>
            <p className="text-muted-foreground">Read along with the highlighted words</p>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium" data-testid="text-word-progress">{currentWordIndex} / {totalWords} words</span>
                </div>
                <Progress value={progress} className="h-2" data-testid="progress-bar" />
              </div>

              <div 
                className="font-child text-2xl leading-relaxed max-h-[50vh] overflow-y-auto p-4 rounded-xl bg-muted/30"
                data-testid="text-story-content"
              >
                {words.map((word, index) => renderWord(word, index))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-6">
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
                      className="h-16 w-16 rounded-full"
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
