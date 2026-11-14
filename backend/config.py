"""
Dualchas Heritage AI: Backend Configuration
"""
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
CHECKPOINT_PATH = ARTIFACTS_DIR / "heritage_unet.pth"
DATA_DIR = BASE_DIR / "data"
MODELS_3D_DIR = ARTIFACTS_DIR / "3d"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
