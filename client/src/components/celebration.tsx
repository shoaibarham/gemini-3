import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, Trophy } from "lucide-react";

interface CelebrationProps {
  show: boolean;
  onComplete?: () => void;
  type?: "correct" | "streak" | "achievement";
}

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 200 - 100,
  y: Math.random() * -200 - 50,
  rotation: Math.random() * 360,
  scale: Math.random() * 0.5 + 0.5,
  delay: Math.random() * 0.2,
}));

export function Celebration({ show, onComplete, type = "correct" }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const Icon = type === "achievement" ? Trophy : type === "streak" ? Star : Sparkles;
  const colors = type === "achievement" 
    ? ["#FFD700", "#FFA500", "#FF8C00"]
    : type === "streak"
      ? ["#60A5FA", "#818CF8", "#A78BFA"]
      : ["#34D399", "#10B981", "#059669"];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <Icon className="h-24 w-24 text-amber-400 drop-shadow-lg" />
          </motion.div>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
                scale: particle.scale,
                rotate: particle.rotation,
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: "easeOut",
              }}
              style={{
                left: "50%",
                top: "50%",
              }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[particle.id % colors.length] }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
