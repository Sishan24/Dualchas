"""
Dualchas Heritage AI: Model Training Pipeline
Trains U-Net on heritage damage segmentation contract with:
- Combined Weighted Cross-Entropy + Multiclass Soft Dice Loss
- Cosine Annealing Learning Rate Schedule
- Regularization (Weight decay 1e-4, Dropout2d, Spatial & Photometric Augmentation)
- Strict best checkpoint tracking on Validation IoU (~75% target, no overfitting)
"""
from pathlib import Path
import random
import sys
import time

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from tqdm import tqdm
import torch
from torch.utils.data import DataLoader

from src.dataset import HeritageDataset
from src.model import HeritageUNet, CombinedLoss, calculate_iou, NUM_CLASSES, CLASS_NAMES

ROOT = Path("data")
ARTIFACTS_DIR = Path("artifacts")
CHECKPOINT_PATH = ARTIFACTS_DIR / "heritage_unet.pth"

IMAGE_SIZE = 256
BATCH_SIZE = 4
EPOCHS = 18
LEARNING_RATE = 2.5e-4
WEIGHT_DECAY = 1e-4
SEED = 42
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def evaluate(model, val_loader, criterion):
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, masks, _ in val_loader:
            images = images.to(DEVICE)
            masks = masks.to(DEVICE)

            logits = model(images)
            loss = criterion(logits, masks)
            total_loss += loss.item()

            preds = logits.argmax(dim=1)
            all_preds.append(preds.cpu())
            all_targets.append(masks.cpu())

    all_preds = torch.cat(all_preds, dim=0)
    all_targets = torch.cat(all_targets, dim=0)
    ious, mean_iou = calculate_iou(all_preds, all_targets, num_classes=NUM_CLASSES)
    avg_loss = total_loss / max(len(val_loader), 1)

    return avg_loss, ious, mean_iou


def train(epochs=EPOCHS, lr=LEARNING_RATE, batch_size=BATCH_SIZE, img_size=IMAGE_SIZE):
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(SEED)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"==================================================")
    print(f"DUALCHAS HERITAGE AI: TRAINING RESNET-34 U-NET")
    print(f"Device: {DEVICE} | Resolution: {img_size}x{img_size} | Epochs: {epochs}")
    print(f"==================================================")

    train_ds = HeritageDataset("data", split="train", image_size=img_size, augment=True)
    val_ds = HeritageDataset("data", split="val", image_size=img_size, augment=False)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    model = HeritageUNet(num_classes=NUM_CLASSES, pretrained=True, dropout=0.2).to(DEVICE)
    criterion = CombinedLoss(ce_weight=1.0, dice_weight=1.2).to(DEVICE)

    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    best_mean_iou = 0.0
    metrics_history = []

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0

        for images, masks, _ in train_loader:
            images = images.to(DEVICE)
            masks = masks.to(DEVICE)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            running_loss += loss.item()

        scheduler.step()
        train_loss = running_loss / max(len(train_loader), 1)
        val_loss, ious, mean_iou = evaluate(model, val_loader, criterion)

        crack_iou = ious[1] if not np.isnan(ious[1]) else 0.0
        spall_iou = ious[2] if not np.isnan(ious[2]) else 0.0
        veg_iou = ious[3] if not np.isnan(ious[3]) else 0.0
        ero_iou = ious[4] if not np.isnan(ious[4]) else 0.0

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Mean IoU: {mean_iou*100:.2f}% | "
            f"Crack: {crack_iou*100:.1f}% | Spall: {spall_iou*100:.1f}% | "
            f"Veg: {veg_iou*100:.1f}% | Ero: {ero_iou*100:.1f}%"
        )

        metrics_history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "val_loss": val_loss,
            "mean_iou": mean_iou,
            "crack_iou": crack_iou,
            "spall_iou": spall_iou,
            "veg_iou": veg_iou,
            "ero_iou": ero_iou,
        })

        if mean_iou > best_mean_iou:
            best_mean_iou = mean_iou
            torch.save({
                "model_state": model.state_dict(),
                "num_classes": NUM_CLASSES,
                "classes": CLASS_NAMES,
                "image_size": img_size,
                "mean_iou": mean_iou,
                "crack_iou": crack_iou,
                "epoch": epoch,
                "val_loss": val_loss,
                "encoder": "resnet34",
                "seed": SEED,
            }, CHECKPOINT_PATH)
            print(f"  >>> Checkpoint Saved with Best Mean IoU: {mean_iou*100:.2f}%")

    elapsed = time.time() - start_time
    print("==================================================")
    print(f"Training Complete in {elapsed:.1f}s. Peak Validation Mean IoU: {best_mean_iou*100:.2f}%")
    print(f"Model saved to: {CHECKPOINT_PATH}")
    print("==================================================")
    return best_mean_iou


if __name__ == "__main__":
    train()
