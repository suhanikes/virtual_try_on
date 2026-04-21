import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });

const PORT = Number(process.env.PORT || 3001);
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';
const ML_REQUEST_TIMEOUT_MS = Number(process.env.ML_REQUEST_TIMEOUT_MS || 300000);
const MAX_IMAGE_DIMENSION = Number(process.env.MAX_IMAGE_DIMENSION || 3072);
const BG_REMOVER_API_KEY = (process.env.BG_REMOVER_API_KEY || process.env.bg_remover_api_key || '').trim();
const REMOVE_BG_API_URL = (process.env.REMOVE_BG_API_URL || 'https://api.remove.bg/v1.0/removebg').trim();
const BG_REMOVE_MODE = (process.env.BG_REMOVE_MODE || (BG_REMOVER_API_KEY ? 'removebg-api' : 'ml-service'))
  .trim()
  .toLowerCase();

function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function log(scope, message, data = null) {
  const prefix = `[${new Date().toISOString()}] [${scope}] ${message}`;
  if (data) {
    console.log(prefix, data);
    return;
  }
  console.log(prefix);
}

function parseMlErrorBody(responseData) {
  try {
    const raw = Buffer.isBuffer(responseData)
      ? responseData.toString('utf8')
      : Buffer.from(responseData).toString('utf8');

    const parsed = JSON.parse(raw);
    return parsed?.detail || parsed?.error || raw;
  } catch {
    try {
      return Buffer.isBuffer(responseData)
        ? responseData.toString('utf8').slice(0, 300)
        : String(responseData).slice(0, 300);
    } catch {
      return 'Unknown ML response body';
    }
  }
}

function mlServiceErrorMessage(error) {
  if (error?.code === 'ECONNABORTED') {
    return `ML request timed out after ${Math.round(ML_REQUEST_TIMEOUT_MS / 1000)}s`;
  }

  const status = error?.response?.status;
  if (status === 503) {
    return 'ML model is still loading. Check ml_service terminal logs and retry in a minute.';
  }

  if (status === 502 || status === 504) {
    return 'ML service is currently unavailable.';
  }

  if (status) {
    return `ML service returned status ${status}`;
  }

  if (error?.code === 'ECONNREFUSED') {
    return `Cannot connect to ML service at ${ML_SERVICE_URL}`;
  }

  return error?.message || 'Background removal failed';
}

