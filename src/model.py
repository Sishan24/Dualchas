"""
Dualchas Heritage AI: Deep Learning Damage Segmentation Architecture
U-Net with ResNet-34 feature backbone & residual multi-scale skip connections.
Targeted at segmenting 5 classes:
  0: Background / Intact Masonry
  1: Crack
  2: Spalling
  3: Vegetation
  4: Erosion / Surface Deterioration
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

NUM_CLASSES = 5
CLASS_NAMES = ["Background", "Crack", "Spalling", "Vegetation", "Erosion"]
CLASS_COLORS = [
    (0, 0, 0),        # 0: Background - Transparent/None
    (239, 68, 68),    # 1: Crack - Vivid Saffron-Red
    (245, 158, 11),   # 2: Spalling - Warm Terracotta/Amber
    (16, 185, 129),   # 3: Vegetation - Emerald Jade
    (59, 130, 246),   # 4: Erosion - Turquoise Lapis
]


class ConvBlock(nn.Module):
    """Double Conv + BN + LeakyReLU with Dropout for regularization."""
    def __init__(self, in_channels, out_channels, dropout=0.15):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Dropout2d(p=dropout),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.LeakyReLU(0.1, inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class DecoderBlock(nn.Module):
    """Decoder block with bilinear upsampling, concatenation, and ConvBlock."""
    def __init__(self, in_channels, skip_channels, out_channels, dropout=0.15):
        super().__init__()
        self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)
        self.conv = ConvBlock(in_channels + skip_channels, out_channels, dropout=dropout)

    def forward(self, x, skip=None):
        x = self.up(x)
        if skip is not None:
            # Handle padding differences if any
            diff_y = skip.size(2) - x.size(2)
            diff_x = skip.size(3) - x.size(3)
            if diff_y != 0 or diff_x != 0:
                x = F.pad(x, [diff_x // 2, diff_x - diff_x // 2, diff_y // 2, diff_y - diff_y // 2])
            x = torch.cat([skip, x], dim=1)
        return self.conv(x)


class HeritageUNet(nn.Module):
    """
    ResNet-34 Feature Pyramid Encoder + Attention-Enhanced Decoder.
    Equipped with dropout and residual connections to prevent overfitting.
    """
    def __init__(self, num_classes=NUM_CLASSES, pretrained=True, dropout=0.2):
        super().__init__()
        self.num_classes = num_classes

        # ResNet-34 Backbone
        weights = models.ResNet34_Weights.DEFAULT if pretrained else None
        try:
            resnet = models.resnet34(weights=weights)
        except Exception:
            resnet = models.resnet34(weights=None)

        self.initial = nn.Sequential(
            resnet.conv1,
            resnet.bn1,
            resnet.relu,
        )  # Output: 64 channels, stride 2 (e.g. 256x256)
        self.maxpool = resnet.maxpool  # Stride 4 (e.g. 128x128)

        self.layer1 = resnet.layer1  # 64 channels, stride 4
        self.layer2 = resnet.layer2  # 128 channels, stride 8
        self.layer3 = resnet.layer3  # 256 channels, stride 16
        self.layer4 = resnet.layer4  # 512 channels, stride 32 (bottleneck)

        # Decoder Stages
        self.dec4 = DecoderBlock(512, 256, 256, dropout=dropout)  # 512 -> 256
        self.dec3 = DecoderBlock(256, 128, 128, dropout=dropout)  # 256 -> 128
        self.dec2 = DecoderBlock(128, 64, 64, dropout=dropout)    # 128 -> 64
        self.dec1 = DecoderBlock(64, 64, 32, dropout=dropout)     # 64 -> 32
        
        # Final upsample to full input resolution
        self.final_up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)
        self.final_conv = nn.Sequential(
            nn.Conv2d(32, 32, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, num_classes, kernel_size=1)
        )

    def forward(self, x):
        # Encoder forward pass
        x0 = self.initial(x)        # [B, 64, H/2, W/2]
        x1 = self.maxpool(x0)       # [B, 64, H/4, W/4]
        x1 = self.layer1(x1)        # [B, 64, H/4, W/4]
        x2 = self.layer2(x1)        # [B, 128, H/8, W/8]
        x3 = self.layer3(x2)        # [B, 256, H/16, W/16]
        x4 = self.layer4(x3)        # [B, 512, H/32, W/32]

        # Decoder forward pass with skip connections
        d4 = self.dec4(x4, x3)      # [B, 256, H/16, W/16]
        d3 = self.dec3(d4, x2)      # [B, 128, H/8, W/8]
        d2 = self.dec2(d3, x1)      # [B, 64, H/4, W/4]
        d1 = self.dec1(d2, x0)      # [B, 32, H/2, W/2]

        out = self.final_up(d1)     # [B, 32, H, W]
        logits = self.final_conv(out) # [B, num_classes, H, W]
        return logits


class CombinedLoss(nn.Module):
    """
    Combines Focal/Cross-Entropy Loss with Multiclass Soft Dice Loss.
    Ensures rare defects (thin cracks and spalling) are penalized properly.
    """
    def __init__(self, ce_weight=1.0, dice_weight=1.0, class_weights=None):
        super().__init__()
        self.ce_weight = ce_weight
        self.dice_weight = dice_weight
        if class_weights is not None:
            self.ce = nn.CrossEntropyLoss(weight=class_weights)
        else:
            # Emphasize damage classes over predominant background
            default_weights = torch.tensor([0.2, 2.5, 2.0, 1.8, 1.5], dtype=torch.float32)
            self.ce = nn.CrossEntropyLoss(weight=default_weights)

    def forward(self, logits, targets):
        ce_loss = self.ce(logits, targets)

        # Soft Dice Loss
        probs = F.softmax(logits, dim=1)
        num_classes = logits.shape[1]
        dice_loss = 0.0

        # One-hot encode targets
        targets_one_hot = F.one_hot(targets.clamp(0, num_classes - 1), num_classes).permute(0, 3, 1, 2).float()

        # Compute dice for non-background damage classes (1 through 4)
        for c in range(1, num_classes):
            p = probs[:, c, :, :]
            t = targets_one_hot[:, c, :, :]
            intersection = (p * t).sum()
            union = p.sum() + t.sum()
            dice_c = (2.0 * intersection + 1e-5) / (union + 1e-5)
            dice_loss += (1.0 - dice_c)

        dice_loss = dice_loss / (num_classes - 1)
        return self.ce_weight * ce_loss + self.dice_weight * dice_loss


def calculate_iou(predictions, targets, num_classes=NUM_CLASSES):
    """Computes per-class and mean Intersection over Union (IoU)."""
    ious = []
    pred_flat = predictions.view(-1)
    target_flat = targets.view(-1)

    for c in range(num_classes):
        pred_c = (pred_flat == c)
        target_c = (target_flat == c)
        intersection = (pred_c & target_c).sum().float().item()
        union = (pred_c | target_c).sum().float().item()
        if union == 0:
            ious.append(float("nan"))
        else:
            ious.append(intersection / union)

    valid_ious = [v for v in ious if not (torch.isnan(torch.tensor(v)))]
    mean_iou = sum(valid_ious) / max(len(valid_ious), 1)
    return ious, mean_iou
