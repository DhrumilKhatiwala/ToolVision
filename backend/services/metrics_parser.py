import csv
from pathlib import Path
from typing import Dict, Any, List
from backend.config import RESULTS_CSV_PATH, TRAIN_RESULTS_DIR
from backend.models.schemas import MetricRecord, MetricsResponse


def parse_metrics_csv() -> MetricsResponse:
    """
    Parses results.csv generated during YOLOv8 training.
    Returns structured metric records and summary statistics.
    """
    records: List[MetricRecord] = []
    best_map50 = 0.0
    best_map50_95 = 0.0
    final_epoch = 0

    if RESULTS_CSV_PATH.exists():
        with open(RESULTS_CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Strip keys and values of any stray whitespace
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                
                try:
                    epoch = int(clean_row.get("epoch", 0))
                    
                    def safe_float(key: str) -> float | None:
                        val = clean_row.get(key)
                        if val is not None and val != "":
                            return round(float(val), 5)
                        return None

                    map50_b = safe_float("metrics/mAP50(B)") or 0.0
                    map50_m = safe_float("metrics/mAP50(M)") or 0.0
                    map50 = max(map50_b, map50_m)

                    map50_95_b = safe_float("metrics/mAP50-95(B)") or 0.0
                    map50_95_m = safe_float("metrics/mAP50-95(M)") or 0.0
                    map50_95 = max(map50_95_b, map50_95_m)

                    if map50 > best_map50:
                        best_map50 = map50
                    if map50_95 > best_map50_95:
                        best_map50_95 = map50_95
                    final_epoch = max(final_epoch, epoch)

                    records.append(
                        MetricRecord(
                            epoch=epoch,
                            train_box_loss=safe_float("train/box_loss"),
                            train_seg_loss=safe_float("train/seg_loss"),
                            train_cls_loss=safe_float("train/cls_loss"),
                            val_box_loss=safe_float("val/box_loss"),
                            val_seg_loss=safe_float("val/seg_loss"),
                            val_cls_loss=safe_float("val/cls_loss"),
                            metrics_precision_b=safe_float("metrics/precision(B)"),
                            metrics_recall_b=safe_float("metrics/recall(B)"),
                            metrics_mAP50_b=safe_float("metrics/mAP50(B)"),
                            metrics_mAP50_95_b=safe_float("metrics/mAP50-95(B)"),
                            metrics_precision_m=safe_float("metrics/precision(M)"),
                            metrics_recall_m=safe_float("metrics/recall(M)"),
                            metrics_mAP50_m=safe_float("metrics/mAP50(M)"),
                            metrics_mAP50_95_m=safe_float("metrics/mAP50-95(M)"),
                        )
                    )
                except (ValueError, KeyError):
                    continue

    # Find available evaluation chart images in TRAIN_RESULTS_DIR
    eval_images = []
    if TRAIN_RESULTS_DIR.exists():
        chart_names = [
            "confusion_matrix.png",
            "confusion_matrix_normalized.png",
            "results.png",
            "BoxF1_curve.png",
            "BoxPR_curve.png",
            "MaskF1_curve.png",
            "MaskPR_curve.png",
            "val_batch0_pred.jpg",
            "val_batch1_pred.jpg",
            "val_batch2_pred.jpg",
        ]
        for name in chart_names:
            if (TRAIN_RESULTS_DIR / name).exists():
                eval_images.append(name)

    return MetricsResponse(
        records=records,
        best_map50=round(best_map50, 4),
        best_map50_95=round(best_map50_95, 4),
        final_epoch=final_epoch,
        evaluation_images=eval_images,
    )
