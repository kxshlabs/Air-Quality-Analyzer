# 🌍 Air Quality Analyzer

> Real-time global air quality monitoring across 100 cities worldwide.  
> Automated data pipeline refreshing every 6 hours via GitHub Actions.

![CI](https://github.com/kxshlabs/Air-Quality-Analyzer/actions/workflows/refresh.yml/badge.svg)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)
![Render](https://img.shields.io/badge/API-Render-46E3B7?logo=render)
![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb)
![Python](https://img.shields.io/badge/Pipeline-Python-3776AB?logo=python)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Node](https://img.shields.io/badge/API-Node.js-339933?logo=node.js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Live Demo

| Surface | URL |
|---------|-----|
| 🌐 Frontend | https://air-quality-analyzer.vercel.app |

---

## 🏗️ Architecture

```
Frontend (React/Vercel) → API (Node/Render) → MongoDB Atlas
                                    ↑
                          GitHub Actions (every 6h)
                                    ↑
                          Python Pipeline (WAQI API)
```

---

## 🚀 Features

- Real-time AQI data for 100 cities across 6 continents
- Interactive world map with color-coded AQI markers
- City rankings by pollution level
- Detailed city pages with pollutant breakdown (PM2.5, PM10, NO2, CO, SO2, O3)
- Weather data: temperature, humidity, wind speed, pressure
- Dark/light mode toggle
- Data freshness indicators
- Automated refresh every 6 hours

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React, Tailwind CSS, Vite, Leaflet | Single-page interactive web interface, maps, and UI components |
| **API** | Node.js, Express, Mongoose | RESTful API server serving air quality snapshots and analytics |
| **Database** | MongoDB Atlas | Cloud document store for real-time AQI measurements |
| **Data Pipeline** | Python (Pandas, Requests) | Fetching, cleaning, transforming, and persisting WAQI data |
| **Data Source** | WAQI API | Real-time global air quality observation network |
| **Automation** | GitHub Actions | Scheduled workflow running the data pipeline every 6 hours |
| **Deployment** | Vercel & Render | Static web application hosting (Vercel) and API server hosting (Render) |

---

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/aqi` | Returns all city AQI snapshots sorted by AQI level descending |
| `GET` | `/api/aqi/fresh` | Returns only cities with active/recent data freshness status |
| `GET` | `/api/aqi/rankings` | Returns ranked list of all cities alongside summary statistics |
| `GET` | `/api/aqi/:city` | Returns detailed AQI and weather snapshot for a specific city |

---

## ⚙️ Environment Variables

### Backend Configuration (`api/.env` & Render)
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/airquality
WAQI_TOKEN=your_waqi_api_token
PORT=10000
NODE_ENV=production
```

### Frontend Configuration (`frontend/.env`)
```env
VITE_API_URL=https://air-quality-analyzer-mezg.onrender.com
```

### GitHub Actions Secrets
```env
WAQI_TOKEN=your_waqi_api_token
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/airquality
RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxxxx
```

---

## 🧪 Testing

Run test scripts from the repository root:

```bash
# Verify API health and endpoint responses
python backend/tests/health_check.py

# Run comprehensive feature and data validation tests
python backend/tests/test_features.py
```

---

## 📦 Local Development

### 1. Repository Setup
```bash
git clone https://github.com/kxshlabs/Air-Quality-Analyzer.git
cd "Air Quality Analyzer"
```

### 2. Backend & Data Pipeline
```bash
# Install Python dependencies and run pipeline
pip install -r backend/requirements.txt
python backend/src/data_fetch.py
python backend/src/cleaning.py
python backend/src/db_writer.py

# Start API server
cd api
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 CI/CD Pipeline

1. **GitHub Actions Trigger:** Scheduled workflow ([`.github/workflows/refresh.yml`](file:///.github/workflows/refresh.yml)) runs every 6 hours or on manual trigger (`workflow_dispatch`).
2. **Data Pipeline Execution:** Python environment setups, installs dependencies, and runs `data_fetch.py`, `cleaning.py`, and `db_writer.py` using stored repository secrets (`WAQI_TOKEN`, `MONGODB_URI`).
3. **Automatic Deployment Hook:** Upon successful database refresh, GitHub Actions calls the Render Deploy Hook via POST request, signaling Render to refresh/restart services if needed.

---

## 📊 Data Pipeline

```
[WAQI API] ──> data_fetch.py ──> cleaning.py ──> db_writer.py ──> [MongoDB Atlas]
```

- **`data_fetch.py`**: Queries real-time air quality metrics for 100 global cities from the WAQI API.
- **`cleaning.py`**: Normalizes pollutant concentrations, validates data bounds, and tags data freshness.
- **`db_writer.py`**: Upserts processed AQI snapshots directly into MongoDB Atlas.

---

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── refresh.yml
├── api/
│   ├── models/
│   │   └── AqiSnapshot.js
│   ├── routes/
│   │   └── aqi.js
│   ├── src/
│   │   ├── app.js
│   │   ├── db.js
│   │   └── middleware/
│   └── server.js
├── backend/
│   ├── requirements.txt
│   ├── src/
│   │   ├── analysis.py
│   │   ├── cleaning.py
│   │   ├── data_fetch.py
│   │   └── db_writer.py
│   └── tests/
│       ├── health_check.py
│       └── test_features.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 📈 Project Progress

![Progress](https://img.shields.io/badge/Progress-65%25-blue?style=flat-square)

| Milestone | Status |
|-----------|--------|
| Data pipeline (fetch → clean → store) | ✅ Complete |
| REST API with 5 endpoints | ✅ Complete |
| Frontend with map + city cards | ✅ Complete |
| Dark/light mode | ✅ Complete |
| CI/CD automated every 6 hours | ✅ Complete |
| Vercel + Render deployment | ✅ Complete |
| 100 cities across 6 continents | ✅ Complete |
| Professional README + MIT license | ✅ Complete |
| Data quality indicators on frontend | 🔲 Planned |
| Historical AQI trend charts | 🔲 Planned |
| AQI forecast using trend analysis | 🔲 Planned |
| Email/push alerts for high AQI | 🔲 Planned |
| PWA mobile support | 🔲 Planned |
| Expand to 200+ cities | 🔲 Planned |

---

## 🔮 Roadmap

- [x] Real-time data pipeline with automated refresh
- [x] REST API with rankings, fresh data, and city detail endpoints
- [x] Interactive world map with color-coded AQI markers
- [x] Full deployment with CI/CD pipeline
- [ ] Data quality transparency indicators per city
- [ ] Historical AQI trend charts per city
- [ ] AQI forecast using trend analysis
- [ ] Email/push alerts when AQI exceeds thresholds
- [ ] PWA support for mobile installation
- [ ] Expand coverage to 200+ cities