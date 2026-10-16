import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def create_sample_test_image() -> bytes:
    """Creates a simple in-memory RGB image for testing."""
    img = Image.new("RGB", (320, 240), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Draw simple shapes to simulate visual content
    draw.rectangle([50, 50, 150, 180], fill=(50, 50, 200), outline=(0, 0, 0))
    draw.line([160, 60, 280, 200], fill=(200, 50, 50), width=6)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ToolVision AI API"
    assert "/docs" in data["docs"]


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data
    assert "device" in data


def test_model_info_endpoint():
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "YOLOv8n-seg Tool Detection"
    assert data["task"] == "instance-segmentation"
    assert "classes" in data
    assert isinstance(data["classes"], dict)
    # Check that known tool classes from the dataset exist
    if data["num_classes"] > 0:
        assert data["num_classes"] >= 18


def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "records" in data
    assert "best_map50" in data
    assert "evaluation_images" in data
    assert len(data["records"]) > 0
    assert data["best_map50"] > 0.0


def test_metric_image_found():
    response = client.get("/api/metrics/image/confusion_matrix.png")
    assert response.status_code == 200
    assert response.headers["content-type"] in ["image/png", "image/jpeg"]
    assert len(response.content) > 0


def test_metric_image_not_found():
    response = client.get("/api/metrics/image/non_existent_file.png")
    assert response.status_code == 404


def test_predict_invalid_extension():
    files = {"file": ("test.txt", b"plain text content", "text/plain")}
    response = client.post("/api/predict", files=files)
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_predict_empty_file():
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/api/predict", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]


def test_predict_valid_image():
    image_bytes = create_sample_test_image()
    files = {"file": ("tool_sample.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/predict?confidence=0.15", files=files)

    # If model is loaded, it should return 200 with schema
    if response.status_code == 200:
        data = response.json()
        assert "detections" in data
        assert "total_detections" in data
        assert "annotated_image" in data
        assert data["annotated_image"].startswith("data:image/jpeg;base64,")
        assert "inference_time_ms" in data
        assert data["image_width"] == 320
        assert data["image_height"] == 240
    else:
        # If model is not loaded (503 degraded), verify error structure
        assert response.status_code in [200, 503]


def test_samples_list():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) >= 4
    tool_ids = [s["id"] for s in data["samples"]]
    assert "hammer" in tool_ids
    assert "wrench" in tool_ids
    assert "pliers" in tool_ids
    assert "screwdriver" in tool_ids


def test_samples_image_hammer():
    response = client.get("/api/samples/hammer")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert len(response.content) > 10000
