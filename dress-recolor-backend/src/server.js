import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env"), override: false });

const app = express();
const PORT = process.env.PORT || 4000;
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();
const HF_SEGMENTATION_MODEL = (process.env.HF_SEGMENTATION_MODEL || "mattmdjaga/segformer_b2_clothes").trim();
const HF_INFERENCE_API_BASE = (
  process.env.HF_INFERENCE_API_BASE || "https://router.huggingface.co/hf-inference/models"
)
  .trim()
  .replace(/\/+$/, "");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "25mb" }));

const uploadsDir = path.join(__dirname, "..", "uploads");
const staticDir = path.join(__dirname, "..", "static");
const editedDir = path.join(staticDir, "edited");
const maskDir = path.join(staticDir, "masks");

for (const dir of [uploadsDir, staticDir, editedDir, maskDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use("/static", express.static(staticDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".png");
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Please upload JPEG, PNG, or WebP."));
    }
    cb(null, true);
  },
});

const imageRegistry = new Map();

const GARMENT_LABEL_HINTS = [
  "upper-clothes",
  "upper_clothes",
  "dress",
  "skirt",
  "pants",
  "belt",
  "bag",
  "scarf",
  "left-shoe",
  "right-shoe",
  "shoe",
  "coat",
  "jacket",
  "shirt",
  "top",
  "hoodie",
  "sweater",
];

function buildProviderError(status, details) {
  const error = new Error(details || "Provider request failed");
  error.providerStatus = status;
  return error;
}

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function isGarmentLabel(value) {
  const label = normalizeLabel(value);
  if (!label || label.includes("background")) {
    return false;
  }
  return GARMENT_LABEL_HINTS.some((hint) => label.includes(hint));
}

function garmentTypeHints(garmentType) {
  const normalized = normalizeLabel(garmentType);
  switch (normalized) {
    case "upper-clothes":
    case "upper-cloth":
    case "tshirt":
    case "shirt":
    case "top":
      return ["upper-clothes", "upper_clothes", "shirt", "top", "t-shirt", "tee"];
    case "dress":
      return ["dress", "gown"];
    case "coat":
    case "jacket":
      return ["coat", "jacket", "blazer", "outerwear"];
    case "sweater":
    case "hoodie":
      return ["sweater", "hoodie", "pullover", "knit"];
    case "pants":
    case "bottom":
      return ["pants", "trouser", "jean", "leggings", "shorts"];
    case "skirt":
      return ["skirt"];
    default:
      return [];
  }
}

function segmentMatchesGarmentType(label, garmentType) {
  const hints = garmentTypeHints(garmentType);
  if (!hints.length) {
    return false;
  }
  const normalizedLabel = normalizeLabel(label);
  return hints.some((hint) => normalizedLabel.includes(hint));
}

function stripDataUrlPrefix(b64) {
  if (typeof b64 !== "string") {
    return "";
  }
  const comma = b64.indexOf(",");
  return comma >= 0 ? b64.slice(comma + 1) : b64;
}

async function decodeMaskToBinary(maskB64, width, height) {
  const raw = Buffer.from(stripDataUrlPrefix(maskB64), "base64");
  const gray = await sharp(raw)
    .removeAlpha()
    .greyscale()
    .resize(width, height, { fit: "fill" })
    .raw()
    .toBuffer();

  const binary = new Uint8Array(width * height);
  for (let i = 0; i < binary.length; i += 1) {
    binary[i] = gray[i] > 127 ? 1 : 0;
  }
  return binary;
}

