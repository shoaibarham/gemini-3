import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Frown, Meh, HelpCircle, Zap, Coffee } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { VibeStateType } from "@shared/schema";

interface VibeMonitorProps {
  currentVibe: VibeStateType;
  className?: string;
}

const vibeConfig: Record<VibeStateType, { icon: typeof Smile; color: string; label: string; bg: string }> = {
  focused: { icon: Zap, color: "text-amber-500", label: "Focused", bg: "bg-amber-100 dark:bg-amber-900/30" },
  happy: { icon: Smile, color: "text-emerald-500", label: "Happy", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  confused: { icon: HelpCircle, color: "text-purple-500", label: "Needs Help", bg: "bg-purple-100 dark:bg-purple-900/30" },
  frustrated: { icon: Frown, color: "text-red-500", label: "Frustrated", bg: "bg-red-100 dark:bg-red-900/30" },
  tired: { icon: Coffee, color: "text-blue-500", label: "Tired", bg: "bg-blue-100 dark:bg-blue-900/30" },
  neutral: { icon: Meh, color: "text-gray-500", label: "Neutral", bg: "bg-gray-100 dark:bg-gray-800/50" },
};

export function VibeMonitor({ currentVibe, className = "" }: VibeMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = vibeConfig[currentVibe];
  const Icon = config.icon;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            className={`relative flex items-center gap-2 rounded-full ${config.bg} p-3 shadow-lg transition-all duration-300 hover-elevate`}
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-vibe-monitor"
          >
            <motion.div
              animate={{
                scale: currentVibe === "focused" ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: currentVibe === "focused" ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              <Icon className={`h-6 w-6 ${config.color}`} />
            </motion.div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className={`font-child font-semibold text-sm ${config.color} whitespace-nowrap overflow-hidden`}
                >
                  {config.label}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
                currentVibe === "happy" || currentVibe === "focused" 
                  ? "bg-emerald-400" 
                  : currentVibe === "confused" || currentVibe === "frustrated" 
                    ? "bg-amber-400" 
                    : "bg-gray-400"
              }`}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-child">
          <p>Current Vibe: {config.label}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
