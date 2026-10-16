from fastapi import APIRouter
from backend.models.schemas import ModelInfoResponse, HealthResponse
from backend.services.inference import ToolInferenceService

router = APIRouter(prefix="/api", tags=["Model & Health"])


@router.get("/model-info", response_model=ModelInfoResponse, summary="Get metadata and class list of the model")
async def get_model_info():
    """Returns model architecture name, task type, number of classes, class dictionary, and inference device."""
    service = ToolInferenceService.get_instance()
    return service.get_model_info()


@router.get("/health", response_model=HealthResponse, summary="Health check endpoint")
async def health_check():
    """Returns application health and model readiness status."""
    service = ToolInferenceService.get_instance()
    return HealthResponse(
        status="healthy" if service.is_loaded() else "degraded",
        model_loaded=service.is_loaded(),
        device=service.device,
        version="1.0.0",
    )