function buildPolygonMask(width, height, points) {
  const mask = new Uint8Array(width * height);
  if (!Array.isArray(points) || points.length < 3) {
    return mask;
  }

  const p = points.map((pt) => ({
    x: Number(pt.x),
    y: Number(pt.y),
  }));

  for (let y = 0; y < height; y += 1) {
    const scanY = y + 0.5;
    const intersections = [];

    for (let i = 0; i < p.length; i += 1) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) {
        continue;
      }
      const intersects = (a.y <= scanY && b.y > scanY) || (b.y <= scanY && a.y > scanY);
      if (!intersects) {
        continue;
      }
      const t = (scanY - a.y) / (b.y - a.y);
      intersections.push(a.x + t * (b.x - a.x));
    }

    intersections.sort((left, right) => left - right);

    for (let i = 0; i + 1 < intersections.length; i += 2) {
      let startX = Math.ceil(intersections[i]);
      let endX = Math.floor(intersections[i + 1]);

      if (endX < 0 || startX >= width) {
        continue;
      }
      if (startX < 0) {
        startX = 0;
      }
      if (endX >= width) {
        endX = width - 1;
      }

      const row = y * width;
      for (let x = startX; x <= endX; x += 1) {
        mask[row + x] = 1;
      }
    }
  }

  return mask;
}

function countOverlap(maskA, maskB) {
  let overlap = 0;
  for (let i = 0; i < maskA.length; i += 1) {
    if (maskA[i] && maskB[i]) {
      overlap += 1;
    }
  }
  return overlap;
}

async function saveMaskPreview(maskBinary, width, height, imageId) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < maskBinary.length; i += 1) {
    const o = i * 4;
    if (maskBinary[i]) {
      rgba[o] = 255;
      rgba[o + 1] = 0;
      rgba[o + 2] = 0;
      rgba[o + 3] = 160;
    }
  }

  const maskFilename = `${Date.now()}-${imageId}-mask.png`;
  const maskPath = path.join(maskDir, maskFilename);
  await sharp(rgba, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toFile(maskPath);

  return `${getBaseUrl()}/static/masks/${maskFilename}`;
}

async function runHfSegmentation(meta) {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN missing in environment");
  }

  const endpoint = `${HF_INFERENCE_API_BASE}/${HF_SEGMENTATION_MODEL}`;
  const imageBuffer = fs.readFileSync(meta.path);

  const response = await axios.post(endpoint, imageBuffer, {
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": meta.mimeType || "image/jpeg",
      Accept: "application/json",
    },
    timeout: 120000,
    validateStatus: () => true,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (response.status < 200 || response.status >= 300) {
    const body = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    throw buildProviderError(response.status, `HF segmentation failed (${response.status}): ${body}`);
  }

  const payload = Array.isArray(response.data) ? response.data : [];
  const usable = payload
    .map((item) => ({
      label: String(item?.label || ""),
      score: Number(item?.score ?? 1),
      mask: item?.mask,
      binaryMask: null,
    }))
    .filter((segment) => segment.mask && segment.label);

  if (!usable.length) {
    throw new Error("HF segmentation returned no usable masks");
  }

  meta.hfSegments = usable;
}

function getBaseUrl() {
  const fromEnv = process.env.PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `http://localhost:${PORT}`;
}

app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const id = uuidv4();
  const filePath = req.file.path;

  // Always store the image so upload succeeds; then run segmentation (optional)
  const meta = {
    id,
    path: filePath,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype || "image/jpeg",
    width: null,
    height: null,
    hfSegments: null,
  };
  imageRegistry.set(id, meta);

  try {
    const metadata = await sharp(filePath).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to read image dimensions");
    }
    meta.width = metadata.width;
    meta.height = metadata.height;

    // Best-effort pre-segmentation. Failure here should not fail upload.
    await runHfSegmentation(meta);
  } catch (err) {
    console.error("Upload segmentation warmup error", err?.message || err);
  }

  const dims =
    meta.width != null && meta.height != null
      ? { width: Number(meta.width), height: Number(meta.height) }
      : {};
  return res.json({
    imageId: id,
    filename: path.basename(filePath),
    ...dims,
  });
});

