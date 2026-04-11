"""
BiRefNet-portrait background removal — FastAPI service.
Drop-in replacement for CarveKit: same POST /remove-bg contract (multipart `file`).

Endpoints:
  POST /remove-bg   → PNG with transparency
  GET  /health      → model / device / preset (503 while weights load)
  GET  /metrics     → Prometheus (instrumentator)

Model loads in a background task so the server binds to :5000 immediately
(first-time HF download can take many minutes; otherwise ECONNREFUSED).
"""

import asyncio
import io
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Optional, Union

import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response
from PIL import Image, ImageFilter
from prometheus_fastapi_instrumentator import Instrumentator
from torchvision import transforms
from transformers import AutoModelForImageSegmentation

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

PRESET = os.getenv("CARVEKIT_PRESET", "balanced").strip().lower()
MAX_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "2048"))
HF_MODEL_ID = os.getenv("BIREFNET_MODEL", "ZhengPeng7/BiRefNet-portrait")

PRESET_SIZE: dict[str, int] = {
    "fast": 512,
    "balanced": 1024,
    "best": 1024,
}


class ModelState:
    model: Optional[torch.nn.Module] = None
    device: str = "cpu"
    use_fp16: bool = False
    transform: Optional[transforms.Compose] = None
    inference_size: int = 1024


state = ModelState()
# Set if background load fails (e.g. network)
load_error: Optional[str] = None


def _build_transform(size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((size, size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def _extract_mask_tensor(pred_out: Union[torch.Tensor, list, tuple, dict]) -> torch.Tensor:
    """Normalize BiRefNet / HF outputs to a single H×W float mask in [0, 1]."""
    if hasattr(pred_out, "logits"):
        pred_out = pred_out.logits
    elif hasattr(pred_out, "pred"):
        pred_out = pred_out.pred
    if isinstance(pred_out, (list, tuple)):
        t = pred_out[-1]
    elif isinstance(pred_out, dict):
        t = pred_out.get("pred") or pred_out.get("logits") or pred_out.get("out")
        if t is None:
            vals = [v for v in pred_out.values() if torch.is_tensor(v)]
            t = vals[-1] if vals else next(iter(pred_out.values()))
    else:
        t = pred_out

    if not torch.is_tensor(t):
        raise TypeError(f"Unexpected model output type: {type(t)}")

    t = t.float()
    if t.dim() == 4:
        t = t[0, 0] if t.shape[1] >= 1 else t[0]
    elif t.dim() == 3:
        t = t[0]
    return t.sigmoid().squeeze().cpu().float()


def load_model() -> None:
    log.info("Loading %s …", HF_MODEL_ID)
    t0 = time.time()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    use_fp16 = device == "cuda"

    try:
        torch.set_float32_matmul_precision("high")
    except Exception:
        pass

    model = AutoModelForImageSegmentation.from_pretrained(HF_MODEL_ID, trust_remote_code=True)
    model.eval()
    model.to(device)
    if use_fp16:
        model = model.half()
        log.info("FP16 mode enabled (GPU)")

    preset_key = PRESET if PRESET in PRESET_SIZE else "balanced"
    size = PRESET_SIZE[preset_key]

    state.model = model
    state.device = device
    state.use_fp16 = use_fp16
    state.transform = _build_transform(size)
    state.inference_size = size

    log.info(
        "Model ready in %.1f s  |  device=%s  preset=%s  size=%d",
        time.time() - t0,
        device,
        preset_key,
        size,
    )


async def _load_model_async() -> None:
    global load_error
    try:
        await asyncio.to_thread(load_model)
    except Exception:
        load_error = "Model load failed — see server logs"
        log.exception("Background model load failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_load_model_async())
    yield


app = FastAPI(title="BiRefNet portrait bg-removal", lifespan=lifespan)
Instrumentator().instrument(app).expose(app)


def _infer(pil_image: Image.Image) -> Image.Image:
    orig_w, orig_h = pil_image.size

    if max(orig_w, orig_h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(orig_w, orig_h)
        pil_image = pil_image.resize(
            (int(orig_w * ratio), int(orig_h * ratio)),
            Image.Resampling.LANCZOS,
        )
        orig_w, orig_h = pil_image.size

    rgb = pil_image.convert("RGB")

    if state.transform is None or state.model is None:
        raise RuntimeError("Model not initialized")

    tensor = state.transform(rgb).unsqueeze(0).to(state.device)
    if state.use_fp16:
        tensor = tensor.half()

    with torch.no_grad():
        preds = state.model(tensor)

    mask_tensor = _extract_mask_tensor(preds)
    mask_np = (mask_tensor.numpy() * 255.0).clip(0, 255).astype(np.uint8)
    mask_pil = Image.fromarray(mask_np, mode="L").resize((orig_w, orig_h), Image.Resampling.LANCZOS)

    preset_key = PRESET if PRESET in PRESET_SIZE else "balanced"
    if preset_key == "best":
        mask_pil = mask_pil.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))

    result = pil_image.convert("RGBA")
    result.putalpha(mask_pil)
    return result


def _encode_png(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG", optimize=False)
    return buf.getvalue()


@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...)) -> Response:
    req_start = time.time()
    log.info("/remove-bg request started content_type=%s filename=%s", file.content_type, file.filename)

    if load_error:
        log.warning("/remove-bg blocked due to load_error=%s", load_error)
        raise HTTPException(status_code=503, detail=load_error)
    if state.model is None:
        log.info("/remove-bg requested while model still loading")
        raise HTTPException(
            status_code=503,
            detail="Model still loading (first run downloads ~1GB from Hugging Face). Retry in a minute.",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        log.warning("/remove-bg rejected non-image content_type=%s", file.content_type)
        raise HTTPException(status_code=400, detail="File must be an image")

    raw = await file.read()
    log.info("/remove-bg received bytes=%d", len(raw))
    if len(raw) > 20 * 1024 * 1024:
        log.warning("/remove-bg rejected oversized payload bytes=%d", len(raw))
        raise HTTPException(status_code=413, detail="File too large (max 20MB)")

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as exc:
        log.exception("/remove-bg image decode failed")
        raise HTTPException(status_code=400, detail=f"Cannot decode image: {exc}") from exc

    try:
        t0 = time.time()
        result = _infer(img)
        elapsed = time.time() - t0
    except Exception as exc:
        log.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}") from exc

    png_bytes = _encode_png(result)
    log.info(
        "/remove-bg completed in %.3fs output_bytes=%d",
        time.time() - req_start,
        len(png_bytes),
    )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "X-Processing-Time": f"{elapsed:.3f}",
            "X-BiRefNet-Preset": PRESET,
            "X-BiRefNet-Model": HF_MODEL_ID,
        },
    )


@app.get("/health")
async def health():
    if load_error:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "detail": load_error,
                "model": HF_MODEL_ID,
            },
        )
    if state.model is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "loading",
                "model": HF_MODEL_ID,
                "message": "Weights downloading or loading into RAM — first run can take several minutes.",
                "model_loaded": False,
            },
        )
    return {
        "status": "ok",
        "model": HF_MODEL_ID,
        "preset": PRESET,
        "device": state.device,
        "fp16": state.use_fp16,
        "inference_size": state.inference_size,
        "model_loaded": True,
    }
