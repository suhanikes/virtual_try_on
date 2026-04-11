# BiRefNet-portrait migration

## What changed

Only **`ml_service/`** was replaced. Express, Redis, Bull, Sharp, Nginx, React — **unchanged**.

| Layer | Before | After |
|-------|--------|--------|
| Model | CarveKit (U²-Net + Tracer-B7, optional merge) | **BiRefNet-portrait** (Hugging Face) |
| Dual-merge | Optional | **Removed** — single forward pass |
| Inference | CarveKit `HiInterface` | `transformers.AutoModelForImageSegmentation` |
| Endpoint contract | `POST /remove-bg`, field `file` | **Identical** |

---

## Environment variables

| Variable | Default | Notes |
|----------|---------|--------|
| `CARVEKIT_PRESET` | `balanced` | `fast` = 512 px; `balanced` / `best` = 1024 px (`best` adds alpha unsharp) |
| `MAX_IMAGE_DIMENSION` | `2048` | Safety cap in ML service (Express also resizes via `MAX_IMAGE_DIMENSION`) |
| `BIREFNET_MODEL` | `ZhengPeng7/BiRefNet-portrait` | e.g. `ZhengPeng7/BiRefNet_lite` for lighter CPU use |

---

## Local dev (no Docker)

### Read this if you use Windows PowerShell

- **Do not paste** Markdown from this file into the terminal: lines like `## Heading`, markdown **tables** (`| col |`), `` ```bash ``, or **prose sentences** are not commands and will error.
- **Environment variables** are not set like Linux. Use **`$env:NAME="value"`** before the command (see below). The Linux form `CARVEKIT_PRESET=fast uvicorn ...` **does not work** in PowerShell.
- **`docker`** commands require [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/) (or WSL). If `docker` is not recognized, use local Python instead.

### Bash / macOS / Linux

```bash
cd ml_service
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
export CARVEKIT_PRESET=fast
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

### Windows PowerShell (copy these lines only)

```powershell
cd "path\to\your\project\ml_service"
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
$env:CARVEKIT_PRESET = "fast"
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Optional: `balanced` or `best` instead of `fast`.

First run downloads **~200 MB** weights into `%USERPROFILE%\.cache\huggingface\` (Windows) or `~/.cache/huggingface/`.

---

## Docker

```bash
# GPU
docker build --target gpu -t ml_service:gpu ./ml_service
docker run --gpus all -p 5000:5000 -e CARVEKIT_PRESET=balanced ml_service:gpu

# CPU
docker build --target cpu -t ml_service:cpu ./ml_service
docker run -p 5000:5000 -e CARVEKIT_PRESET=fast ml_service:cpu
```

Compose: set `ML_DOCKER_TARGET=gpu` or `cpu` (see `docker-compose.yml`).

---

## Presets (selfies / portraits)

| Preset | Input size | Use when |
|--------|------------|----------|
| `fast` | 512×512 | Throughput, previews |
| `balanced` | 1024×1024 | Default quality/speed |
| `best` | 1024×1024 + alpha sharpen | Exports, fine edges |

---

## Health

In a **browser** open: `http://localhost:5000/health`

Or in **PowerShell**:

```powershell
Invoke-RestMethod http://localhost:5000/health
```

Returns JSON: `model`, `device`, `fp16`, `inference_size`, `preset`, etc.
