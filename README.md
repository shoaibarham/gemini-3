# LearnBuddy - Autonomous Cognitive Tutor

A personalized learning web application for children, featuring **Reading** and **Math** modules with AI-powered assistance, animated math visualizations, and gentle progress monitoring for parents.

## Features

- **Reading Module** - Interactive reading with word tracking, AI reading buddy (powered by Gemini), vocabulary definitions on click, PDF upload support with section-based navigation, and comprehension quizzes
- **Math Visualizer** - Type equations and see animated visual explanations powered by Manim (mathematical animation engine), with AI-generated feedback
- **Parent Dashboard** - Track reading time, math accuracy, learning streaks, vibe monitoring, quiz results, and weekly activity charts
- **Child Dashboard** - Gamified progress tracking with goals, streaks, and fun UI
- **AI Integration** - Google Gemini powers the reading buddy chatbot, math tutor feedback, word definitions, quiz generation, and quiz evaluation

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Wouter
- **Backend**: Node.js, Express 5, TypeScript
- **AI**: Google Gemini (gemini-3-pro-preview with fallback chain)
- **Math Animations**: Manim Community Edition (Python)
- **Database**: In-memory storage (PostgreSQL-ready via Drizzle ORM)

## Prerequisites

- **Node.js** 20 or higher
- **Python** 3.10+ (for Manim math visualizations)
- **Manim Community Edition** (`pip install manim`)
  - Manim also requires: `cairo`, `pango`, `pkg-config`, `ffmpeg`
  - See [Manim installation guide](https://docs.manim.community/en/stable/installation.html)
- **Google Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/apikey)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/learnbuddy.git
cd learnbuddy
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Install Manim (for math visualizations)

```bash
pip install manim
```

On Ubuntu/Debian, install Manim system dependencies first:

```bash
sudo apt install libcairo2-dev libpango1.0-dev ffmpeg pkg-config
```

On macOS:

```bash
brew install cairo pango ffmpeg pkg-config
```

### 4. Set up environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=any_random_string_here
PORT=5000
```

### 5. Start development server

```bash
npm run dev
```

The app will be available at **http://localhost:5000**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build for production (client + server) |
| `npm start` | Run the production build |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema (when using PostgreSQL) |

## Project Structure

```
learnbuddy/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components (shadcn/ui)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
│   ├── public/             # Static assets (favicon, etc.)
│   └── index.html          # HTML entry point
├── server/                 # Backend Express server
│   ├── manim/              # Manim animation scripts (Python)
│   ├── gemini.ts           # Google Gemini AI integration
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage layer
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle ORM schema + Zod validation
└── script/                 # Build scripts
    └── build.ts            # Production build script
```

## Using PostgreSQL (Optional)

By default, the app uses in-memory storage (data resets on restart). To use PostgreSQL for persistent storage:

1. Set up a PostgreSQL database
2. Add `DATABASE_URL` to your `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/learnbuddy
   ```
3. Push the schema:
   ```bash
   npm run db:push
   ```

## Default Users

The app comes with seed data for quick testing:

| Username | Password | Role |
|----------|----------|------|
| alex | password | Child |
| parent | password | Parent |

## License

MIT
