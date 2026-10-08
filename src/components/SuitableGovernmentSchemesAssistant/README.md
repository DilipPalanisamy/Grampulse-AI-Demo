# 🏛️ Suitable Government Schemes AI Assistant

The **Suitable Government Schemes AI Assistant** is a specialized, RAG-grounded conversational agent for the **GramPulse AI** platform. It empowers citizens, village Sarpanches, and Gram Panchayat administrative secretaries (VDOs) to discover, evaluate, and navigate official Indian Central and State Government welfare schemes tailored to their specific village needs.

---

## 🎯 Purpose & Scope

Unlike general-purpose chatbots or village infrastructure diagnostic tools, this assistant focuses **strictly on government welfare schemes**:
- Direct matching of rural requirements (water shortages, housing, roads, agriculture, solar pumps, health clinics, schools) to official Centrally Sponsored Schemes (CSS).
- Explaining official **eligibility criteria**, **key benefits**, **required documents**, and **application procedures**.
- Providing verified, clickable **official government portal URLs** (`.gov.in` / `.nic.in`).
- Grounding all recommendations in national benchmarks (JJM 55 LPD, PMGSY 1.25 km/1,000 pop, RTE Act 1:30 ratio, PMAY-G, SBM-G Phase II).

---

## ⚖️ Key Differences from Village AI Assistant

| Feature | 🤖 Village AI Assistant | 🏛️ Suitable Government Schemes Assistant |
| :--- | :--- | :--- |
| **Primary Goal** | 4-step village infrastructure & GPDP assessment | Comprehensive Government Scheme discovery & navigation |
| **Interactive Flow** | Guided questionnaire with scoring | Conversational Q&A + Quick Category Chips + Scheme Result Cards |
| **Backend Endpoint** | `POST /api/v1/chat` | `POST /api/v1/scheme-assistant/chat` |
| **Output Format** | Deficit severity report & GPDP budget synthesis | Structured Markdown advisory + Interactive Official Scheme Cards |
| **Knowledge Focus** | Demographic models, Scikit-learn forecast | ChromaDB / Vector RAG, Central Ministries, and verified portals |

---

## 🏗️ Architecture & RAG Retrieval Flow

```
React UI (Dashboard / Map)
  │
  ├── 🏛️ Suitable Government Schemes Assistant
  │     ├── Quick Question Chips (Water, Housing, Agriculture, etc.)
  │     ├── Location Context (Gram Panchayat, District, State, Population)
  │     └── schemeAssistantService.js
  │
  ▼ (HTTP POST /api/v1/scheme-assistant/chat)
FastAPI Backend (backend/main.py)
  │
  ▼
Scheme Assistant Engine (backend/services/scheme_assistant_engine.py)
  │
  ├── 1. Intent Classification & Semantic Vector Similarity (ChromaDB / Dense Embeddings)
  ├── 2. Retrieval from Verified Scheme Knowledge Base (JJM, PMAY-G, PMGSY, PM-KUSUM, etc.)
  ├── 3. Strict Anti-Hallucination Grounding
  ├── 4. LLM / Deterministic Synthesizer
  │
  ▼
Structured Response Payload
  ├── Formatted Markdown Advisory Text
  └── Array of Rich Scheme Cards (Eligibility, Benefits, Documents, Portal Links)
```

---

## 📡 API Endpoint Specification

### `POST /api/v1/scheme-assistant/chat`

#### Request Payload:
```json
{
  "message": "Which scheme can help with drinking water?",
  "location": {
    "gp_id": 101,
    "gp_name": "Koduvai",
    "district": "Tiruppur",
    "state": "Tamil Nadu",
    "population": 5800
  },
  "chat_history": []
}
```

#### Response Payload:
```json
{
  "reply": "Based on your query regarding water supply for Koduvai (Tiruppur, Tamil Nadu)...",
  "schemes": [
    {
      "scheme_id": "CSS-JJM-001",
      "scheme_name": "Jal Jeevan Mission (JJM) - Har Ghar Jal",
      "ministry": "Ministry of Jal Shakti",
      "category": "Water Supply",
      "official_portal_url": "https://ejalshakti.gov.in/",
      "purpose": "Provides universal rural drinking-water supply...",
      "why_relevant": "Provides piped drinking water infrastructure...",
      "eligibility_criteria": "All rural habitations lacking 100% tap connections.",
      "key_benefits": ["55 LPD potable water supply", "Overhead storage tanks"],
      "required_documents": ["Village Action Plan", "Household enumeration list"],
      "application_process": "1. VWSC prepares VAP. 2. Gram Sabha approves..."
    }
  ],
  "provider": "grampulse-scheme-rag-synthesizer",
  "model": "scheme-rag-v2",
  "timestamp": "2026-09-25T21:45:00.000000"
}
```

---

## 🗂️ Component Directory Structure

```
src/components/SuitableGovernmentSchemesAssistant/
 ├── SuitableGovernmentSchemesAssistant.jsx   # Primary React chatbot component & UI modal
 ├── schemeAssistantService.js                # API service calling /scheme-assistant/chat + fallback
 ├── schemeAssistantData.js                   # Quick prompt chips and verified scheme presets
 └── README.md                                # Component documentation
```

---

## 🔍 Supported Scheme Inquiries

1. **💧 Water Supply:** Jal Jeevan Mission (JJM) & Mission Amrit Sarovar
2. **🏠 Rural Housing:** Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)
3. **🌾 Agriculture & Farmers:** PM-KISAN, PM-KUSUM Solar Pumps, Kisan Credit Card
4. **🛣️ Road Connectivity:** Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)
5. **🏥 Healthcare & Wellness:** Ayushman Bharat / National Health Mission (NHM) & PM-JAY
6. **🎓 School Education:** PM SHRI & Samagra Shiksha Abhiyan
7. **♻️ Sanitation & Waste:** Swachh Bharat Mission - Gramin (SBM-G Phase II)
8. **☀️ Solar & Renewable Energy:** PM-KUSUM Component B & C
9. **💼 Wage Employment & Livelihoods:** MGNREGS & DAY-NRLM (Women Self-Help Groups)

---

## 🚀 Running & Testing

### 1. Start Backend:
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start Frontend:
```bash
npm run dev
```

### 3. Verify in Browser:
- Click **"🏛️ Suitable Government Schemes"** floating button at the bottom-right of the dashboard.
- Select any quick inquiry (e.g. `💧 Water Supply` or `🏠 Housing`).
- Verify that structured responses are returned with interactive Scheme Result Cards and official `.gov.in` hyperlinks.
