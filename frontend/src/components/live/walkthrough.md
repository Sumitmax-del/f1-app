# Live Race Feed — Implementation Walkthrough

The **Live Race Feed** feature for the Formula 1 website has been fully implemented, providing a unified, context-aware race weekend hub that transitions seamlessly through three states (**Pre-Race → Live Race → Post-Race**). It integrates with the server-side Socket.io simulator for real-time race events, and has a dedicated "Mock Data" preview mode, alongside a **fully authentic F1 Telemetry Reconstruction Engine** that fetches and streams real-world F1 data from OpenF1 API feeds, synchronized with the active 2026 season.

---

## 🛠️ Summary of Changes

### 1. 2026 Season Synchronization & Dynamic Telemetry Engine
- **Active 2026 Season Integration**: Configured the client-side telemetry hook and selector dropdown to dynamically fetch sessions from the **2026 F1 season** using OpenF1's `/sessions?year=2026&session_name=Race` endpoint. 
- **Dynamic Year Resolution**: The telemetry hook [useF1LiveData.ts](file:///c:/Users/SUMIT/Desktop/f1-app/frontend/src/hooks/useF1LiveData.ts) dynamically resolves the session year (e.g. 2024 vs 2026) based on the selected `sessionKey` range.
- **Historical Session Replay selector**: Pre-populates the select dropdown with actual concluded 2026 Grand Prix sessions alongside historic 2024 sessions, automatically highlighting the latest session on load.
- **Dynamic GPS coordinates scaling**: Plots driver coordinates (`x` and `y` from `/v1/location`) normalized to fit coordinates dynamically in the `TrackRenderer` SVG canvas.

### 2. Timezone-Aware calculations
- Standardized all calendar schedules and session timers to use ISO-8601 UTC strings.
- Displays Track local times and browser-native User local times side-by-side: `FP1: Fri 17:00 | (13:30 Track CEST)`.

### 3. Server-Side Simulation Enhancements
- Emits `driverCode` and advanced flag events (`safety_car`, `yellow_flag`, etc.) in the WebSocket router, synchronized to the client state overrides.

---

## 🧪 Verification & Testing Instructions

### A. Testing the Historical 2026 Session Replay (Authentic Data)
1. Launch the local environment (`npm run dev`).
2. Navigate to `http://localhost:3000/race-feed` (or click **Live Feed** in the navbar).
3. Under the header, select **Historical Replay** mode (the new default).
4. TheGP dropdown will dynamically load the **concluded 2026 Grand Prix sessions** directly from the live OpenF1 session database.
5. Select a 2026 GP, and click **Play Replay** to watch authentic race coordinates trace the track layout and leaderboard timing updates in real-time.

### B. Testing the Mock Data States (Manual Preview)
1. Click **Mock Preview** in the top modes tab.
2. Toggle between `Pre-Race`, `Live`, or `Post-Race` to check local styling assets.
