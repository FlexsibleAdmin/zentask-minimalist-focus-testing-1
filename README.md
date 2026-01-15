# ZenTask - Minimalist Focus Manager

[aureliabutton]

ZenTask is a visually stunning, minimalist task management application designed to help users maintain focus and clarity. Unlike cluttered productivity tools, ZenTask adheres to a strict 'less is more' philosophy, featuring a clean, distraction-free interface with smooth micro-interactions and satisfying tactile feedback.

Built on the edge with Cloudflare Workers and Durable Objects, ZenTask ensures your data is synced instantly with ultra-low latency.

## Key Features

- **Minimalist Aesthetic**: A clean, glassmorphic interface designed to reduce cognitive load and enhance focus.
- **Instant Sync**: Powered by Cloudflare Durable Objects for immediate, consistent state across devices.
- **Optimistic UI**: Zero-latency interactions using local state management that syncs seamlessly in the background.
- **Drag & Drop Organization**: Intuitive task reordering powered by `@dnd-kit`.
- **Micro-interactions**: Satisfying animations and tactile feedback for task completion and interactions.
- **Mobile-First Design**: Optimized for touch with large targets and gesture-friendly controls.
- **Dark Mode**: Fully supported deep rich blacks and dark grays for comfortable night usage.

## Technology Stack

**Frontend:**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3
- **UI Components**: Shadcn UI (Radix Primitives)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit

**Backend & Infrastructure:**
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Persistence**: Cloudflare Durable Objects
- **Language**: TypeScript

## Getting Started

### Prerequisites

- **Bun**: This project uses [Bun](https://bun.sh/) as the package manager and runtime.
- **Wrangler**: The Cloudflare Developer Platform command-line tool.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd zentask-minimalist
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

### Development

To start the development server with hot reload:

```bash
bun run dev
```

This command starts the Vite development server. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Project Structure

- `src/`: Frontend React application code.
  - `components/`: Reusable UI components (Shadcn).
  - `pages/`: Application views.
  - `hooks/`: Custom React hooks.
  - `lib/`: Utilities and helper functions.
- `worker/`: Cloudflare Worker and Durable Object code.
  - `index.ts`: Worker entry point.
  - `durableObject.ts`: Durable Object class definition and storage logic.
  - `userRoutes.ts`: API route definitions.
- `shared/`: Types shared between frontend and backend.

## Deployment

This project is configured for deployment on Cloudflare Workers.

[aureliabutton]

To deploy manually from the command line:

1. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Deploy the application:
   ```bash
   bun run deploy
   ```

This will build the frontend assets and deploy the Worker with the Durable Object configuration.

## License

This project is open source and available under the MIT License.