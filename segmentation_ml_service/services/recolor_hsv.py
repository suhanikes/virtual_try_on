import cv2
import numpy as np


def _parse_hex_to_bgr(target_hex: str) -> tuple[int, int, int]:
    s = target_hex.strip()
    if s.startswith("#"):
        s = s[1:]
    if len(s) == 3:
        s = "".join(ch * 2 for ch in s)
    if len(s) != 6 or any(ch not in "0123456789abcdefABCDEF" for ch in s):
        raise ValueError("target_hex must be a valid 3 or 6 digit hex color")
    r = int(s[0:2], 16)
    g = int(s[2:4], 16)
    b = int(s[4:6], 16)
    return b, g, r


def recolor_region_hsv(image_bgr: np.ndarray, mask: np.ndarray, target_hex: str) -> np.ndarray:
    """
    Optional legacy server-side recolor utility (not wired by default).

    Args:
        image_bgr: uint8 BGR image (H, W, 3)
        mask: binary garment mask (H, W), values 0/1 or 0/255
        target_hex: target color hex string, e.g. #ff3366

    Returns:
        Recolored BGR image with boundary-feathered blending.
    """
    if image_bgr is None or image_bgr.ndim != 3 or image_bgr.shape[2] != 3:
        raise ValueError("image_bgr must be an HxWx3 array")
    if mask is None or mask.shape[:2] != image_bgr.shape[:2]:
        raise ValueError("mask must match image spatial dimensions")

    src = image_bgr.astype(np.uint8)
    mask_u8 = (mask > 0).astype(np.uint8)

    if np.count_nonzero(mask_u8) == 0:
        return src.copy()

    # Light dilation to cover tiny holes and avoid pinholes in recolor.
    kernel = np.ones((3, 3), dtype=np.uint8)
    mask_dilated = cv2.dilate(mask_u8, kernel, iterations=1)

    bgr_target = np.uint8([[list(_parse_hex_to_bgr(target_hex))]])
    hsv_target = cv2.cvtColor(bgr_target, cv2.COLOR_BGR2HSV)[0, 0].astype(np.float32)
    target_h = hsv_target[0]
    target_s = hsv_target[1]

    hsv = cv2.cvtColor(src, cv2.COLOR_BGR2HSV).astype(np.float32)

    region = mask_dilated > 0
    if not np.any(region):
        return src.copy()

    # Preserve shading by keeping V channel; replace H and blend S.
    sat_vals = hsv[..., 1][region]
    mean_sat = float(np.mean(sat_vals)) if sat_vals.size else 0.0
    if mean_sat < 60:
        sat_blend = 0.7
    elif mean_sat < 130:
        sat_blend = 0.4
    else:
        sat_blend = 0.2

    hsv_out = hsv.copy()
    hsv_out[..., 0][region] = target_h
    hsv_out[..., 1][region] = (1.0 - sat_blend) * hsv_out[..., 1][region] + sat_blend * target_s

    recolored = cv2.cvtColor(np.clip(hsv_out, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)

    # Feather blend near boundaries for smoother transitions.
    dist_in = cv2.distanceTransform(mask_dilated, cv2.DIST_L2, 3)
    feather = np.clip(dist_in / 6.0, 0.0, 1.0).astype(np.float32)
    alpha = feather[..., None]

    out = src.astype(np.float32) * (1.0 - alpha) + recolored.astype(np.float32) * alpha
    return np.clip(out, 0, 255).astype(np.uint8)
