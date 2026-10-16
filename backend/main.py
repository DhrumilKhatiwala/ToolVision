import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import CORS_ORIGINS
from backend.routers import predict, metrics, model_info, samples
from backend.services.inference import ToolInferenceService


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly initialize and load the YOLO model on startup
    print("[ToolVision AI] Preloading YOLO model weights on startup...")
    service = ToolInferenceService.get_instance()
    if service.is_loaded():
        print(f"[ToolVision AI] Model ready! Serving {len(service.classes)} classes.")
    else:
        print("[ToolVision AI] Warning: Model could not be preloaded on startup.")
    yield
    print("[ToolVision AI] Shutting down...")


app = FastAPI(
    title="ToolVision AI — Hand Tool Detection & Instance Segmentation API",
    description="Full-stack AI API for detecting and segmenting 18 classes of hand tools using YOLOv8n-seg.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(model_info.router)
app.include_router(predict.router)
app.include_router(metrics.router)
app.include_router(samples.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "ToolVision AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "model_info": "/api/model-info",
        "metrics": "/api/metrics",
        "samples": "/api/samples",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
