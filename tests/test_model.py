import torch
from pathlib import Path
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.model import HeritageUNet, CombinedLoss, calculate_iou, NUM_CLASSES, CLASS_NAMES


def test_heritage_unet_forward():
    model = HeritageUNet(num_classes=NUM_CLASSES, pretrained=False)
    x = torch.randn(2, 3, 256, 256)
    out = model(x)
    assert out.shape == (2, NUM_CLASSES, 256, 256), f"Unexpected shape {out.shape}"


def test_combined_loss():
    criterion = CombinedLoss(ce_weight=1.0, dice_weight=1.0)
    logits = torch.randn(2, NUM_CLASSES, 128, 128)
    targets = torch.randint(0, NUM_CLASSES, (2, 128, 128))
    loss = criterion(logits, targets)
    assert loss.item() > 0.0
    assert not torch.isnan(loss)


def test_calculate_iou():
    preds = torch.tensor([0, 1, 1, 2, 3, 4])
    targets = torch.tensor([0, 1, 0, 2, 3, 4])
    ious, mean_iou = calculate_iou(preds, targets, num_classes=NUM_CLASSES)
    assert len(ious) == NUM_CLASSES
    assert 0.0 <= mean_iou <= 1.0
