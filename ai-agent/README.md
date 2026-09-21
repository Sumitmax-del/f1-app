# 🏎️ Formula 1 Live Dashboard & AI Agent Copilot

A comprehensive, production-grade Formula 1 platform featuring real-time race simulations, interactive telemetry dashboards, and an intelligent multi-tool AI Agent Copilot built with Python, Java, and TypeScript/Next.js.

---

## 🏛️ Architecture Overview

```
                                USER / UI
                   (Java Dashboard / Next.js Frontend)
                                   ↓
                           [POST /ask Endpoint]
                                   ↓
                         PYTHON F1 AI AGENT
                     (app/agent.py Orchestrator)
                                   ↓
      ┌─────────────┬──────────────┬──────────────┬─────────────┐
      ↓             ↓              ↓              ↓             ↓
   F1 DATA     WEB SEARCH      LOCAL RAG      TELEMETRY       DIRECT
  (Jolpica)   (DuckDuckGo)    (Knowledge)    (Sectors 1-3)     LLM
      │             │              │              │             │
      └─────────────┴──────────────┼──────────────┴─────────────┘
                                   ↓
                      HUGGING FACE INFERENCE LAYER
                    (Open-Source Serverless Models)
                                   ↓
                         STRUCTURED JSON RESPONSE
                      { answer, tool_used, sources }
```

---

## 🛠️ Available AI Tools & Intent Routing

