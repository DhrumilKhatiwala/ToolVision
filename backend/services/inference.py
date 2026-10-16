import base64
import io
import time
from typing import List, Tuple, Dict, Any, Optional
from PIL import Image
import numpy as np

from backend.config import MODEL_WEIGHTS_PATH, CONFIDENCE_THRESHOLD, MAX_IMAGE_DIMENSION
from backend.models.schemas import (
    DetectionItem,
    BoundingBox,
    SegmentationMask,
    PredictionResponse,
    ModelInfoResponse,
)


class ToolInferenceService:
    _instance: Optional["ToolInferenceService"] = None

    def __init__(self):
        self.model = None
        self.classes: Dict[int, str] = {}
        self.device = "cpu"
        self._load_model()

    @classmethod
    def get_instance(cls) -> "ToolInferenceService":
        if cls._instance is None:
            cls._instance = ToolInferenceService()
        return cls._instance

    def _load_model(self):
        try:
            import torch
            from ultralytics import YOLO

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            if self.device == "cpu":
                torch.set_num_threads(1)
            if MODEL_WEIGHTS_PATH.exists():
                print(f"[ToolVision] Loading YOLOv8 model from {MODEL_WEIGHTS_PATH} onto {self.device}...")
                task_param = "segment" if str(MODEL_WEIGHTS_PATH).endswith(".onnx") else None
                self.model = YOLO(str(MODEL_WEIGHTS_PATH), task=task_param)
                self.classes = getattr(self.model, "names", {})
                print(f"[ToolVision] Model loaded successfully! {len(self.classes)} classes found.")
            else:
                print(f"[ToolVision] Warning: Weights not found at {MODEL_WEIGHTS_PATH}")
                self.model = None
        except Exception as e:
            print(f"[ToolVision] Error loading model: {e}")
            self.model = None

    def is_loaded(self) -> bool:
        return self.model is not None

    def get_model_info(self) -> ModelInfoResponse:
        return ModelInfoResponse(
            model_name="YOLOv8n-seg Tool Detection",
            task="instance-segmentation",
            classes=self.classes if self.classes else {},
            num_classes=len(self.classes),
            weights_path=str(MODEL_WEIGHTS_PATH),
            device=self.device,
            conf_threshold=CONFIDENCE_THRESHOLD,
        )

    def predict(self, image_bytes: bytes, conf_thresh: Optional[float] = None) -> PredictionResponse:
        if not self.is_loaded():
            raise RuntimeError("YOLO model weights are not loaded. Ensure best.pt is present in backend/weights/.")

        threshold = conf_thresh if conf_thresh is not None else CONFIDENCE_THRESHOLD

        # Read image
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image format: {e}")

        orig_w, orig_h = image.size

        # Optimize image dimension for low-resource cloud CPUs (max 800px)
        max_dim = 800
        if max(orig_w, orig_h) > max_dim:
            scale = max_dim / max(orig_w, orig_h)
            new_w, new_h = int(orig_w * scale), int(orig_h * scale)
            image = image.resize((new_w, new_h), Image.Resampling.BILINEAR)
            cur_w, cur_h = new_w, new_h
        else:
            cur_w, cur_h = orig_w, orig_h

        # Run inference strictly at standard 640x640 with retina_masks=False to avoid CPU throttling
        start_time = time.perf_counter()
        results = self.model.predict(
            source=image,
            conf=threshold,
            device=self.device,
            imgsz=640,
            retina_masks=False,
            verbose=False,
        )
        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        result = results[0]
        detections: List[DetectionItem] = []

        boxes = getattr(result, "boxes", None)
        masks = getattr(result, "masks", None)

        if boxes is not None and len(boxes) > 0:
            box_data = boxes.data.cpu().numpy()  # [x1, y1, x2, y2, conf, cls]
            polygon_points_list = []

            if masks is not None and masks.xy is not None:
                # masks.xy is a list of np.ndarray of shape (N, 2)
                for poly in masks.xy:
                    polygon_points_list.append(poly.tolist())

            for i, row in enumerate(box_data):
                x1, y1, x2, y2, conf, cls_idx = row[:6]
                cls_id = int(cls_idx)
                class_name = self.classes.get(cls_id, f"Tool-{cls_id}")

                seg_mask = None
                if i < len(polygon_points_list):
                    poly_points = polygon_points_list[i]
                    if len(poly_points) > 0:
                        seg_mask = SegmentationMask(points=poly_points)

                detections.append(
                    DetectionItem(
                        class_id=cls_id,
                        class_name=class_name,
                        confidence=round(float(conf), 4),
                        bbox=BoundingBox(
                            x1=round(float(x1), 2),
                            y1=round(float(y1), 2),
                            x2=round(float(x2), 2),
                            y2=round(float(y2), 2),
                        ),
                        mask=seg_mask,
                    )
                )

        # Generate annotated image
        annotated_bgr = result.plot()  # numpy array in BGR
        annotated_rgb = annotated_bgr[..., ::-1]  # Convert BGR to RGB
        annotated_pil = Image.fromarray(annotated_rgb)

        buffered = io.BytesIO()
        annotated_pil.save(buffered, format="JPEG", quality=90)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        annotated_base64 = f"data:image/jpeg;base64,{img_str}"

        return PredictionResponse(
            detections=detections,
            total_detections=len(detections),
            image_width=cur_w,
            image_height=cur_h,
            inference_time_ms=inference_time_ms,
            annotated_image=annotated_base64,
        )


inference_service = ToolInferenceService.get_instance()