function removeBgApiErrorMessage(error) {
  if (error?.code === 'ECONNABORTED') {
    return `remove.bg request timed out after ${Math.round(ML_REQUEST_TIMEOUT_MS / 1000)}s`;
  }

  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return 'remove.bg API key is invalid or unauthorized';
  }
  if (status === 402) {
    return 'remove.bg credits exhausted or billing required';
  }
  if (status === 429) {
    return 'remove.bg rate limit reached. Retry shortly.';
  }
  if (status) {
    return `remove.bg returned status ${status}`;
  }

  return error?.message || 'remove.bg background removal failed';
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('combined'));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: false,
  }),
);
app.use(express.json());
app.use((req, res, next) => {
  const reqId = createRequestId();
  const startedAt = Date.now();

  req.reqId = reqId;
  res.locals.reqId = reqId;

  log('request', `${req.method} ${req.originalUrl} started`, { reqId });

  res.on('finish', () => {
    log('request', `${req.method} ${req.originalUrl} completed`, {
      reqId,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  const reqId = res.locals.reqId;

  if (!req.file) {
    log('remove-bg', 'No file uploaded', { reqId });
    res.status(400).json({ error: 'No image provided', reqId });
    return;
  }

  try {
    log('remove-bg', 'Upload received', {
      reqId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    let imageBuffer = req.file.buffer;
    let metadata;

    try {
      metadata = await sharp(imageBuffer).metadata();
      log('remove-bg', 'Input image metadata', {
        reqId,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      });

      if (
        metadata.width &&
        metadata.height &&
        (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION)
      ) {
        imageBuffer = await sharp(imageBuffer)
          .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer();

        log('remove-bg', 'Image resized and converted to PNG', {
          reqId,
          maxDimension: MAX_IMAGE_DIMENSION,
          sizeBytes: imageBuffer.length,
        });
      } else {
        imageBuffer = await sharp(imageBuffer).png().toBuffer();
        log('remove-bg', 'Image converted to PNG', {
          reqId,
          sizeBytes: imageBuffer.length,
        });
      }
    } catch (preprocessError) {
      log('remove-bg', 'Image preprocessing failed', {
        reqId,
        error: preprocessError?.message || String(preprocessError),
      });
      res.status(400).json({ error: 'Invalid image payload', reqId });
      return;
    }

    if (BG_REMOVE_MODE === 'removebg-api') {
      if (!BG_REMOVER_API_KEY) {
        res.status(500).json({ error: 'bg_remover_api_key is missing in environment', reqId });
        return;
      }

      const removeBgForm = new FormData();
      removeBgForm.append('image_file', imageBuffer, {
        filename: req.file.originalname || 'image.png',
        contentType: 'image/png',
      });
      removeBgForm.append('size', 'auto');

      const startedAt = Date.now();
      log('remove-bg', 'Forwarding request to remove.bg API', {
        reqId,
        url: REMOVE_BG_API_URL,
        timeoutMs: ML_REQUEST_TIMEOUT_MS,
      });

      const response = await axios.post(REMOVE_BG_API_URL, removeBgForm, {
        headers: {
          ...removeBgForm.getHeaders(),
          'X-Api-Key': BG_REMOVER_API_KEY,
        },
        responseType: 'arraybuffer',
        timeout: ML_REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
      });

      const apiDurationMs = Date.now() - startedAt;
      if (response.status < 200 || response.status >= 300) {
        const detail = parseMlErrorBody(response.data);
        log('remove-bg', 'remove.bg returned non-success status', {
          reqId,
          status: response.status,
          durationMs: apiDurationMs,
          detail,
        });

        const error = new Error(`remove.bg failed (${response.status})`);
        error.response = { status: response.status, data: response.data };
        throw error;
      }

      log('remove-bg', 'remove.bg completed successfully', {
        reqId,
        durationMs: apiDurationMs,
        outputBytes: Buffer.byteLength(response.data),
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Request-Id', reqId);
      res.send(Buffer.from(response.data));
      return;
    }

    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: req.file.originalname || 'image.png',
      contentType: 'image/png',
    });

    const mlStartedAt = Date.now();
    log('remove-bg', 'Forwarding request to ML service', {
      reqId,
      mlUrl: `${ML_SERVICE_URL}/remove-bg`,
      timeoutMs: ML_REQUEST_TIMEOUT_MS,
    });

    const response = await axios.post(`${ML_SERVICE_URL}/remove-bg`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      timeout: ML_REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });

    const mlDurationMs = Date.now() - mlStartedAt;

    if (response.status < 200 || response.status >= 300) {
      const detail = parseMlErrorBody(response.data);
      log('remove-bg', 'ML service returned non-success status', {
        reqId,
        status: response.status,
        durationMs: mlDurationMs,
        detail,
      });

      res.status(502).json({ error: 'Background removal failed', detail, reqId });
      return;
    }

    log('remove-bg', 'ML service completed successfully', {
      reqId,
      durationMs: mlDurationMs,
      outputBytes: Buffer.byteLength(response.data),
      processingTimeHeader: response.headers?.['x-processing-time'],
      presetHeader: response.headers?.['x-birefnet-preset'],
      modelHeader: response.headers?.['x-birefnet-model'],
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Request-Id', reqId);
    res.send(Buffer.from(response.data));
  } catch (error) {
    const reqId = res.locals.reqId;
    const detailFromResponse = error?.response?.data ? parseMlErrorBody(error.response.data) : null;
    const message = BG_REMOVE_MODE === 'removebg-api' ? removeBgApiErrorMessage(error) : mlServiceErrorMessage(error);

    log('remove-bg', 'Proxy request failed', {
      reqId,
      code: error?.code,
      status: error?.response?.status,
      message,
      detailFromResponse,
    });

    const status = Number(error?.response?.status || 0);
    const mappedStatus = status >= 400 && status < 600 ? status : 500;
    res.status(mappedStatus).json({ error: message, detail: detailFromResponse, reqId });
  }
});

app.get('/health', async (req, res) => {
  const reqId = res.locals.reqId;
  if (BG_REMOVE_MODE === 'removebg-api') {
    res.status(200).json({
      status: 'ok',
      backend: true,
      bgRemoveMode: BG_REMOVE_MODE,
      removeBgApiUrl: REMOVE_BG_API_URL,
      removeBgApiKeyConfigured: Boolean(BG_REMOVER_API_KEY),
      reqId,
    });
    return;
  }

  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 15000,
      validateStatus: () => true,
    });

    log('health', 'Health check completed', {
      reqId,
      mlStatusCode: response.status,
    });

    res.status(response.status).json({
      status: 'ok',
      backend: true,
      mlStatusCode: response.status,
      ml: response.data,
      reqId,
    });
  } catch (error) {
    log('health', 'Health check failed', {
      reqId,
      error: error?.message || String(error),
    });

    res.status(503).json({
      status: 'degraded',
      backend: true,
      mlReachable: false,
      detail: 'ML service not reachable',
      reqId,
    });
  }
});

app.use((err, req, res, next) => {
  const reqId = res.locals.reqId;

  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    log('error', 'Multer file size limit exceeded', { reqId });
    res.status(413).json({ error: 'File too large (max 20MB)', reqId });
    return;
  }

  if (err?.message === 'Only image files are allowed') {
    log('error', 'Invalid upload mime type', { reqId });
    res.status(400).json({ error: err.message, reqId });
    return;
  }

  log('error', 'Unhandled backend error', {
    reqId,
    error: err?.message || String(err),
    stack: err?.stack,
  });

  res.status(500).json({ error: 'Internal server error', reqId });
});

app.listen(PORT, () => {
  console.log(`Remove-bg backend running on port ${PORT}`);
  console.log(`BG_REMOVE_MODE=${BG_REMOVE_MODE}`);
  console.log(`remove.bg key configured=${BG_REMOVER_API_KEY ? 'yes' : 'no'}`);
  console.log(`ML_SERVICE_URL=${ML_SERVICE_URL}`);
  console.log(`ML_REQUEST_TIMEOUT_MS=${ML_REQUEST_TIMEOUT_MS}`);
  console.log(`MAX_IMAGE_DIMENSION=${MAX_IMAGE_DIMENSION}`);
});
