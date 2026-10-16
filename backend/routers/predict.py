import os
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from backend.config import (
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_CONTENT_TYPES,
    ALLOWED_EXTENSIONS,
    CONFIDENCE_THRESHOLD,
)
from backend.models.schemas import PredictionResponse
from backend.services.inference import ToolInferenceService

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Detect and segment hand tools in an uploaded image",
    description="Upload an image (JPEG, PNG, or WEBP up to 10MB) to detect and segment hand tools using YOLOv8n-seg.",
)
async def predict_tool(
    file: UploadFile = File(...),
    confidence: float = Query(
        default=CONFIDENCE_THRESHOLD,
        ge=0.01,
        le=1.0,
        description="Confidence threshold for detections (0.01 to 1.0)",
    ),
):
    # Validate extension
    filename = file.filename or "uploaded_image.jpg"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Validate content type if provided
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    # Read content and validate size
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read image stream: {str(e)}",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    service = ToolInferenceService.get_instance()
    if not service.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference model is currently not available. Please verify model weights.",
        )

    try:
        result = service.predict(content, conf_thresh=confidence)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid image file: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )
