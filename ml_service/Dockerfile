# Multi-target Dockerfile:
#   docker build --target gpu -t ml_service:gpu ./ml_service
#   docker build --target cpu -t ml_service:cpu ./ml_service
#
# Default target (last stage): cpu

FROM python:3.11-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# ── GPU (CUDA 12.1) ───────────────────────────────────────────────────────────
FROM base AS gpu

RUN pip install --no-cache-dir \
        torch torchvision \
        --index-url https://download.pytorch.org/whl/cu121 \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python - <<'EOF'
from transformers import AutoModelForImageSegmentation
AutoModelForImageSegmentation.from_pretrained(
    "ZhengPeng7/BiRefNet-portrait", trust_remote_code=True
)
print("Model weights cached.")
EOF

ENV CARVEKIT_PRESET=balanced \
    MAX_IMAGE_DIMENSION=2048 \
    BIREFNET_MODEL=ZhengPeng7/BiRefNet-portrait

EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]

# ── CPU ───────────────────────────────────────────────────────────────────────
FROM base AS cpu

RUN pip install --no-cache-dir \
        torch torchvision \
        --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python - <<'EOF'
from transformers import AutoModelForImageSegmentation
AutoModelForImageSegmentation.from_pretrained(
    "ZhengPeng7/BiRefNet-portrait", trust_remote_code=True
)
print("Model weights cached.")
EOF

ENV CARVEKIT_PRESET=fast \
    MAX_IMAGE_DIMENSION=2048 \
    BIREFNET_MODEL=ZhengPeng7/BiRefNet-portrait

EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]
