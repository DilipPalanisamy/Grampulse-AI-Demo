# GramPulse AI — Predictive GPDP & GIS Governance Platform

GramPulse AI is an AI-powered geospatial governance and predictive Gram Panchayat Development Plan (GPDP) platform designed under Ministry of Panchayati Raj (MoPR) guidelines. It enables citizens and administrators to analyze census demographics, predict infrastructure deficits (water, classrooms, roads), explore interactive high-resolution satellite GIS maps, interact with a guided Village AI Assistant, and automatically compile official GPDP PDF plan reports.

---

## 🌟 Key Features

1. **🛰️ Interactive High-Resolution Satellite GIS Map (`MapView.jsx` & `MapPage.jsx`):**
   - Built on Leaflet and ESRI World Imagery satellite tiles with hybrid reference place labels.
   - Interactive style switcher: **Satellite Imagery**, **Streets Grid**, **Dark GIS Mode**, and **Topographical Terrain**.
   - Geotagged citizen grievances mapped with PostGIS coordinates, category badges, and dynamic clustering.
   - Smooth `flyTo` camera transitions across villages in Tamil Nadu and India.

2. **🔍 Central Hero Search Circle & Global Real-Time Search (`HeroSearchCircle.jsx` & `Header.jsx`):**
   - Prominent circular landing hub with animated emerald glow rings and benchmark panchayat pills.
   - Real-time geocoding and search engine powered by OpenStreetMap Nominatim API.
   - Instant demographic scaling, census population, daily water supply (LPD), school classroom counts, and paved road metrics.

3. **🤖 Interactive Village Assessment AI Assistant (`VillageChatbot.jsx`):**
   - Guided 4-step ground survey workflow:
     - 💧 Drinking Water Supply (JJM 55 LPD norm)
     - 🏫 Education & Classroom Infrastructure (RTE 30:1 pupil-classroom ratio)
     - 🛣️ All-Weather Paved Connectivity (PMGSY norms)
     - ♻️ Sanitation & Solid Waste Management (SBM-G Phase II)
   - Formatted **Village Need Assessment Summary** with critical deficit identification and Centrally Sponsored Scheme (CSS) budget estimations.
   - **"Apply Findings to GPDP Report"** one-click synchronization.

4. **📊 Predictive ML Infrastructure Deficits & AI Scheme Matching (`AnalyticsPanel.jsx` & `SchemeRecommendations.jsx`):**
   - Multi-year planning horizon forecasting (3, 5, 7 Years).
   - RAG-based welfare scheme recommendation engine linking infrastructure gaps to Centrally Sponsored Schemes (Jal Jeevan Mission, Samagra Shiksha, PMGSY, SBM-G, etc.).

5. **📄 Official GPDP PDF Plan Report Generator (`ReportDownloadButton.jsx`):**
   - Generates comprehensive PDF reports with census indicators, projected deficits, recommended welfare allocations, and geotagged grievance summaries.

6. **🔐 Citizen Authentication & Session Persistence:**
   - Google OAuth 2.0 integration (`@react-oauth/google`).
   - Permanent session persistence across refreshes via `localStorage`.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Leaflet, React-Leaflet, Leaflet Cluster.
- **Backend:** FastAPI (Python 3.10+), Uvicorn, Pydantic, ReportLab (PDF Generator), Scikit-Learn (ML Regressors), PostGIS / Shapely.
- **Geospatial & Mapping:** ESRI World Imagery, OpenStreetMap Nominatim Geocoding API, CartoDB Dark Matter, OpenTopoMap.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) & pip

### 2. Backend Setup
```bash
# Navigate to project root
pip install fastapi uvicorn pydantic reportlab scikit-learn numpy shapely

# Start FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend application will be accessible at: `http://127.0.0.1:5173`

---

## 🏛️ License
Developed for Ministry of Panchayati Raj (MoPR) Smart Governance & AI GPDP Planning.
