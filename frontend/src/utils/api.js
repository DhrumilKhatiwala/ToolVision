/**
 * API client for ToolVision AI
 * Uses In-Browser ONNX Runtime Web for real-time ~100ms inference
 * with seamless fallback and static analytics support.
 */

import { predictToolOnnx } from "./onnxInference";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function checkHealth() {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (err) {
      // continue to client fallback
    }
  }
  return {
    status: "client_onnx",
    model_loaded: true,
    device: "WebAssembly (Browser)",
    engine: "ONNX Runtime Web",
    note: "Running in-browser client inference",
  };
}

export async function fetchModelInfo() {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/model-info`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (err) {
      // continue to static fallback
    }
  }

  try {
    const fallbackRes = await fetch("/model-info.json");
    if (fallbackRes.ok) return await fallbackRes.json();
  } catch (e) {
    // continue
  }

  return {
    model_name: "YOLOv8n-seg Tool Detection",
    task: "instance-segmentation",
    num_classes: 18,
    device: "WebAssembly (Browser)",
    conf_threshold: 0.25,
    classes: {
      0: "search-for-tools",
      1: "Adjustable spanner",
      2: "Backsaw",
      3: "Calipers",
      4: "Cutting pliers",
      5: "Drill",
      6: "Gas wrench",
      7: "Gun",
      8: "Hammer",
      9: "Hand",
      10: "Handsaw",
      11: "Needle-nose pliers",
      12: "Pliers",
      13: "Ratchet",
      14: "Screwdriver",
      15: "Tape measure",
      16: "Utility knife",
      17: "Wrench",
    },
  };
}

export async function fetchMetrics() {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/metrics`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (err) {
      // continue to static fallback
    }
  }

  try {
    const fallbackRes = await fetch("/metrics.json");
    if (fallbackRes.ok) return await fallbackRes.json();
  } catch (e) {
    // continue
  }

  throw new Error("Unable to load metrics");
}

export function getMetricImageUrl(filename) {
  if (API_BASE) {
    return `${API_BASE}/api/metrics/image/${encodeURIComponent(filename)}`;
  }
  return `/eval_results/${encodeURIComponent(filename)}`;
}

export async function predictTool(fileOrBlob, confidence = 0.25) {
  // If API_BASE is explicitly set, attempt backend inference with 3s timeout
  if (API_BASE) {
    try {
      const formData = new FormData();
      formData.append("file", fileOrBlob);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${API_BASE}/api/predict?confidence=${confidence}`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
      console.warn(`[ToolVision] Backend returned ${res.status}. Falling back to in-browser ONNX.`);
    } catch (err) {
      console.warn("[ToolVision] Backend unreachable or slow. Falling back to in-browser ONNX:", err.message);
    }
  }

  // Fast In-Browser ONNX Runtime Web inference (~100ms)
  return await predictToolOnnx(fileOrBlob, confidence);
}
