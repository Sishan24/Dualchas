"""
Dualchas Heritage AI: Production FastAPI Application
Provides REST endpoints for:
- Deep Learning pixel-level damage segmentation
- Interactive 3D Digital Twin geometry & damage color projections
- Longitudinal temporal monitoring and change detection
- Indian Heritage Monument Registry & ASI Conservation Reports
"""
import base64
import io
import json
from pathlib import Path
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from PIL import Image

from backend import config
from src.change_detection import LongitudinalMonitor
from src.model import CLASS_NAMES, NUM_CLASSES
from src.predict import HeritagePredictor
from src.reconstruction_3d import Heritage3DReconstruction

app = FastAPI(
    title="Dualchas Heritage AI",
    description="AI-Powered Indian Monument Preservation & 3D Digital Twin Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize deep learning predictors
predictor = HeritagePredictor(checkpoint_path=config.CHECKPOINT_PATH)
longitudinal_monitor = LongitudinalMonitor(predictor=predictor)


def pil_to_base64(img: Image.Image, format="JPEG", quality=90) -> str:
    buf = io.BytesIO()
    img.save(buf, format=format, quality=quality)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "jpeg" if format == "JPEG" else "png"
    return f"data:image/{mime};base64,{encoded}"


# Registry of Pre-loaded Indian Monuments
INDIAN_MONUMENTS = [
    {
        "id": "konark_sun_temple",
        "name": "Konark Sun Temple (Surya Deula)",
        "location": "Puri, Odisha, India",
        "dynasty": "Eastern Ganga Dynasty (King Narasimhadeva I, 1250 CE)",
        "unesco_status": "UNESCO World Heritage Site (1984)",
        "material": "Khondalite & Chlorite Sandstone",
        "inspection_status": "Active Conservation Monitoring",
        "severity_level": "MODERATE",
        "primary_threats": ["Marine salt crystallization", "Bio-growth on chlorite relief", "Structural micro-fractures in Vimana"],
        "3d_twin_available": True,
        "sample_image": "konark_sun_temple_chariot_wheel.jpg",
        "coordinates": {"lat": 19.8876, "lng": 86.0945}
    },
    {
        "id": "darbhanga_fort",
        "name": "Darbhanga Raj Fort (Ram Bagh)",
        "location": "Darbhanga, Bihar, India",
        "dynasty": "Khandavala Dynasty (Maharaja Rameshwar Singh, 1934)",
        "unesco_status": "State Heritage Monument",
        "material": "Red Laterite Brick & Lime Stucco",
        "inspection_status": "High Priority Conservation",
        "severity_level": "CRITICAL",
        "primary_threats": ["Deep masonry delamination (spalling)", "Ficus tree root penetration", "Mortar washout"],
        "3d_twin_available": True,
        "sample_image": "darbhanga_fort_ram_bagh_gate.jpg",
        "coordinates": {"lat": 26.1542, "lng": 85.8918}
    },
    {
        "id": "hooghly_imambara",
        "name": "Hooghly Imambara",
        "location": "Hooghly, West Bengal, India",
        "dynasty": "Haji Muhammad Mohsin (1861 CE)",
        "unesco_status": "Protected Monument of National Importance",
        "material": "Stucco Plaster & Brick Masonry",
        "inspection_status": "Stable Periodic Survey",
        "severity_level": "LOW",
        "primary_threats": ["Monsoon rainwater seepage", "Surface efflorescence on sundial court", "Discoloration"],
        "3d_twin_available": False,
        "sample_image": "hooghly_imambara_sun_dial_courtyard.jpg",
        "coordinates": {"lat": 22.9067, "lng": 88.3967}
    },
    {
        "id": "hampi_vittala",
        "name": "Vittala Temple & Musical Pillars",
        "location": "Hampi, Bellary, Karnataka, India",
        "dynasty": "Vijayanagara Empire (Devaraya II / Krishnadevaraya, 15th C.)",
        "unesco_status": "UNESCO World Heritage Site (1986)",
        "material": "High-Grade Carved Granite",
        "inspection_status": "Acoustic Resonance & Surface Shielding",
        "severity_level": "MODERATE",
        "primary_threats": ["Tourist touch abrasion", "Thermal exfoliation of granite pillars", "Lichen encrustation"],
        "3d_twin_available": True,
        "sample_image": "hampi_vittala_musical_pillars.jpg",
        "coordinates": {"lat": 15.3350, "lng": 76.4600}
    },
    {
        "id": "rani_ki_vav",
        "name": "Rani ki Vav (Queen's Stepwell)",
        "location": "Patan, Gujarat, India",
        "dynasty": "Chaulukya Dynasty (Queen Udayamati, 1063 CE)",
        "unesco_status": "UNESCO World Heritage Site (2014)",
        "material": "Fine Dhrangadhra Yellow Sandstone",
        "inspection_status": "Subterranean Microclimate Monitoring",
        "severity_level": "STABLE",
        "primary_threats": ["Groundwater salinity capillary rise", "Fine sand abrasive scouring"],
        "3d_twin_available": True,
        "sample_image": "rani_ki_vav_stepwell_frieze.jpg",
        "coordinates": {"lat": 23.8589, "lng": 72.1014}
    }
]


@app.get("/api/health")
def health():
    return {
        "status": "online",
        "system": "Dualchas Heritage AI",
        "model_loaded": predictor.loaded,
        "device": config.DEVICE,
        "num_classes": NUM_CLASSES,
        "classes": CLASS_NAMES,
    }


@app.get("/api/monuments")
def get_monuments():
    return {"monuments": INDIAN_MONUMENTS}


@app.post("/api/predict")
async def predict_damage(
    file: UploadFile = File(...),
    alpha: float = Form(0.55),
):
    try:
        content = await file.read()
        pil_img = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Invalid image file: {str(e)}")

    if not predictor.loaded:
        # Attempt reloading in case training completed
        predictor._load_checkpoint()
        if not predictor.loaded:
            raise HTTPException(503, "Model checkpoint not ready yet. Please ensure model training has completed.")

    mask_np, overlay_pil, stats = predictor.predict_image(pil_img, alpha=alpha)

    # Encode images to Base64 for instant frontend rendering
    overlay_b64 = pil_to_base64(overlay_pil, format="JPEG")
    mask_pil = Image.fromarray(mask_np * 60) # Visual grayscale boost
    mask_b64 = pil_to_base64(mask_pil, format="PNG")
    original_b64 = pil_to_base64(pil_img, format="JPEG")

    return {
        "filename": file.filename,
        "stats": stats,
        "original_image": original_b64,
        "overlay_image": overlay_b64,
        "mask_image": mask_b64,
    }


@app.post("/api/temporal-compare")
async def temporal_compare(
    survey_a: UploadFile = File(...),
    survey_b: UploadFile = File(...),
    date_a: str = Form("2026-01-15"),
    date_b: str = Form("2026-11-14"),
):
    try:
        content_a = await survey_a.read()
        content_b = await survey_b.read()
        img_a = Image.open(io.BytesIO(content_a)).convert("RGB")
        img_b = Image.open(io.BytesIO(content_b)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Error reading survey images: {str(e)}")

    if not predictor.loaded:
        predictor._load_checkpoint()
        if not predictor.loaded:
            raise HTTPException(503, "Model checkpoint not ready.")

    diff_pil, overlay_a, overlay_b, report = longitudinal_monitor.compare_surveys(
        img_a, img_b, date_a=date_a, date_b=date_b
    )

    return {
        "report": report,
        "diff_image": pil_to_base64(diff_pil, format="JPEG"),
        "survey_a_overlay": pil_to_base64(overlay_a, format="JPEG"),
        "survey_b_overlay": pil_to_base64(overlay_b, format="JPEG"),
    }


@app.get("/api/3d-model/{monument_id}")
def get_3d_model(monument_id: str):
    json_path = config.MODELS_3D_DIR / f"{monument_id}.json"
    if not json_path.exists():
        # Fallback to konark if requested ID isn't directly on disk
        json_path = config.MODELS_3D_DIR / "konark_sun_temple.json"

    if not json_path.exists():
        raise HTTPException(404, "3D digital twin mesh not generated yet.")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


@app.get("/api/sample-image/{sample_name}")
def get_sample_image(sample_name: str):
    path = config.DATA_DIR / "samples" / sample_name
    if not path.exists():
        # Check in train images
        path = config.DATA_DIR / "train" / "images" / sample_name
    if not path.exists():
        raise HTTPException(404, "Sample image not found")

    img = Image.open(path)
    return Response(content=pil_to_base64(img), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
