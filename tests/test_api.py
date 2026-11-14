from pathlib import Path
import sys
import io
from PIL import Image
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["num_classes"] == 5


def test_api_monuments():
    res = client.get("/api/monuments")
    assert res.status_code == 200
    data = res.json()
    assert len(data["monuments"]) >= 5
    assert any(m["id"] == "konark_sun_temple" for m in data["monuments"])


def test_api_3d_model():
    res = client.get("/api/3d-model/konark_sun_temple")
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert "attributes" in data["data"]


def test_api_predict():
    img = Image.new("RGB", (128, 128), color=(200, 150, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    res = client.post(
        "/api/predict",
        files={"file": ("test.jpg", buf, "image/jpeg")},
        data={"alpha": "0.55"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    assert "overlay_image" in data
    assert "mask_image" in data
