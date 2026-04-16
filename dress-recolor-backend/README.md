# Dress recolor backend (Node)

This is a standalone backend for the **Dress recoloring** workflow. It is intentionally separate from the existing try-on/remove-bg backend so the two features do not get mixed.

## What it provides

- `POST /api/upload`: stores an uploaded image and (optionally) runs one-time segmentation via the ML service.
- `POST /api/lasso-segmentation`: combines the stored segmentation + user lasso to produce a final garment mask.
- `GET /health`

## How to run

1) Install dependencies:

```bash
cd "dress-recolor-backend"
npm install
```

2) Create `.env` from `.env.example` (optional).

3) Start the backend:

```bash
npm run start
```

Backend listens on port `4000` by default, matching the frontend default `VITE_DRESS_RECOLOR_API_URL` fallback (`http://localhost:4000/api`).

## ML service requirement

This backend expects a Python ML service at `ML_SERVICE_URL` (default `http://127.0.0.1:8000`) with:

- `POST /segmentation/run-once`
- `POST /segmentation/recolor`

