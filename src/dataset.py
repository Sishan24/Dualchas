"""
Dualchas Heritage AI: Dataset & Augmentation Pipeline
Loads paired heritage photographs and single-channel class-ID masks.
Ensures identical spatial transformations on images and masks to prevent label corruption.
"""
from pathlib import Path
import random
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import torch
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF

from src.model import NUM_CLASSES

DEFAULT_SIZE = 512
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


class HeritageDataset(Dataset):
    """
    Contract:
      Images: data/{split}/images/*.jpg (or .png)
      Masks:  data/{split}/masks/*.png (single channel uint8 with pixel values 0..4)
    """
    def __init__(self, data_root="data", split="train", image_size=DEFAULT_SIZE, augment=True):
        self.root = Path(data_root)
        self.split = split
        self.image_size = image_size
        self.augment = augment and (split == "train")

        self.images_dir = self.root / split / "images"
        self.masks_dir = self.root / split / "masks"

        if not self.images_dir.exists():
            raise FileNotFoundError(f"Images directory not found: {self.images_dir}")

        self.images = sorted(
            p for p in self.images_dir.iterdir()
            if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )

        if not self.images:
            raise RuntimeError(f"No images found in {self.images_dir}")

        # Check mask existence
        missing = [p.name for p in self.images if not (self.masks_dir / f"{p.stem}.png").exists()]
        if missing:
            raise RuntimeError(f"Missing masks for: {missing[:5]}")

    def __len__(self):
        return len(self.images)

    def __getitem__(self, index):
        image_path = self.images[index]
        mask_path = self.masks_dir / f"{image_path.stem}.png"

        image = Image.open(image_path).convert("RGB")
        mask = Image.open(mask_path)

        # High-quality resize
        image = TF.resize(
            image, [self.image_size, self.image_size],
            interpolation=TF.InterpolationMode.BILINEAR
        )
        mask = TF.resize(
            mask, [self.image_size, self.image_size],
            interpolation=TF.InterpolationMode.NEAREST
        )

        # Robust Data Augmentation to prevent overfitting
        if self.augment:
            # 1. Random Horizontal & Vertical Flips
            if random.random() < 0.5:
                image = TF.hflip(image)
                mask = TF.hflip(mask)
            if random.random() < 0.5:
                image = TF.vflip(image)
                mask = TF.vflip(mask)

            # 2. Random Rotation (small angles for architectural integrity)
            if random.random() < 0.4:
                angle = random.uniform(-15.0, 15.0)
                image = TF.rotate(image, angle, interpolation=TF.InterpolationMode.BILINEAR)
                mask = TF.rotate(mask, angle, interpolation=TF.InterpolationMode.NEAREST)

            # 3. Photometric Jitter (Image only, masks unchanged)
            if random.random() < 0.5:
                enh_b = ImageEnhance.Brightness(image)
                image = enh_b.enhance(random.uniform(0.85, 1.15))
            if random.random() < 0.5:
                enh_c = ImageEnhance.Contrast(image)
                image = enh_c.enhance(random.uniform(0.85, 1.15))

        # Convert to tensors
        image_tensor = TF.to_tensor(image)
        image_tensor = TF.normalize(image_tensor, mean=IMAGENET_MEAN, std=IMAGENET_STD)

        mask_np = np.array(mask, dtype=np.int64)
        if mask_np.ndim != 2:
            raise ValueError(f"Mask must be single-channel 2D class-ID: {mask_path}")

        mask_tensor = torch.from_numpy(mask_np)

        return image_tensor, mask_tensor, image_path.name
