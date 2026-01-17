import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calculator, 
  Heart, 
  Play, 
  Star, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-child text-xl font-bold" data-testid="text-logo">LearnBuddy</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover-elevate rounded px-2 py-1" data-testid="link-features">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover-elevate rounded px-2 py-1" data-testid="link-how-it-works">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground transition-colors hover-elevate rounded px-2 py-1" data-testid="link-testimonials">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/child">
              <Button data-testid="button-start-learning">Start Learning</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="container mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div 
                className="space-y-8"
                initial="initial"
                animate="animate"
                variants={staggerChildren}
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Star className="h-4 w-4" />
                  Personalized Learning for Every Child
                </motion.div>
                <motion.h1 
                  variants={fadeInUp}
                  className="font-child text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                  data-testid="text-hero-title"
                >
                  Learning Made{" "}
                  <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Joyful
                  </span>
                </motion.h1>
                <motion.p 
                  variants={fadeInUp}
                  className="text-lg text-muted-foreground max-w-lg"
                  data-testid="text-hero-description"
                >
                  An autonomous cognitive tutor that adapts to your child's learning style. 
                  Reading and math support with gentle monitoring to ensure productive, happy sessions.
                </motion.p>
                <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                  <Link href="/child">
                    <Button size="lg" className="gap-2 font-child" data-testid="button-hero-start">
                      <Play className="h-5 w-5" />
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/parent">
                    <Button size="lg" variant="outline" className="gap-2" data-testid="button-hero-parent">
                      Parent Dashboard
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.div variants={fadeInUp} className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">10,000+ families</p>
                    <p className="text-muted-foreground">trust LearnBuddy</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative mx-auto max-w-md">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-2xl" />
                  <Card className="relative overflow-hidden border-2 shadow-2xl">
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="font-child text-2xl">A</span>
                          </div>
                          <div>
                            <p className="font-child text-xl font-bold">Hi Alex!</p>
                            <p className="text-sm text-muted-foreground">Ready to learn today?</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-4">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-child font-semibold">Reading</span>
                            </div>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">15 min today</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-blue-500/10 p-4">
                            <div className="flex items-center gap-3">
                              <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              <span className="font-child font-semibold">Math</span>
                            </div>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">8 problems</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3">
                          <Heart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Feeling focused today!</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <motion.div 
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-child text-3xl font-bold sm:text-4xl" data-testid="text-features-title">
                Everything Your Child Needs
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive learning support with intelligent monitoring that never interrupts the flow
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: "Reading Support",
                  description: "Real-time audio monitoring with text highlighting. Track every word as your child reads aloud.",
                  color: "from-emerald-500 to-teal-500",
                  bg: "bg-emerald-500/10",
                },
                {
                  icon: Calculator,
                  title: "Math Practice",
                  description: "Adaptive problem sets that grow with your child. Visual manipulatives and step-by-step solutions.",
                  color: "from-blue-500 to-indigo-500",
                  bg: "bg-blue-500/10",
                },
                {
                  icon: Heart,
                  title: "Vibe Monitoring",
                  description: "Gentle, non-intrusive monitoring of engagement and emotions. Insights without interruption.",
                  color: "from-amber-500 to-orange-500",
                  bg: "bg-amber-500/10",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group h-full hover-elevate transition-all duration-300">
                    <CardContent className="p-8 space-y-4">
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${feature.bg}`}>
                        <feature.icon className={`h-7 w-7 bg-gradient-to-br ${feature.color} bg-clip-text`} style={{ color: feature.color.includes("emerald") ? "#10b981" : feature.color.includes("blue") ? "#3b82f6" : "#f59e0b" }} />
                      </div>
                      <h3 className="font-child text-xl font-bold" data-testid={`text-feature-${index + 1}-title`}>{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-6">
            <motion.div 
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-child text-3xl font-bold sm:text-4xl" data-testid="text-how-it-works-title">
                How LearnBuddy Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Simple setup, powerful results. Get started in minutes.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: "1", title: "Create Profile", description: "Set up your child's learning profile with their interests and skill level" },
                { step: "2", title: "Choose Activity", description: "Select reading or math practice from our curated content library" },
                { step: "3", title: "Learn & Play", description: "Your child engages with adaptive content while we monitor their vibe" },
                { step: "4", title: "Track Progress", description: "Review insights, achievements, and growth in the parent dashboard" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-child text-xl font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <h3 className="font-child text-lg font-bold" data-testid={`text-step-${index + 1}-title`}>{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-6 left-16 w-[calc(100%-4rem)] border-t-2 border-dashed border-muted-foreground/30" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <motion.div 
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-child text-3xl font-bold sm:text-4xl" data-testid="text-testimonials-title">
                Loved by Families
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See what parents are saying about their children's learning journey
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {[
                {
                  quote: "My daughter went from struggling with reading to loving it. The gentle monitoring means she stays focused without feeling watched.",
                  author: "Sarah M.",
                  role: "Parent of Emma, age 7",
                  stat: "Reading level +2 grades",
                },
                {
                  quote: "The math practice is so engaging! My son asks to do 'just one more problem' every day. The visual explanations really help him understand.",
                  author: "David K.",
                  role: "Parent of Liam, age 9",
                  stat: "85% improvement in accuracy",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={testimonial.author}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <blockquote className="text-lg italic" data-testid={`text-testimonial-${index + 1}`}>
                        "{testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                        <div className="rounded-full bg-primary/10 px-4 py-2">
                          <span className="text-sm font-semibold text-primary">{testimonial.stat}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-6 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="font-child text-3xl font-bold sm:text-4xl" data-testid="text-cta-title">
                Start Your Child's Learning Journey Today
              </h2>
              <p className="text-white/80 max-w-xl mx-auto">
                Join thousands of families who trust LearnBuddy for personalized, joyful learning.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/child">
                <Button size="lg" variant="secondary" className="gap-2 font-child text-lg" data-testid="button-cta-start">
                  <Play className="h-5 w-5" />
                  Try Free for 7 Days
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 pt-8"
            >
              {[
                { icon: Shield, text: "Safe & Secure" },
                { icon: BarChart3, text: "Progress Tracking" },
                { icon: Users, text: "Family Friendly" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-white/90">
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-child text-lg font-bold">LearnBuddy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Making learning joyful, one child at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
