# Remove Background Backend

This backend exposes a single API endpoint that forwards uploaded images to an ML service and returns a PNG with transparent background.

## Endpoint

- `POST /api/remove-bg`
  - `multipart/form-data`
  - field name: `image`
  - response: `image/png`

## Environment

Copy `.env.example` to `.env` and adjust values if needed.

- `PORT` (default: `3001`)
- `ML_SERVICE_URL` (default: `http://127.0.0.1:5000`)
- `ML_REQUEST_TIMEOUT_MS` (default: `300000`)
- `FRONTEND_URL` (default: `http://localhost:5173`)

## Run

```bash
npm install
npm run dev
```

The frontend Vite dev server proxies `/api` to this backend on port `3001`.
