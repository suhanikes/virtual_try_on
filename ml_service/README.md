# ML Service

This service exposes background removal at:

- `POST /remove-bg`
- `GET /health`

## Setup

```bash
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
```

## Run

```bash
.venv/Scripts/uvicorn main:app --host 0.0.0.0 --port 5000
```

If you run from the project root, use:

```bash
ml_service/.venv/Scripts/uvicorn main:app --host 0.0.0.0 --port 5000 --app-dir ml_service
```
