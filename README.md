# SynthPop — Synthetic Population Opinion Simulator

SynthPop generates diverse synthetic populations using LLMs, simulates their opinion dynamics through agent-based modeling, and verbalizes their positions on any topic. It answers the question: **"What would N people think about X?"**

## Architecture

```
LLM Persona Generation → ABM Interaction Engine → LLM Opinion Verbalization
```

1. **Persona Generation** — Demographic skeletons are sampled from configurable distributions, then enriched by an LLM (Claude Haiku) to produce full personas with backstories, personality traits, and values.
2. **Opinion Simulation** — Agents are placed on a social network and interact over multiple steps, updating their opinions via well-known opinion dynamics models.
3. **Verbalization** — Representative agents from each opinion cluster are prompted to express their views in natural language (Claude Sonnet).

## How the Simulation Works

### 1. Population Generation

Demographic attributes (age, gender, education, location, income) are sampled from target distributions defined in `config/default.yaml`. Each sampled "skeleton" is sent to an LLM to generate:

- A coherent name, occupation, and backstory (2-3 sentences)
- Big Five personality traits (`openness:high`, `conscientiousness:low`, etc.)
- Core values (tradition, freedom, equality, etc.)
- Numeric traits: `political_leaning` ([-1, 1]), `tech_savviness`, `risk_tolerance`, `influenceability` ([0, 1])

### 2. Social Network

Agents are placed on a graph that models social connections. Two topologies are available:

| Topology | Model | Description |
|---|---|---|
| `small_world` | Watts-Strogatz | Regular lattice with random rewiring. Most real social networks exhibit small-world properties. |
| `scale_free` | Barabasi-Albert | Preferential attachment — a few "hub" nodes with many connections. Models influencer dynamics. |

**Parameters:**
- `k` — Average number of neighbors (default: 6)
- `p` — Rewiring probability for small-world (default: 0.1). Higher values make the network more random.

### 3. Opinion Initialization

Each agent receives an initial opinion on the given topic:
- **Position** ([-1, +1]): seeded from `political_leaning * 0.3 + noise`, where noise ~ N(0, 0.3)
- **Confidence** ([0, 1]): initialized as `0.3 + uniform(0, 0.4)`

### 4. Opinion Dynamics

At each simulation step, every agent picks a random neighbor and updates their opinion. Two models are available:

#### Bounded Confidence (Deffuant-Weisbuch) — default

Agents only interact if their opinions are close enough:

```
if |position_A - position_B| < epsilon:
    effective_mu = mu * influenceability_A * (confidence_B / confidence_A)
    position_A += effective_mu * (position_B - position_A)
    confidence_A increases slightly (closer opinions reinforce confidence)
```

**Parameters:**
- `epsilon` (default: 0.3) — Interaction threshold. Only agents within this distance in opinion space will influence each other. Lower values lead to more fragmented clusters.
- `mu` (default: 0.1) — Base convergence speed. How fast agents move toward each other per interaction.

This model tends to produce **opinion clustering** — groups of agents converge internally while diverging between groups.

#### Voter Model

A simpler model where agents blend toward a random neighbor's opinion:

```
blend = influenceability_A * confidence_B * 0.3
position_A += blend * (position_B - position_A)
confidence_A drifts toward confidence_B
```

**Parameters:**
- `weight_confidence` (default: true) — Whether the neighbor's confidence affects adoption probability.

This model tends to produce **consensus** over time.

### 5. Data Collection

At each step, the simulation records:
- **Mean opinion** — Average position across all agents
- **Opinion variance** — Measures polarization (higher = more divided)
- **Mean confidence** — Average confidence level
- **Per-agent trajectories** — Individual position and confidence over time

### 6. Analysis & Verbalization

After simulation:
- Agents are clustered by final opinion using KMeans
- Representative agents from each cluster are sent to the LLM to express their views
- Results include: distribution breakdown (% for/against/neutral), representative quotes per cluster, polarization index, and convergence detection

## Configuration Reference

All parameters live in `config/default.yaml`:

