# Page Design with Details

This is a code bundle for Page Design with Details. The original project is available at https://www.figma.com/design/6HF1fAcfQJ0CeWvA8zJKxt/Page-Design-with-Details.

## Running the code

Run `npm i` to install frontend dependencies.

Run `npm run dev` to start the frontend development server.

## Background removal setup (single workspace)

Background removal is organized into:

- `ml_service/` for ML inference API (`/remove-bg`)
- `backend/` for app backend API (`/api/remove-bg`)

### One-time setup

1. Install backend dependencies:

  `npm --prefix backend install`

2. Create Python virtual environment and install ML dependencies:

  `python -m venv ml_service/.venv`

  `ml_service/.venv/Scripts/pip install -r ml_service/requirements.txt`

### Run all services (3 terminals)

1. Terminal 1 (ML service):

  `ml_service/.venv/Scripts/uvicorn main:app --host 0.0.0.0 --port 5000 --app-dir ml_service`

2. Terminal 2 (backend):

  `npm run dev:backend`

3. Terminal 3 (frontend):

  `npm run dev`

The frontend calls `/api/remove-bg`, and Vite proxies that to `http://127.0.0.1:3001`.
  