app.post("/api/lasso-segmentation", async (req, res) => {
  const body = req.body || {};
  let { imageId, lasso_points, selected_color, garment_type } = body;

  if (!imageId) {
    return res.status(400).json({
      error: "imageId is required. Re-upload the image and try again.",
    });
  }

  // Normalize lasso_points: allow array of {x,y} or flat [x,y,x,y,...]
  if (Array.isArray(lasso_points) && lasso_points.length >= 6 && typeof lasso_points[0] === "number") {
    const points = [];
    for (let i = 0; i < lasso_points.length; i += 2) {
      points.push({ x: lasso_points[i], y: lasso_points[i + 1] });
    }
    lasso_points = points;
  }
  if (!Array.isArray(lasso_points) || lasso_points.length < 3) {
    return res.status(400).json({
      error: "lasso_points must be an array of at least 3 points (e.g. [{x,y}, ...]).",
    });
  }

  const meta = imageRegistry.get(imageId);
  if (!meta) {
    return res.status(404).json({ error: "Image not found. Re-upload it." });
  }

  if (!meta.width || !meta.height) {
    return res.status(500).json({ error: "Missing image dimensions. Re-upload the image." });
  }

  if (!Array.isArray(meta.hfSegments) || meta.hfSegments.length === 0) {
    try {
      await runHfSegmentation(meta);
    } catch (err) {
      console.error("On-demand HF segmentation error", err?.message || err);
      const providerStatus = Number(err?.providerStatus || 0);
      if (providerStatus === 401 || providerStatus === 403) {
        return res.status(403).json({
          error: "Hugging Face token lacks required permissions for Inference Providers.",
          details: err?.message || "Forbidden by provider",
        });
      }
      if (providerStatus === 429) {
        return res.status(429).json({
          error: "Hugging Face rate limit reached.",
          details: err?.message || "Too many requests",
        });
      }
      return res.status(502).json({
        error: "Segmentation failed at provider.",
        details: err?.message || "Unknown HF segmentation error",
      });
    }
  }

  try {
    const width = meta.width;
    const height = meta.height;
    const lassoMask = buildPolygonMask(width, height, lasso_points);
    if (!lassoMask.some((v) => v === 1)) {
      return res.status(400).json({
        error: "Invalid lasso selection. Please draw a closed area over the garment.",
      });
    }

    const segments = meta.hfSegments.filter((segment) => isGarmentLabel(segment.label));
    if (!segments.length) {
      return res.status(422).json({ error: "No garment detected in selected area." });
    }

    const preferredSegments =
      garment_type && String(garment_type).trim().length > 0
        ? segments.filter((segment) => segmentMatchesGarmentType(segment.label, garment_type))
        : [];
    const candidateSegments = preferredSegments.length ? preferredSegments : segments;

    let bestSegment = null;
    let bestOverlap = 0;

    for (const segment of candidateSegments) {
      if (!segment.binaryMask) {
        // Cache decoded masks to avoid repeated PNG decode on repeated lasso edits.
        segment.binaryMask = await decodeMaskToBinary(segment.mask, width, height);
      }
      const overlap = countOverlap(segment.binaryMask, lassoMask);
      if (
        overlap > bestOverlap ||
        (overlap === bestOverlap && bestSegment && Number(segment.score || 0) > Number(bestSegment.score || 0))
      ) {
        bestOverlap = overlap;
        bestSegment = segment;
      }
    }

    if (!bestSegment || bestOverlap === 0) {
      return res.status(422).json({ error: "No garment detected in selected area." });
    }

    const garmentMaskBinary = bestSegment.binaryMask;
    const garmentMaskB64 = Buffer.from(garmentMaskBinary).toString("base64");
    const maskUrl = await saveMaskPreview(garmentMaskBinary, width, height, imageId);

    return res.json({
      garment_mask_b64: garmentMaskB64,
      height,
      width,
      mask_preview: maskUrl ?? null,
    });
  } catch (err) {
    const details = err?.message ?? "Unknown segmentation error";
    console.error("Segmentation failure", details);
    return res.status(500).json({
      error: "Failed to process segmentation request",
      details,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "node-backend" });
});

app.use((err, _req, res, _next) => {
  if (err?.message?.includes("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Max allowed size is 10MB." });
  }
  console.error("Unhandled server error:", err);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Node backend listening on http://localhost:${PORT}`);
  console.log(`Segmentation mode: HF API (${HF_SEGMENTATION_MODEL})`);
  console.log(`HF token configured: ${HF_TOKEN ? "yes" : "no"}`);
});

