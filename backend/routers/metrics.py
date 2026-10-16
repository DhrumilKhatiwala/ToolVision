import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.config import TRAIN_RESULTS_DIR
from backend.models.schemas import MetricsResponse
from backend.services.metrics_parser import parse_metrics_csv

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])


@router.get("", response_model=MetricsResponse, summary="Retrieve training metrics and evaluation history")
async def get_metrics():
    """Returns training loss curves, mAP metrics, and available evaluation artifacts."""
    return parse_metrics_csv()


@router.get("/image/{filename}", summary="Get evaluation chart or validation prediction image")
async def get_metric_image(filename: str):
    """Safely serves evaluation images (e.g. confusion matrix, loss curves, validation batch predictions)."""
    # Prevent directory traversal
    safe_filename = os.path.basename(filename)
    image_path = TRAIN_RESULTS_DIR / safe_filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation image '{safe_filename}' not found.",
        )

    # Determine media type
    ext = os.path.splitext(safe_filename)[1].lower()
    media_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(path=str(image_path), media_type=media_type)
