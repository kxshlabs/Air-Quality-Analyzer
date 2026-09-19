# Air Quality Analyzer

> Real-time global air quality monitoring across 120 cities.

## Live Demo

- **Frontend:** https://air-quality-analyzer.vercel.app
- **API:** https://air-quality-analyzer.onrender.com

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Data Source | WAQI API |
| Deployment | Vercel (frontend), Render (API) |
| CI/CD | GitHub Actions |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | Health check |
| GET | /api/aqi | All cities data |
| GET | /api/aqi/fresh | Force fresh fetch |
| GET | /api/aqi/rankings | Cities ranked by AQI |
| GET | /api/aqi/:city | Single city data |

## Environment Variables

### Backend
```
MONGODB_URI=your_mongodb_atlas_uri
WAQI_TOKEN=your_waqi_token
PORT=10000
NODE_ENV=production
```

### Frontend
```
VITE_API_URL=https://air-quality-analyzer.onrender.com
```

## Local Development

```bash
# Backend
cd api && npm install && node server.js

# Frontend
cd frontend && npm install && npm run dev
```

## Deployment

- **Backend:** Connected to Render via render.yaml. Set env vars in Render dashboard.
- **Frontend:** Connected to Vercel. Set VITE_API_URL in Vercel environment settings.
- **CI/CD:** GitHub Actions triggers Render deploy hook every 6 hours. Set RENDER_DEPLOY_HOOK in GitHub Secrets.

## Running Tests

```bash
# Health check all endpoints
python backend/tests/health_check.py

# Full feature test suite
python backend/tests/test_features.py
```