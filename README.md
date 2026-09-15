# 🌫️ Air Quality Analyzer

> Real-time global air quality monitoring dashboard — tracking AQI, PM2.5, PM10, NO₂, and CO across 20 major cities worldwide.

![Status](https://img.shields.io/badge/status-active%20development-violet?style=flat-square)
![Stack](https://img.shields.io/badge/stack-MERN-blue?style=flat-square)
![Python](https://img.shields.io/badge/pipeline-Python-yellow?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 📸 Overview

Air Quality Analyzer is a full-stack MERN project with a Python data pipeline. It fetches live air quality data from the OpenAQ API, cleans and stores it in MongoDB, exposes it via a Node.js REST API, and visualizes it on an interactive React dashboard with a world map.

---

## 🏗️ Architecture

```
Air Quality Analyzer/
├── backend/               # Python data pipeline
│   ├── src/
│   │   ├── data_fetch.py  # OpenAQ API fetcher
│   │   ├── cleaning.py    # Data cleaning & normalization
│   │   ├── analysis.py    # AQI calculations & freshness
│   │   └── db_writer.py   # MongoDB writer
│   ├── notebooks/         # Jupyter exploration notebooks
│   ├── tests/             # Pipeline test suite
│   └── requirements.txt
│
├── api/                   # Node.js / Express REST API
│   ├── src/               # Route logic & DB models
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API route handlers
│   └── server.js          # Entry point (port 5000)
│
├── frontend/              # React 18 + Vite dashboard
│   ├── src/
│   │   ├── components/    # AQIRing, Navbar, StatCard, etc.
│   │   ├── context/       # ThemeContext (dark/light mode)
│   │   ├── hooks/         # useAQIData, useCityData
│   │   ├── pages/         # Dashboard, Rankings, CityDetail
│   │   └── utils/         # aqiHelpers (color, label, format)
│   └── index.html
│
└── data/
    ├── raw/               # Raw API responses (CSV)
    └── processed/         # Cleaned AQI data (CSV)
```

---

## ✨ Features

### 🗺️ Interactive World Map
- 20 city dots color-coded by AQI severity
- Hover tooltips showing city name, AQI, and freshness
- Click any dot to navigate to the city detail page
- Zoomable & pannable via react-simple-maps

### 🏆 Rankings Table
- All 20 cities ranked by AQI (worst to best)
- PM2.5, status label, and freshness badge per row
- Staggered entrance animations via Framer Motion

### 🏙️ City Detail Page
- AQI ring indicator with live color coding
- Health advisory message based on AQI category
- Animated pollutant bars (PM2.5, PM10, NO₂, CO) vs WHO limits
- Data quality and freshness indicators

### 🌓 Dark / Light Mode
- Defaults to Deep Violet dark theme
- Toggle persisted in `localStorage`

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Data Pipeline** | Python 3, OpenAQ API, Pandas |
| **Database** | MongoDB (via Mongoose) |
| **API Server** | Node.js, Express.js |
| **Frontend** | React 18, Vite |
| **Styling** | Tailwind CSS v3 |
| **Maps** | react-simple-maps + world-atlas |
| **Animations** | Framer Motion |
| **HTTP Client** | Axios |
| **Routing** | React Router v6 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone the repo
```bash
git clone https://github.com/kxshlabs/Air-Quality-Analyzer.git
cd Air-Quality-Analyzer
```

### 2. Environment variables
Create a `.env` file in the project root:
```env
MONGO_URI=mongodb://localhost:27017/airquality
OPENAQ_API_KEY=your_openaq_key_here
PORT=5000
```

### 3. Run the Python data pipeline
```bash
cd backend
pip install -r requirements.txt
python src/data_fetch.py
python src/cleaning.py
python src/db_writer.py
```

### 4. Start the API server
```bash
cd api
npm install
npm run dev
# Runs at http://localhost:5000
```

### 5. Start the frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 📡 API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server + DB status check |
| `GET` | `/api/aqi` | All 20 cities sorted by AQI desc |
| `GET` | `/api/aqi/fresh` | Live/Recent cities only |
| `GET` | `/api/aqi/rankings` | Ranked list + global stats |
| `GET` | `/api/aqi/:city` | Single city data |

### Example response — `/api/aqi/rankings`
```json
{
  "total": 20,
  "average_aqi": 87.4,
  "most_polluted": "Delhi",
  "cleanest": "Ottawa",
  "rankings": [
    { "rank": 1, "city": "Delhi", "aqi": 210, "pm25": 88.3, "freshness": "Live" }
  ]
}
```

---

## 🎨 AQI Color Scale

| AQI Range | Category | Color |
|---|---|---|
| 0 – 50 | Good | 🟢 #22c55e |
| 51 – 100 | Moderate | 🟡 #eab308 |
| 101 – 150 | Unhealthy (Sensitive) | 🟠 #f97316 |
| 151 – 200 | Unhealthy | 🔴 #ef4444 |
| 200+ | Very Unhealthy | 🟣 #9333ea |

---

## 🗂️ Data Freshness Labels

| Label | Meaning |
|---|---|
| **Live** | Data less than 1 hour old |
| **Recent** | Data 1–6 hours old |
| **Aging** | Data 6–24 hours old |
| **Stale** | Data more than 24 hours old |

---

## 🧪 Running Tests

```bash
# Python pipeline tests
cd backend
python -m pytest tests/

# API health check
cd backend/tests
python health_check.py
```

---

## 📁 Key Source Files

| File | Purpose |
|---|---|
| `backend/src/data_fetch.py` | OpenAQ API fetcher |
| `backend/src/cleaning.py` | Data cleaning & AQI normalization |
| `backend/src/db_writer.py` | MongoDB upsert writer |
| `api/server.js` | Express server entry point |
| `frontend/src/hooks/useAQIData.js` | Main data fetching hook |
| `frontend/src/pages/Dashboard.jsx` | World map dashboard page |
| `frontend/src/utils/aqiHelpers.js` | AQI color/label utilities |

---

## 🛣️ Roadmap

- [x] Python data pipeline (fetch → clean → store)
- [x] MongoDB integration
- [x] Node.js REST API with 5 endpoints
- [x] React frontend with world map
- [x] City rankings table
- [x] City detail page with pollutant breakdown
- [x] Dark/light theme toggle
- [ ] Auto-refresh every N minutes
- [ ] Historical trend charts
- [ ] City search and filter
- [ ] Docker Compose setup
- [ ] Scheduled cron pipeline

---

## 🤝 Contributing

This is a personal learning project. Feel free to fork and experiment.

---

## 📄 License

MIT © [kxshlabs](https://github.com/kxshlabs)