| Tool Identifier | Implementation File | Capabilities & Triggers | Example Queries |
| :--- | :--- | :--- | :--- |
| **`f1_data`** | [`app/tools/f1_data_tool.py`](file:///c:/Users/SUMIT/Desktop/f1-app/app/tools/f1_data_tool.py) | Queries official Jolpica / Ergast F1 API for race results, winners, fastest laps, qualifying/poles, driver/constructor standings, calendars, and driver stats. | *"Who had the fastest lap at the 2021 Mexican GP?"*<br>*"Who won the 2021 constructors championship?"*<br>*"Compare Hamilton and Verstappen in 2021"* |
| **`web_search`** | [`app/tools/search_tool.py`](file:///c:/Users/SUMIT/Desktop/f1-app/app/tools/search_tool.py) | Real-time DuckDuckGo news and Wikipedia search for breaking stories, rumors, and regulations without scraping HTML. | *"What are the latest F1 news?"*<br>*"Tell me the recent news about Adrian Newey"* |
| **`rag`** | [`app/rag/`](file:///c:/Users/SUMIT/Desktop/f1-app/app/rag/) | Local vector retriever over `knowledge/*.txt` docs for technical rules, DRS, ERS, tyre compounds, points systems, and racing terminology. | *"What is DRS?"*<br>*"What is ERS?"*<br>*"What are the different tyre compounds?"*<br>*"Explain the F1 points system"* |
| **`telemetry`** | [`app/tools/telemetry_tool.py`](file:///c:/Users/SUMIT/Desktop/f1-app/app/tools/telemetry_tool.py) | Analyzes delta lap times, braking points, corner apex speeds, and throttle traces across Sectors 1, 2, and 3. | *"Why did I lose time in Sector 2?"*<br>*"Analyze my throttle and braking in Sector 1"* |
| **`f1_data` + `web_search`** | Hybrid Orchestration | Combines structured official race classification with real-time web narrative context for complex events. | *"What happened at the 2021 Abu Dhabi GP?"*<br>*"What happened at the 2021 British GP?"* |

---

## 🔌 API Endpoints (Python FastAPI Server on Port 8000)

### 1. `POST /ask`
Standard question-answering endpoint used by the Java HTTP client and external integrations.

**Request Payload:**
```json
{
  "question": "Who had the fastest lap at the 2021 Mexican GP?"
}
```

**Response Payload:**
```json
{
  "question": "Who had the fastest lap at the 2021 Mexican GP?",
  "answer": "Valtteri Bottas set the fastest lap at the 2021 Mexican Grand Prix with a time of 1:17.774 on Lap 69.",
  "tool_used": ["f1_data"],
  "sources": [
    "Jolpica F1 API — 2021 Mexican Grand Prix Fastest Lap"
  ],
  "confidence": "high",
  "model": "HuggingFaceH4/zephyr-7b-beta"
}
```

### 2. `POST /api/chat`
Chat interface endpoint designed for dashboard widgets with dual `question`/`message` payload support.

### 3. `GET /health`
Health check endpoint returning service status and readiness.

### 4. `GET /`
Service metadata, version, active model name, and supported feature list.

---

## 🔧 Environment Variables

### Root / Python AI Agent (`.env` or `.env.example`)
```env
# Hugging Face User Access Token (Free tier from https://huggingface.co/settings/tokens)
HF_API_KEY=your_huggingface_api_key_here

# Configurable open-source model name
MODEL_NAME=HuggingFaceH4/zephyr-7b-beta

# Microservice port
AGENT_PORT=8000
```

### Next.js Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Express Backend (`backend/.env`)
```env
PORT=4000
JWT_SECRET=your-secret-key
```

---

## 🚀 Installation & Quick Start

### Prerequisites
- Python 3.10+ (with virtual environment in `f1env/`)
- Java JDK 8, 11, 17, or 21+
- Node.js 18+ and npm

---

### 1. Start the Python AI Agent Server
```powershell
# From the project root:
f1env\Scripts\python.exe main.py
```
- Server URL: `http://localhost:8000`
- Interactive OpenAPI / Swagger Documentation: `http://localhost:8000/docs`

---

### 2. Start / Integrate the Java Application

#### A. Running the Standalone Java Dashboard Demo:
```powershell
# Compile and run the Java dashboard demo:
javac -d java/bin -sourcepath java/src/main/java java/src/main/java/com/f1app/dashboard/F1DashboardApp.java
java -cp java/bin com.f1app.dashboard.F1DashboardApp
```

#### B. Embedding in Your Existing Java Dashboard:
```java
import com.f1app.client.F1AgentClient;
import com.f1app.dashboard.F1AiChatPanel;

// 1. Initialize non-blocking HTTP client
F1AgentClient client = new F1AgentClient("http://localhost:8000/ask");

// 2. Create the AI Chat Panel component
F1AiChatPanel aiChatPanel = new F1AiChatPanel(client);

// 3. Add to your existing Java Swing container
myDashboardFrame.add(aiChatPanel, BorderLayout.EAST);
```

---

### 3. Start the Node.js Backend & Next.js Frontend (Optional Full-Stack UI)

```powershell
# Terminal 1 - Backend:
cd backend
npm install
npm run dev

# Terminal 2 - Frontend:
cd frontend
npm install
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`

---

## 🧪 Comprehensive Automated Test Suites

Run any of the included validation suites:

```powershell
# 1. Full 21-Question Multi-Tool Integration Suite:
f1env\Scripts\python.exe test_all_20_questions.py

# 2. 13 User Review Questions (All scenarios & criteria):
f1env\Scripts\python.exe test_review_all_questions.py

# 3. Local RAG Knowledge Base Suite:
f1env\Scripts\python.exe test_rag.py

# 4. Java HTTP Client & Flow Verification:
f1env\Scripts\python.exe test_java_python_flow.py
```

---

## ❓ Example Queries & Expected Behaviors

1. **"Who had the fastest lap at the 2021 Mexican GP?"**  
   → `tool_used: ["f1_data"]` | Returns Valtteri Bottas with lap 69 time.
2. **"Who won the 2021 Mexican GP?"**  
   → `tool_used: ["f1_data"]` | Returns Max Verstappen (Red Bull Racing).
3. **"Who was on pole at the 2021 Mexican GP?"**  
   → `tool_used: ["f1_data"]` | Returns Valtteri Bottas (Mercedes).
4. **"Who led the 2021 Drivers' Championship?"**  
   → `tool_used: ["f1_data"]` | Returns 2021 WDC standings (Max Verstappen / Lewis Hamilton).
5. **"Who led the 2021 Constructors' Championship?"**  
   → `tool_used: ["f1_data"]` | Returns 2021 WCC standings (Mercedes-AMG Petronas).
6. **"Who is currently leading the championship?"**  
   → `tool_used: ["f1_data"]` | Fetches current season championship leader.
7. **"What happened at the 2021 Abu Dhabi GP?"**  
   → `tool_used: ["f1_data", "web_search"]` | Returns race results combined with safety car restart context.
8. **"What is DRS?"**  
   → `tool_used: ["rag"]` | Explains Drag Reduction System, 85mm wing flap opening, and 1.0s gap activation rules from `knowledge/drs.txt`.
9. **"What is ERS?"**  
   → `tool_used: ["rag"]` | Explains MGU-K (120 kW), MGU-H, battery energy store, and hybrid boost modes from `knowledge/ers.txt`.
10. **"Explain the F1 points system."**  
    → `tool_used: ["rag"]` | Explains 25-18-15-12-10-8-6-4-2-1 Grand Prix scale, Fastest Lap top-10 bonus point, and Sprint points from `knowledge/points_system.txt`.
11. **"Compare Hamilton and Verstappen in 2021."**  
    → `tool_used: ["f1_data"]` | Queries official statistics for both drivers (wins, podiums, points) and synthesizes a head-to-head breakdown.
12. **"What are the latest F1 news?"**  
    → `tool_used: ["web_search"]` | Searches real-time news headlines.
13. **"Why did I lose time in Sector 2?"**  
    → `tool_used: ["telemetry"]` | Returns sector delta time (+0.412s), mid-corner understeer telemetry, apex speeds, and exit acceleration recommendations.
14. **"Who is the best F1 driver?"**  
    → `tool_used: ["f1_data"]` | **Balanced Objective Criteria:** Explains that declaring a single definitive "best" is subjective across eras, comparing records across titles (Hamilton/Schumacher: 7), win percentage (Fangio: 46.15%), single-season dominance (Verstappen: 19 wins in 2023), and qualifying pace (Senna: 65 poles).

---

## ⚠️ Known Limitations & Free-Tier Constraints

1. **Hugging Face Free Serverless Inference:**
   - **Cold Starts (HTTP 503):** If a model has not been recently queried, container spin-up may take 15–25 seconds on the first call.
   - **Rate Limits (HTTP 429):** Free-tier tokens have shared burst rate limits. The agent falls back automatically to local knowledge extraction when rate-limited.
   - **Context Limits:** Open-source models typically support ~2048 to 4096 tokens per prompt.
2. **Jolpica / Ergast F1 API:**
   - Rate limits are capped at ~4 requests/second. The agent uses in-memory TTL caching (300s) to minimize duplicate requests.
3. **DuckDuckGo Web Search:**
   - Subject to IP-based rate throttling if queried in tight loops. The tool uses fallback query normalization and authentic Wikipedia REST search.
4. **Offline Resilience:**
   - If internet access is unavailable or API tokens are unconfigured, local RAG (`app/rag/`) and local telemetry analysis continue to operate 100% offline with zero external dependencies.
