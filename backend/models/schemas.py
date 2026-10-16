from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: float = Field(..., description="Top-left x coordinate")
    y1: float = Field(..., description="Top-left y coordinate")
    x2: float = Field(..., description="Bottom-right x coordinate")
    y2: float = Field(..., description="Bottom-right y coordinate")


class SegmentationMask(BaseModel):
    points: List[List[float]] = Field(default_factory=list, description="Polygon contour points [[x, y], ...]")
    area: Optional[float] = Field(None, description="Area of the segmented polygon")


class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Class identifier")
    class_name: str = Field(..., description="Human-readable tool class name")
    confidence: float = Field(..., description="Detection confidence score (0.0 - 1.0)")
    bbox: BoundingBox = Field(..., description="Bounding box coordinates in pixels")
    mask: Optional[SegmentationMask] = Field(None, description="Segmentation polygon points if available")


class PredictionResponse(BaseModel):
    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected tools")
    total_detections: int = Field(..., description="Count of tools detected")
    image_width: int = Field(..., description="Width of original image")
    image_height: int = Field(..., description="Height of original image")
    inference_time_ms: float = Field(..., description="Inference time in milliseconds")
    annotated_image: str = Field(..., description="Base64 encoded JPEG/PNG with overlaid predictions")


class ModelInfoResponse(BaseModel):
    model_name: str
    task: str
    classes: Dict[int, str]
    num_classes: int
    weights_path: str
    device: str
    conf_threshold: float


class MetricRecord(BaseModel):
    epoch: int
    train_box_loss: Optional[float] = None
    train_seg_loss: Optional[float] = None
    train_cls_loss: Optional[float] = None
    val_box_loss: Optional[float] = None
    val_seg_loss: Optional[float] = None
    val_cls_loss: Optional[float] = None
    metrics_precision_b: Optional[float] = None
    metrics_recall_b: Optional[float] = None
    metrics_mAP50_b: Optional[float] = None
    metrics_mAP50_95_b: Optional[float] = None
    metrics_precision_m: Optional[float] = None
    metrics_recall_m: Optional[float] = None
    metrics_mAP50_m: Optional[float] = None
    metrics_mAP50_95_m: Optional[float] = None


class MetricsResponse(BaseModel):
    records: List[MetricRecord]
    best_map50: float
    best_map50_95: float
    final_epoch: int
    evaluation_images: List[str] = Field(default_factory=list, description="Available evaluation image filenames")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    version: str = "1.0.0"
