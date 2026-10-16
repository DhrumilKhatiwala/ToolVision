import { predictToolOnnx } from "./onnxInference";
import { STATIC_METRICS, STATIC_MODEL_INFO } from "../data/staticData";

export async function checkHealth() {
  return {
    status: "client_onnx",
    model_loaded: true,
    device: "WebAssembly (Browser)",
    engine: "ONNX Runtime Web",
    note: "Running in-browser client inference with static analytics",
  };
}

export async function fetchModelInfo() {
  return STATIC_MODEL_INFO;
}

export async function fetchMetrics() {
  return STATIC_METRICS;
}

export function getMetricImageUrl(filename) {
  // Always load evaluation charts and images directly from fast static assets
  return `/eval_results/${encodeURIComponent(filename)}`;
}

export async function predictTool(fileOrBlob, confidence = 0.25) {
  // Fast In-Browser ONNX Runtime Web inference (~100ms) with zero cloud cold-starts
  return await predictToolOnnx(fileOrBlob, confidence);
}

