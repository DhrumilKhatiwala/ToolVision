import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.config import SAMPLES_DIR

router = APIRouter(prefix="/api/samples", tags=["Evaluation Samples"])

SAMPLE_TOOLS = {
    "hammer": "sample_hammer.jpg",
    "wrench": "sample_wrench.jpg",
    "pliers": "sample_pliers.jpg",
    "screwdriver": "sample_screwdriver.jpg",
}


@router.get("", summary="List available benchmark tool samples")
async def list_samples():
    """Returns metadata for available benchmark evaluation tool samples."""
    samples = []
    for key, filename in SAMPLE_TOOLS.items():
        file_path = SAMPLES_DIR / filename
        if file_path.exists():
            samples.append({
                "id": key,
                "label": key.capitalize(),
                "filename": filename,
                "url": f"/api/samples/{key}",
                "size_bytes": os.path.getsize(file_path),
            })
    return {"samples": samples}


@router.get("/{tool_name}", summary="Get benchmark evaluation tool sample image")
async def get_sample_image(tool_name: str):
    """Streams the real benchmark image file for the given tool."""
    tool_key = tool_name.lower().replace("sample_", "").replace(".jpg", "")
    filename = SAMPLE_TOOLS.get(tool_key)

    if not filename:
        # Fallback to direct filename match
        filename = f"sample_{tool_key}.jpg" if not tool_key.endswith(".jpg") else tool_key

    image_path = SAMPLES_DIR / filename
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Benchmark sample for '{tool_name}' not found.",
        )

    return FileResponse(path=str(image_path), media_type="image/jpeg")
