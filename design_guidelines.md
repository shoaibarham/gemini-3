# Design Guidelines: Marathon Agent - Autonomous Cognitive Tutor

## Design Approach: Design System + Educational Best Practices
**Selected Framework:** Material Design 3 with child-friendly adaptations
**Rationale:** Educational applications require clarity, accessibility, and playful engagement. Material Design provides excellent accessibility foundations with clear interaction patterns that work well for young learners.

---

## Typography Hierarchy

**Primary Font:** Nunito (Google Fonts) - rounded, friendly, highly legible for children
**Secondary Font:** Inter (Google Fonts) - for UI elements and parent-facing content

**Scale:**
- Hero/Page Titles: text-5xl font-bold (child content) / text-4xl font-semibold (parent content)
- Section Headers: text-3xl font-bold
- Card Titles: text-xl font-semibold
- Body Text (Reading): text-2xl leading-relaxed (larger for readability)
- Body Text (UI): text-base leading-normal
- Labels/Captions: text-sm font-medium

---

## Layout System

**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12, 16
- Component padding: p-6 or p-8
- Section spacing: py-12 md:py-16
- Card gaps: gap-6
- Tight spacing: space-y-3 or space-y-4

**Container Strategy:**
- Main content: max-w-6xl mx-auto px-6
- Reading view: max-w-4xl (optimal reading width for children)
- Dashboard/Parent view: max-w-7xl

---

## Core Components

### Navigation
- **Child Mode:** Large, icon-based navigation with minimal text, fixed bottom bar on mobile
- **Parent Mode:** Traditional top navigation with session controls, progress indicators
- Prominent "Help" button always visible
- Clear visual distinction between child/parent modes

### Reading Interface
- Large text display area with adjustable font size controls
- Live text highlighting synchronized with audio (animated underline or background)
- Progress indicator showing position in text
- Playback controls: large, colorful, icon-based buttons (play/pause, speed, repeat)
- Word/sentence tracking visualization

### Math Interface  
- Problem display in large, clear format
- Interactive number pad or input area with tactile feedback
- Step-by-step solution breakdown
- Visual manipulatives (number lines, fraction bars) as needed
- Celebration animations for correct answers

### Dashboard Cards
- Rounded corners (rounded-2xl)
- Elevated appearance with shadow-lg
- Icon + Title + Metric layout
- Progress rings or bars for visual feedback
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

### Vibe Monitor (Non-intrusive)
- Subtle corner indicator (bottom-right)
- Simple emoji or icon representation
- Expandable tooltip on hover
- Never interrupts active learning

### Parent Controls
- Session overview dashboard
- Real-time progress tracking
- Report generation interface
- Settings panel for customization
- Clear data visualization (charts, graphs)

---

## Interaction Patterns

**Feedback:**
- Immediate visual feedback on all interactions
- Success: Gentle scale animation + checkmark
- Error: Shake animation + helpful message
- Loading: Playful animated spinner

**Accessibility:**
- Minimum touch target: 44px × 44px
- High contrast ratios (WCAG AAA for text)
- Keyboard navigation throughout
- Screen reader announcements for state changes
- Focus indicators: ring-4 ring-offset-2

**Child-Friendly Elements:**
- Large, rounded buttons with icons
- Playful illustrations for empty states
- Encouraging micro-animations (sparkles, bounces)
- Clear visual progress indicators
- Gentle transitions (duration-300 ease-in-out)

---

## Page Layouts

### Landing Page (Parent-Facing)
- **Hero:** Illustration showing child + agent interaction, headline emphasizing personalized learning, CTA to start trial
- **Features:** 3-column grid showcasing Reading, Math, and Vibe Monitoring
- **How It Works:** Step-by-step with numbered cards
- **Testimonials:** 2-column parent quotes with child success metrics
- **Pricing/CTA:** Clear call-to-action with trial offer

### Child Dashboard
- Welcome message with child's name
- Quick-start cards: "Continue Reading" + "Practice Math"
- Recent achievements showcase
- Today's goals tracker
- Minimal navigation, maximum engagement

### Parent Dashboard
- Session summary at top
- Multi-column grid: Reading Progress, Math Progress, Vibe Insights, Recent Sessions
- Charts showing trends over time
- Quick action buttons: Start Session, View Reports, Settings

---

## Images

**Hero Image:** Warm, diverse illustration of a child engaged with tablet/device, tutor agent represented as friendly character/icon overlay. Image conveys focus, joy, and learning. Placement: Full-width hero section, image on right 50%, content on left 50% (desktop), stacked on mobile.

**Feature Icons/Illustrations:** Custom illustrations for Reading (book with audio waves), Math (numbers/equation with sparkles), Vibe Monitoring (gentle smiley face with heartbeat). These should be colorful, simplified, and child-appropriate.

**Dashboard Placeholders:** When no recent activity, use encouraging illustrations (e.g., friendly mascot character saying "Ready to learn!")

**Success Celebrations:** Animated illustrations triggered on achievements (confetti, stars, trophy)

---

## Design Principles

1. **Clarity Over Complexity:** Every element serves learning; no decorative clutter
2. **Joyful Learning:** Playful without being distracting
3. **Immediate Feedback:** Children know instantly if they're on track
4. **Parent Confidence:** Clear, data-rich insights for adult users
5. **Accessibility First:** Every child can use this regardless of ability level