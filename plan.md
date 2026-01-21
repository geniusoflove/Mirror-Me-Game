## Plan: Build Multiplayer Blank Slate Game

A Next.js + Socket.IO web game where players complete word prompts and score points for matching (but not too many) other players. Streamer-friendly UI, private rooms, real-time multiplayer, and external video chat support.

### Steps

1. **Initialize project structure** — Create Next.js frontend with TypeScript/Tailwind and separate server directory for Node.js + Socket.IO backend

2. **Build Socket.IO event system** — Implement real-time events for:
   - Room management (create/join/leave)
   - Player state (connected/disconnected/reconnected)
   - Game state sync and phase transitions
   - Answer submission and reveal

3. **Create lobby system** — Build waiting room where players gather before game starts:
   - Display connected players with ready status
   - Host controls to start game (min 3 players)
   - Player limit: 3-8 players per room

4. **Create core game components** — Build with phase-based rendering:
   - `components/Lobby.tsx` — Pre-game waiting room
   - `components/GameRoom.tsx` — Main game container
   - `components/PromptCard.tsx` — Current prompt display
   - `components/AnswerInput.tsx` — Player answer submission
   - `components/RevealPhase.tsx` — Dramatic answer reveal before scoring
   - `components/ScoreBoard.tsx` — Running scores and round results

5. **Implement game logic** — Server-side game engine:
   - Prompt library in `lib/prompts.ts` (100+ mixed prompts)
   - Answer normalization in `lib/answers.ts` (lowercase, trim, handle plurals)
   - Scoring algorithm in `lib/scoring.ts`:
     - 3 pts: Match with 1-2 other players
     - 1 pt: Unique answer
     - 0 pts: Match with 3+ players (too common)
   - Phase state machine: lobby → prompt → answering → reveal → scoring → (repeat or end)

6. **Add reconnection handling** — Persist game state to allow:
   - Player reconnection within 60 seconds
   - Graceful handling of host disconnect (transfer to next player)
   - Game pause if too many players drop

7. **Add streamer mode** — Toggle in `components/StreamerMode.tsx`:
   - Overlay-friendly layout with transparent backgrounds
   - Larger text and high-contrast colors
   - Spectator view (watch without playing)
   - Hide/show answer input for screen privacy

8. **Configure deployment** — Production setup:
   - `netlify.toml` for frontend
   - `fly.toml` for backend
   - Environment variables for Socket.IO server URL
   - CORS configuration for cross-origin WebSocket

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Room codes | 6-char alphanumeric (exclude 0/O/1/I/L) | Unique, readable, easy to share verbally |
| Timer | 60s default, host-configurable (30/60/90s) | Flexibility from the start |
| Prompts | Mixed for MVP, structured for categories | Easy to extend later |
| Answer matching | Case-insensitive, trimmed, singular/plural equivalent | Reduces frustrating near-misses |
| Min/Max players | 3-8 players | Game balance sweet spot |
| Rounds | 10 rounds default, host-configurable (5/10/15) | Typical game length |
