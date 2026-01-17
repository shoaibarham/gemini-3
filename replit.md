# LearnBuddy - Autonomous Cognitive Tutor

## Overview

LearnBuddy is an educational web application designed as an autonomous cognitive tutor for children. It provides personalized learning experiences in Reading and Math, with gentle monitoring to ensure joyful, productive learning sessions. The application features separate interfaces for children (learners) and parents (progress monitoring), with a "vibe monitoring" system that tracks the child's emotional state during learning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth, child-friendly animations
- **Fonts**: Nunito (child-friendly content) and Inter (UI elements)
- **Theme**: Light/dark mode support with custom CSS variables

The frontend follows a page-based structure with reusable components:
- Landing page for marketing/onboarding
- Child dashboard with gamified progress tracking
- Parent dashboard with analytics and session monitoring
- Reading module with text highlighting and audio sync capabilities
- Math module with adaptive problem generation

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Style**: RESTful JSON API under `/api/*` prefix
- **Build Tool**: esbuild for server bundling, Vite for client

The server provides endpoints for:
- User management (get by ID, get by username)
- Session tracking (CRUD operations)
- Reading progress tracking
- Math progress tracking
- Vibe state monitoring (emotional state during learning)
- Story content management

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with output to `./migrations`
- **Current Implementation**: In-memory storage class (`MemStorage`) with interface for easy database swap

Database tables:
- `users`: Learner and parent accounts with roles
- `sessions`: Learning session tracking with duration
- `reading_progress`: Per-story reading metrics and position
- `math_progress`: Problem attempts, accuracy, levels, and streaks
- `vibe_states`: Emotional state snapshots during sessions
- `stories`: Reading content library

### Design Patterns
- **Shared Schema**: Zod schemas generated from Drizzle for validation on both client and server
- **Interface-based Storage**: `IStorage` interface allows swapping between in-memory and database implementations
- **Component Library**: shadcn/ui components with custom child-friendly adaptations per design guidelines
- **Path Aliases**: `@/` for client source, `@shared/` for shared code

## External Dependencies

### UI Component Libraries
- Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- shadcn/ui built on top of Radix
- Framer Motion for animations
- Lucide React for icons
- Embla Carousel for carousels

### Database & Backend
- PostgreSQL (via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations
- connect-pg-simple for session storage
- express-session for session management

### Development Tools
- Vite with React plugin for frontend development
- Replit-specific plugins for development (error overlay, cartographer, dev banner)
- TypeScript for type safety throughout

### Fonts
- Google Fonts: Nunito (child content) and Inter (UI elements)