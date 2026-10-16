/**
 * API client for ToolVision AI backend
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: "offline", model_loaded: false, device: "none", error: err.message };
  }
}

export async function fetchModelInfo() {
  const res = await fetch(`${API_BASE}/api/model-info`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch model info" }));
    throw new Error(err.detail || "Error loading model metadata");
  }
  return await res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/api/metrics`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch metrics" }));
    throw new Error(err.detail || "Error loading training metrics");
  }
  return await res.json();
}

export function getMetricImageUrl(filename) {
  return `${API_BASE}/api/metrics/image/${encodeURIComponent(filename)}`;
}

export async function predictTool(fileOrBlob, confidence = 0.25) {
  const formData = new FormData();
  formData.append("file", fileOrBlob);

  const res = await fetch(`${API_BASE}/api/predict?confidence=${confidence}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `Inference failed with status ${res.status}` }));
    throw new Error(err.detail || "Error processing image");
  }

  return await res.json();
}
