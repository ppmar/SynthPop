# SynthPop UI

Web interface for [SynthPop](https://github.com/ppmar/SynthPop), a synthetic population opinion simulator.

## Stack

- **Next.js 16** (App Router)
- **Tailwind CSS 4** + shadcn/ui
- **Framer Motion** (animations)
- **Recharts** + **D3.js** (charts, network graph)
- **Zustand** (state management)
- **TanStack Query v5** (data fetching)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start the Python backend (separate terminal)
cd .. && source .venv/bin/activate && synthpop serve

# Start the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with quick actions and session stats |
| `/poll` | Quick poll — ask N agents a question |
| `/population` | Population builder with demographic controls |
| `/population/[id]` | Agent detail view |
| `/simulate` | Simulation setup and live view |
| `/simulate/[id]` | Simulation results with charts |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Python backend URL | `http://localhost:8000` |
