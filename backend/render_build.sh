#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Upgrading pip..."
pip install --upgrade pip

echo "==> Installing lightweight CPU-only PyTorch (avoids 2.8GB CUDA download & Render memory limits)..."
pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo "==> Installing remaining dependencies..."
pip install --no-cache-dir -r backend/requirements.txt

echo "==> Build complete!"
