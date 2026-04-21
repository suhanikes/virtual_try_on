# Dress recolor backend (Node)

This is a standalone backend for the **Dress recoloring** workflow. It is intentionally separate from the existing try-on/remove-bg backend so the two features do not get mixed.

## What it provides

- `POST /api/upload`: stores an uploaded image and runs one-time segmentation via Hugging Face API.
- `POST /api/lasso-segmentation`: combines stored HF segmentation + user lasso to produce a final garment mask.
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

## Hugging Face requirement

This backend requires `HF_TOKEN` in environment variables. The token must include Inference Providers permission.

