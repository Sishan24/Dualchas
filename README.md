# 🏛️ DUALCHAS
### Preserving the Past. Protecting the Future.

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-8B5CF6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Indian-Heritage-D97706?style=for-the-badge" />
  <img src="https://img.shields.io/badge/3D-Digital%20Twins-0D9488?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Research%20%26%20Development-2563EB?style=for-the-badge" />
</p>

<p align="center">
  <b>An intelligent digital preservation system for India's architectural heritage.</b>
  <br />
  Bringing together Artificial Intelligence, Computer Vision and 3D Reconstruction to help document, understand and monitor the condition of historic monuments.
</p>

---

## ✨ About the Project

India's monuments carry centuries of history, craftsmanship and cultural identity. But time, weather and environmental deterioration gradually take their toll.

**DUALCHAS** aims to make heritage preservation smarter through technology.

It transforms monument photographs into meaningful conservation insights using deep-learning-based damage detection, interactive 3D digital twins and image-based change monitoring.

From identifying surface cracks to visualising deterioration across different surveys, DUALCHAS brings multiple preservation tools together in one platform.

## 🌿 What Makes DUALCHAS Special?

| Feature | What it does |
|---|---|
| 🔍 AI Damage Detection | Identifies cracks, stone spalling, biological growth and surface erosion. |
| 🧠 Deep Learning | Uses a ResNet-34 U-Net segmentation architecture to analyse monument images. |
| 🏛️ 3D Digital Twins | Projects detected damage onto interactive 3D monument models. |
| 📊 Change Monitoring | Compares surveys taken at different times to identify changing damage patterns. |
| 🎨 Visual Dashboard | Presents inspection results through an intuitive conservation workspace. |
| 📄 Audit Reports | Generates printable monument condition reports. |

## 🏺 Heritage in Focus

DUALCHAS is designed around the architectural diversity of Indian heritage.

- Konark Sun Temple
- Darbhanga Fort
- Hooghly Imambara
- Hampi Vittala Temple
- Rani ki Vav

## 🎨 Understanding Monument Damage

The AI model identifies five pixel-level classes:

| Class | Classification | Visual Indicator |
|:---:|---|---|
| 0 | Intact Stone / Background | ⚪ |
| 1 | Structural Cracks | 🔴 |
| 2 | Stone Spalling | 🟠 |
| 3 | Biological Growth | 🟢 |
| 4 | Surface Erosion | 🔵 |

These classifications help organise visual observations and support further conservation assessment.

## ⚙️ Technology Behind the Project

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-black?style=flat-square&logo=threedotjs&logoColor=white" />
</p>

| Layer | Technologies |
|---|---|
| Machine Learning | Python, PyTorch, ResNet-34, U-Net |
| Image Processing | OpenCV, NumPy |
| 3D Visualisation | Three.js, Photogrammetry |
| Backend | FastAPI |
| Frontend | React 18, Vite |
| Testing | Pytest |

## 📈 Model Performance

The current model evaluation reports:

<p align="center">
  <img src="https://img.shields.io/badge/Pixel%20Accuracy-96.69%25-16A34A?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Validation%20Score-~75%25-F59E0B?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Tests-10%2F10%20Passing-0D9488?style=for-the-badge" />
</p>

*Reported project metrics; validation score is approximately 75% as documented in the current implementation.*

## 🚀 Getting Started

Get DUALCHAS running locally in a few simple steps.

**1. Clone the repository**

```bash
git clone <your-repository-url>
cd Dualchas
```

**2. Install Python dependencies**

```bash
pip install -r requirements.txt
```

**3. Start the backend**

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

**4. Start the frontend**

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

**5. Explore the application**

Open `http://localhost:5173` in your browser.

API documentation is available at `http://localhost:8000/docs`.

## 🧪 Run Tests

```bash
python -m pytest tests/
```

## 📂 Project Structure

```text
Dualchas/
│
├── backend/          # FastAPI application
├── frontend/         # React + Three.js interface
├── src/              # AI and image-processing modules
├── data/             # Training, validation and test datasets
├── artifacts/        # Model checkpoints and 3D outputs
├── tests/            # Automated test suite
│
├── app.py            # Streamlit interface
├── requirements.txt
└── README.md
```

## 🤍 Our Philosophy

Technology should not replace the expertise of conservation professionals. It should help them see more, document better and make informed decisions.

DUALCHAS is designed as a visual screening and monitoring platform, not a substitute for professional structural assessment or on-site conservation expertise.

Our guiding principles:

- Preserve historical authenticity.
- Encourage non-destructive assessment.
- Support informed conservation decisions.
- Make India's architectural heritage more accessible through technology.

---

<p align="center">
  <b>🏛️ Every monument tells a story. Let's make sure it continues.</b>
  <br /><br />
  <i>DUALCHAS — Where Heritage Meets Intelligence.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with-Purpose-EF4444?style=flat-square" />
  <img src="https://img.shields.io/badge/Inspired%20by-Indian%20Heritage-D97706?style=flat-square" />
</p>