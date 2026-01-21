# Blank Slate - Multiplayer Word Game

A real-time multiplayer word-matching party game built with Next.js and Socket.IO. Players complete word prompts and score points for matching answers with others (but not too many others!).

## Quick Start

### 1. Start the Backend Server

```bash
cd server
npm install  # if not already done
npm run dev
```

Server runs on http://localhost:3001

### 2. Start the Frontend

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend runs on http://localhost:3000

### 3. Play!

1. Open http://localhost:3000 in your browser
2. Create a room or join with a room code
3. Share the room code with friends (3-8 players)
4. Host starts the game when ready

## Game Rules

- Each round, everyone sees a prompt like "Birthday ___" or "___ dog"
- Enter ONE word to complete the prompt
- Score points based on matches:
  - **3 points** - Match with 1-2 other players (perfect match!)
  - **1 point** - Unique answer (no one else thought of it)
  - **0 points** - Match with 3+ players (too common)

## Features

- **Real-time multiplayer** - Socket.IO for instant updates
- **Room codes** - Easy 6-character codes to join games
- **Streamer mode** - Press `Ctrl+Shift+S` to hide your answers (great for streaming!)
- **Spectator mode** - Watch games without playing
- **Host controls** - Configurable timer (30/60/90s) and rounds (5/10/15)
- **170+ prompts** - Variety of word completion prompts

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Styling**: Tailwind CSS with glassmorphism effects

## Project Structure

```
blank-slate-game/
├── frontend/          # Next.js frontend
│   ├── app/           # App router pages
│   ├── components/    # React components
│   ├── contexts/      # Socket context
│   └── lib/shared/    # Shared types
├── server/            # Socket.IO backend
│   └── src/
│       ├── index.ts   # Server entry
│       └── shared/    # Shared types
└── shared/            # Source shared types
```

## Deployment

### Frontend (Netlify/Vercel)

Set environment variable:
```
NEXT_PUBLIC_SERVER_URL=https://your-server-url.com
```

### Backend (Fly.io/Railway)

Set environment variable:
```
FRONTEND_URL=https://your-frontend-url.com
PORT=3001
```
