# catincloud.io - Market Physics Terminal

**catincloud.io** is a Single Page Application (SPA) that reimagines stock market data as a particle physics simulation. Built with React, Vite, and Deck.gl, it visualizes financial assets as physical bodies where a combination of trade volume and news sentiment becomes "Energy" and price momentum becomes "Velocity."

The application features a semantic Knowledge Graph, a timeline playback engine, and an AI "Oracle" that interprets market movements using natural language.

## 🐯 Live Demo

Visit [catincloud.io](https://catincloud.io)

## ⚛️ The Physics Metaphor

The core logic translates standard OHLCV (Open, High, Low, Close, Volume) data into Newtonian physics concepts:

* **Energy (Glow):** Represents **Trade Volume**. High activity creates a brighter glow.
* **Velocity (Motion):** Represents **Price Momentum**. Fast price changes result in higher velocity vectors.
* **Mass (Size):** Represents **Market Cap**. Larger companies appear as larger, heavier particles that are harder to displace.
* **Gravity/Attraction:** Represents **Semantic Relationships**. Stocks mentioned together in news cycles (via vector embeddings) form visible elastic connections (Synapses).

## 🛠 Tech Stack

### Frontend
* **Framework:** React 18 + Vite + TypeScript
* **Visualization:** Deck.gl (Scatterplot, Path, & Polygon layers)
* **Math/Physics:** D3.js (Delaunay, Scales) & Catmull-Rom Spline Interpolation
* **State Management:** Zustand
* **Styling:** Tailwind CSS

### Backend & Data
* **Database:** Supabase (PostgreSQL + Vector)
* **Edge Functions:** Deno (for the AI Oracle)
* **Data Source:** Polygon.io
* **AI/ML:** OpenAI (GPT-4o-mini for analysis, text-embedding-3-small for semantic search)
* **Ingestion:** Python (ETL pipeline)

## ✨ Key Features

* **Interactive Market Map:** A zoomable, pan-able infinite canvas rendering hundreds of tickers as dynamic particles.
* **Timeline Simulation:** Playback control to watch market physics evolve over time (historical playback).
* **The Oracle (AI Agent):** A context-aware AI chatbot that acts as a "Human Analyst" or "Physics Teacher" to explain the current visual state of the market.
* **Knowledge Graph:** Visual "synapses" draw lines between companies that share semantic context in recent news cycles.
* **Voronoi Sentiment Cells:** Background tessellation acting as a heat map for market sentiment (Red/Green).

## 📦 Installation & Setup

### Prerequisites
* Node.js (v18+)
* Python 3.9+ (for data ingestion)
* Supabase Account

### 1. Clone the Repository
```bash
git clone [https://github.com/catincloudlabs/catincloud-io-vite.git](https://github.com/catincloudlabs/catincloud-io-vite.git)
cd catincloud-io-vite
```
### 2. Frontend Setup
```bash
npm install
npm run dev
```
The app will run at `http://localhost:5173`.

### 3. Environment Variables
Create a `.env` file in the root directory:
```plaintext
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Backend (Data Ingestion)
The data pipeline runs via Python. It fetches OHLC data and News, generates embeddings, and pushes to Supabase.

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
```plaintext
MASSIVE_API_KEY=your_polygon_io_key
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

Run the ingestion engine:
```bash
python ingest.py
```

## 🧠 Architecture Overview

### Data Flow
* **Ingest (`backend/ingest.py`):** Fetches daily data -> Vectorizes News -> Updates Supabase.
* **Hydration (`src/utils/processData.ts`):** Frontend fetches JSON history -> Calculates spline trajectories -> Feeds React State.
* **Rendering (`src/components/MarketMap.tsx`):** Deck.gl renders the frame.
* **Analysis (`supabase/functions/oracle`):** User asks question -> Edge Function grabs context -> OpenAI generates explanation.

### Directory Structure
```text
├── backend/            # Python ETL scripts (Polygon -> Supabase)
├── public/             # Static assets (datasets, logos)
├── src/
│   ├── components/     # React UI (MarketMap, AgentPanel, etc.)
│   ├── hooks/          # Custom hooks (useKnowledgeGraph, useTimeline)
│   ├── utils/          # Math helpers (splineInterpolation, physics)
│   └── App.tsx         # Main entry point
├── supabase/           # Edge functions and DB config
└── package.json
```

## 🛡️ License

This project is private property of **Catincloud Labs**.

* **Creator:** Dave Anaya
* **Copyright:** © 2024 Catincloud Labs. All Rights Reserved.

---
*Disclaimer: This application is a simulation for educational and visualization purposes only. It does not constitute financial advice.*
