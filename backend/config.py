"""
Configuration for the ToolVision AI backend.
All paths are relative to the project root for portability.
"""

import os
from pathlib import Path

# --- Paths ---
# Backend directory (where this file lives)
BACKEND_DIR = Path(__file__).resolve().parent

# Project root (one level up from backend/)
PROJECT_ROOT = BACKEND_DIR.parent

# Model weights path (prefers ONNX for ultra-low latency & low memory, falls back to .pt)
ONNX_WEIGHTS_PATH = BACKEND_DIR / "weights" / "best.onnx"
PT_WEIGHTS_PATH = BACKEND_DIR / "weights" / "best.pt"
MODEL_WEIGHTS_PATH = ONNX_WEIGHTS_PATH if ONNX_WEIGHTS_PATH.exists() else PT_WEIGHTS_PATH

# Training & Evaluation artifacts directory (in training/)
TRAINING_DIR = PROJECT_ROOT / "training"
EVAL_RESULTS_DIR = (
    TRAINING_DIR / "evaluation_results_on_modified_dataset"
    if (TRAINING_DIR / "evaluation_results_on_modified_dataset").exists()
    else PROJECT_ROOT / "evaluation_results_on_modified_dataset"
)
TRAIN_RESULTS_DIR = EVAL_RESULTS_DIR / "runs" / "segment" / "train-modified"
RESULTS_CSV_PATH = TRAIN_RESULTS_DIR / "results.csv"
ARGS_YAML_PATH = TRAIN_RESULTS_DIR / "args.yaml"
# Benchmark sample images directory
SAMPLES_DIR = BACKEND_DIR / "samples"

# --- Upload Constraints ---
MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# --- Inference ---
# Confidence threshold for detections
CONFIDENCE_THRESHOLD = 0.25

# Maximum image dimension (resize if larger)
MAX_IMAGE_DIMENSION = 1920

# --- CORS ---
# Allowed origins for development
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