```yaml
population:
  size: 200                          # Number of agents
  country: "France"
  language: "fr"
  distributions:
    age:        { 18-25: 0.15, 26-35: 0.20, 36-50: 0.30, 51-65: 0.20, 66+: 0.15 }
    gender:     { homme: 0.48, femme: 0.48, non-binaire: 0.04 }
    location_type: { urban: 0.45, suburban: 0.35, rural: 0.20 }
    education:  { bac: 0.25, licence: 0.25, master: 0.20, doctorat: 0.05, autodidacte: 0.25 }
    income_bracket: { low: 0.30, middle: 0.35, upper-middle: 0.25, high: 0.10 }

simulation:
  seed: 42                           # Random seed for reproducibility
  steps: 50                          # Number of simulation steps
  snapshot_interval: 5               # Steps between data snapshots
  opinion_model: "bounded_confidence" # bounded_confidence | voter
  network:
    topology: "small_world"          # small_world | scale_free
    k: 6                             # Average neighbors
    p: 0.1                           # Rewiring probability (small-world only)
  bounded_confidence:
    epsilon: 0.3                     # Interaction threshold
    mu: 0.1                          # Convergence speed
  voter:
    weight_confidence: true          # Weight adoption by neighbor's confidence

verbalization:
  model: "claude-sonnet-4-0"         # Model for verbalization
  clusters: 4                        # Number of opinion clusters
  samples_per_cluster: 2             # Agents verbalized per cluster
  max_tokens: 300

api:
  generation_model: "claude-haiku-4-5"
  bulk_model: "claude-haiku-4-5"
  max_cost_usd: 5.0                  # Cost ceiling (raises error if exceeded)
  max_retries: 3
  batch_size: 15                     # Concurrent LLM requests per batch
```

## Installation

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
export ANTHROPIC_API_KEY="sk-ant-..."
```

## CLI Usage

```bash
# Generate a population
synthpop generate --config config/default.yaml --output pop.jsonl

# Run a simulation on an existing population
synthpop simulate --population pop.jsonl --topic "remote work mandate" --steps 50

# Ask a question to a population (no simulation, direct LLM poll)
synthpop ask --population pop.jsonl --question "Should companies mandate return to office?" --sample 20

# Quick one-shot poll (generate + ask in one command)
synthpop poll "What do people think about AI in education?" --n 100

# Full pipeline: generate → simulate → verbalize
synthpop run --topic "nuclear energy" --steps 100 --verbalize

# Start the REST API server
synthpop serve --port 8000
```

## REST API

Start with `synthpop serve`. Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Generate a population with optional demographic overrides |
| `POST` | `/poll` | Quick poll (generate + ask) |
| `POST` | `/simulate/start` | Start an async simulation |
| `GET` | `/simulate/{id}/status` | Poll simulation progress and snapshots |
| `GET` | `/simulate/{id}/results` | Get full results (stats, timeseries, opinions) |
| `POST` | `/verbalize` | Verbalize opinions from a completed simulation |
| `GET` | `/populations` | List generated populations |
| `GET` | `/populations/{id}` | Get population details |
| `GET` | `/health` | Health check |

## Frontend

A Next.js web interface is available in `synthpop-ui/`. See its own README for details.

## Project Structure

```
synthpop/
├── config/default.yaml              # Default simulation parameters
├── src/synthpop/
│   ├── cli.py                       # Typer CLI
│   ├── config.py                    # Config loading & validation (Pydantic)
│   ├── personas/
│   │   ├── models.py                # Persona & DemographicSkeleton models
│   │   ├── generator.py             # LLM persona generation pipeline
│   │   └── archetypes.py            # Predefined archetype distributions
│   ├── simulation/
│   │   ├── model.py                 # Mesa Model (PopulationModel)
│   │   ├── agent.py                 # Mesa Agent (PersonAgent)
│   │   ├── network.py               # Social network topology (Watts-Strogatz, Barabasi-Albert)
│   │   └── opinion.py               # Opinion dynamics (bounded confidence, voter model)
│   ├── verbalization/
│   │   └── verbalizer.py            # LLM opinion verbalization & polling
│   ├── analysis/
│   │   ├── aggregator.py            # Stats, polarization index, convergence detection
│   │   └── viz.py                   # Matplotlib plots
│   └── api/
│       ├── client.py                # Anthropic API wrapper (retry, batching, cost tracking)
│       └── server.py                # FastAPI REST API
├── tests/                           # 64 unit tests
├── examples/
│   ├── quick_poll.py                # Simple poll example
│   ├── debate.py                    # Multi-step debate simulation
│   └── market_research.py           # Cross-segment product feedback
└── synthpop-ui/                     # Next.js frontend
```

## Tech Stack

**Backend:** Python 3.11+, Mesa (ABM), NetworkX, Pandas, NumPy, Pydantic v2, FastAPI, Anthropic SDK

**Frontend:** Next.js, Tailwind CSS, shadcn/ui, Recharts, D3.js, Zustand, TanStack Query

## License

MIT
