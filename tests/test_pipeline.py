from pathlib import Path
import sys
import numpy as np
from PIL import Image
import pytest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.predict import HeritagePredictor
from src.reconstruction_3d import Heritage3DReconstruction
from src.change_detection import LongitudinalMonitor


def test_predictor_inference():
    ckpt_path = PROJECT_ROOT / "artifacts" / "heritage_unet.pth"
    if not ckpt_path.exists():
        pytest.skip("Model checkpoint not found")

    predictor = HeritagePredictor(checkpoint_path=ckpt_path)
    assert predictor.loaded

    test_img = Image.new("RGB", (256, 256), color=(180, 140, 100))
    mask, overlay, stats = predictor.predict_image(test_img)

    assert mask.shape == (256, 256)
    assert overlay.size == (256, 256)
    assert "severity_index" in stats
    assert "classes" in stats
    assert len(stats["recommendations"]) > 0


def test_3d_reconstruction_mesh():
    reconstructor = Heritage3DReconstruction("konark_sun_temple")
    mesh = reconstructor.generate_monument_mesh(monument_type="temple", resolution=16)

    assert len(mesh["vertices"]) > 0
    assert len(mesh["faces"]) > 0
    assert len(mesh["normals"]) == len(mesh["vertices"])

    # Test damage projection
    dummy_mask = np.zeros((128, 128), dtype=np.uint8)
    dummy_mask[40:80, 40:80] = 1 # crack
    reconstructor.project_damage_to_mesh(mesh, dummy_mask)
    assert "damage_annotations" in mesh


def test_longitudinal_change_detection():
    ckpt_path = PROJECT_ROOT / "artifacts" / "heritage_unet.pth"
    if not ckpt_path.exists():
        pytest.skip("Model checkpoint not found")

    predictor = HeritagePredictor(checkpoint_path=ckpt_path)
    monitor = LongitudinalMonitor(predictor=predictor)

    img_a = Image.new("RGB", (256, 256), color=(180, 140, 100))
    img_b = Image.new("RGB", (256, 256), color=(185, 145, 105))

    diff_pil, overlay_a, overlay_b, report = monitor.compare_surveys(img_a, img_b)

    assert diff_pil.size == (256, 256)
    assert "conservation_status" in report
    assert "urgency_level" in report
