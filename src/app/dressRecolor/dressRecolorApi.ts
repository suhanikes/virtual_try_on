import axios from 'axios';

export const DRESS_RECOLOR_API_BASE = import.meta.env.VITE_DRESS_RECOLOR_API_URL ?? 'http://localhost:4000/api';

const API_BASE = DRESS_RECOLOR_API_BASE;

export type UploadImageResponse = {
  imageId: string;
  width: number;
  height: number;
};

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await axios.post<UploadImageResponse>(`${API_BASE}/upload`, formData);
  return res.data;
}

export type LassoPoint = { x: number; y: number };

export type LassoSegmentationResponse = {
  garment_mask_b64?: string;
  height?: number;
  width?: number;
  mask_preview?: string;
};

export async function lassoSegmentation(params: {
  imageId: string;
  lassoPoints: LassoPoint[];
  selectedColor: string;
}): Promise<LassoSegmentationResponse> {
  const { imageId, lassoPoints, selectedColor } = params;
  if (!imageId || !Array.isArray(lassoPoints) || lassoPoints.length < 3) {
    throw new Error('Need imageId and at least 3 lasso points.');
  }
  const res = await axios.post<LassoSegmentationResponse>(
    `${API_BASE}/lasso-segmentation`,
    {
      imageId,
      lasso_points: lassoPoints,
      selected_color: selectedColor ?? '#ff3366',
    },
    { headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}
