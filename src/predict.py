"""
Dualchas Heritage AI: Inference & Diagnostic Overlay Engine
Loads trained HeritageUNet checkpoint, predicts pixel-level deterioration,
generates color-coded conservation overlays, calculates surface damage percentages,
and computes structural risk scores with actionable restoration guidance.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image
import torch
import torchvision.transforms.functional as TF

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.model import HeritageUNet, CLASS_NAMES, CLASS_COLORS, NUM_CLASSES

DEFAULT_CHECKPOINT = PROJECT_ROOT / "artifacts" / "heritage_unet.pth"
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Conservation color palette for overlay:
# 0: None, 1: Red/Crack, 2: Amber/Spall, 3: Green/Veg, 4: Blue/Erosion
PALETTE = np.array([
    [0, 0, 0],
    [239, 68, 68],
    [245, 158, 11],
    [16, 185, 129],
    [59, 130, 246],
], dtype=np.uint8)


class HeritagePredictor:
    def __init__(self, checkpoint_path=DEFAULT_CHECKPOINT, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.checkpoint_path = Path(checkpoint_path)
        self.model = None
        self.image_size = 512
        self.loaded = False

        if self.checkpoint_path.exists():
            self._load_checkpoint()

    def _load_checkpoint(self):
        ckpt = torch.load(self.checkpoint_path, map_location=self.device)
        self.image_size = ckpt.get("image_size", 512)
        self.model = HeritageUNet(num_classes=ckpt.get("num_classes", NUM_CLASSES), pretrained=False)
        self.model.load_state_dict(ckpt["model_state"])
        self.model.to(self.device)
        self.model.eval()
        self.loaded = True

    @torch.no_grad()
    def predict_image(self, pil_image, alpha=0.55):
        """
        Runs inference on a PIL image.
        Returns:
            - mask_np (H, W uint8): class IDs
            - overlay_pil: original image with color overlays on damage pixels
            - stats: class percentage breakdown and conservation risk score
        """
        if not self.loaded:
            raise RuntimeError(f"Model checkpoint not found at {self.checkpoint_path}. Train the model first.")

        orig_w, orig_h = pil_image.size
        # Resize to model input size
        resized = TF.resize(pil_image.convert("RGB"), [self.image_size, self.image_size], interpolation=TF.InterpolationMode.BILINEAR)
        tensor = TF.to_tensor(resized)
        tensor = TF.normalize(tensor, mean=IMAGENET_MEAN, std=IMAGENET_STD).unsqueeze(0).to(self.device)

        logits = self.model(tensor)
        probs = torch.softmax(logits, dim=1)
        pred_mask = probs.argmax(dim=1)[0].cpu().numpy().astype(np.uint8)

        # Upscale mask back to original resolution
        mask_pil = Image.fromarray(pred_mask, mode="L").resize((orig_w, orig_h), Image.Resampling.NEAREST)
        mask_np = np.array(mask_pil)

        # Create overlay
        orig_np = np.array(pil_image.convert("RGB"))
        overlay_np = orig_np.copy()
        damaged = mask_np > 0

        if np.any(damaged):
            color_mask = PALETTE[mask_np]
            overlay_np[damaged] = (
                (1.0 - alpha) * orig_np[damaged] + alpha * color_mask[damaged]
            ).astype(np.uint8)

        overlay_pil = Image.fromarray(overlay_np)

        # Statistical analysis
        total_pixels = mask_np.size
        breakdown = {}
        for c_id, name in enumerate(CLASS_NAMES):
            cnt = int((mask_np == c_id).sum())
            pct = round(100.0 * cnt / total_pixels, 2)
            breakdown[name.lower()] = {
                "id": c_id,
                "label": name,
                "count": cnt,
                "percentage": pct,
                "color": CLASS_COLORS[c_id]
            }

        # Severity index (Weighted formula based on structural impact)
        # Cracks: weight 4.0, Spalling: weight 3.0, Vegetation: weight 2.0, Erosion: weight 1.5
        crack_pct = breakdown["crack"]["percentage"]
        spall_pct = breakdown["spalling"]["percentage"]
        veg_pct = breakdown["vegetation"]["percentage"]
        ero_pct = breakdown["erosion"]["percentage"]

        raw_score = (crack_pct * 4.0 + spall_pct * 3.0 + veg_pct * 2.0 + ero_pct * 1.5)
        severity_index = min(10.0, round(raw_score / 2.5, 1))

        # Heritage Conservation Guidance
        recommendations = []
        if crack_pct > 2.0:
            recommendations.append("URGENT: Structural fracture detected. Schedule acoustic pulse testing and lime-mortar grouting.")
        elif crack_pct > 0.5:
            recommendations.append("MONITOR: Active surface cracking detected. Install tell-tale glass crack monitors.")

        if spall_pct > 3.0:
            recommendations.append("STRUCTURAL INTERVENTION: Detached masonry layers require stone consolidation and stainless-steel dowel pinning.")

        if veg_pct > 4.0:
            recommendations.append("BIOCIDE TREATMENT: Clinging vegetation/roots require biocidal cleansing (zinc silicofluoride) to halt root wedging.")

        if ero_pct > 5.0:
            recommendations.append("WEATHERING PROTECTION: Salt efflorescence or wind scour requires sacrificial lime wash or breathable silane treatment.")

        if not recommendations:
            recommendations.append("HEALTHY STATUS: Masonry is in stable condition. Continue annual photogrammetric monitoring.")

        stats = {
            "total_pixels": total_pixels,
            "damaged_pixels": int(damaged.sum()),
            "damage_percentage": round(100.0 * damaged.sum() / total_pixels, 2),
            "severity_index": severity_index,
            "classes": breakdown,
            "recommendations": recommendations,
        }

        return mask_np, overlay_pil, stats


def predict(image_path, output_dir="artifacts/predictions"):
    predictor = HeritagePredictor()
    img = Image.open(image_path)
    mask, overlay, stats = predictor.predict_image(img)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    stem = Path(image_path).stem

    Image.fromarray(mask).save(out / f"{stem}_mask.png")
    overlay.save(out / f"{stem}_overlay.jpg", quality=95)
    print(f"Predictions saved for {image_path}:")
    print(f"  Damage: {stats['damage_percentage']}% | Severity Index: {stats['severity_index']}/10")
    return stats


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("image", help="Path to photograph of monument")
    args = parser.parse_args()
    predict(args.image)
