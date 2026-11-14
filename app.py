"""
Dualchas Heritage AI: Streamlit Interactive Web Application
Alternative lightweight UI for direct visual screening, model overlay inspection,
and survey metadata export.
"""
from pathlib import Path
import io
import sys
import tempfile
import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.predict import HeritagePredictor, CLASS_NAMES

def _get_image_bytes(image, format="JPEG"):
    buffer = io.BytesIO()
    image.save(buffer, format=format, quality=95)
    return buffer.getvalue()

def main():
    try:
        import streamlit as st
    except ImportError:
        print("Streamlit not installed in current environment. Use the FastAPI + React frontend (npm run dev in frontend/).")
        return

    st.set_page_config(
        page_title="Dualchas Heritage AI",
        page_icon="🏛️",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    st.markdown(
        """
        <style>
        .main { background: linear-gradient(135deg, #FFFDF9 0%, #FFF5EC 100%); }
        .stButton>button { background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: white; border-radius: 12px; font-weight: 600; }
        </style>
        """,
        unsafe_allow_html=True
    )

    st.title("🏛️ Dualchas Heritage AI")
    st.caption("AI-Assisted Visual Documentation of Indian Monument Deterioration & 3D Digital Twin")

    st.info(
        "🔬 Photogrammetric inspection screening under UNESCO Venice Charter guidelines. "
        "Evaluates cracks, stone spalling, biological colonization, and weathering erosion."
    )

    predictor = HeritagePredictor()

    with st.sidebar:
        st.header("Survey Metadata")
        monument = st.selectbox(
            "Monument Selection",
            ["Konark Sun Temple (Odisha)", "Darbhanga Fort (Bihar)", "Hooghly Imambara (West Bengal)", "Hampi Vittala Temple (Karnataka)", "Rani ki Vav (Gujarat)"]
        )
        survey_date = st.date_input("Survey Date")
        survey_id = st.text_input("Survey ID", value="SURVEY-2026-IND-01")
        st.markdown("---")
        st.write("### Target Damage Classes")
        st.write("- 🔴 **Crack (Class 1)**: Structural & joint fractures")
        st.write("- 🟠 **Spalling (Class 2)**: Chipped/detached stone")
        st.write("- 🟢 **Vegetation (Class 3)**: Moss, lichen & micro-flora")
        st.write("- 🔵 **Erosion (Class 4)**: Weathering & efflorescence")

    uploaded = st.file_uploader("Upload Monument Photograph", type=["jpg", "jpeg", "png"])

    col1, col2 = st.columns(2)

    if uploaded is not None:
        image = Image.open(uploaded).convert("RGB")
        with col1:
            st.subheader("Original Survey Image")
            st.image(image, use_container_width=True)

        if st.button("Analyse Photograph with U-Net", type="primary"):
            if not predictor.loaded:
                st.error("Model checkpoint not found. Train the model first.")
                return

            with st.spinner("Executing Deep Learning Segmentation..."):
                mask, overlay, stats = predictor.predict_image(image)

            with col2:
                st.subheader("Predicted Damage Overlay")
                st.image(overlay, use_container_width=True)

            st.markdown("---")
            st.subheader("Quantitative Surface Degradation Partition")

            m_col1, m_col2, m_col3, m_col4 = st.columns(4)
            m_col1.metric("Structural Cracks", f"{stats['classes']['crack']['percentage']}%")
            m_col2.metric("Stone Spalling", f"{stats['classes']['spalling']['percentage']}%")
            m_col3.metric("Biological Growth", f"{stats['classes']['vegetation']['percentage']}%")
            m_col4.metric("Surface Erosion", f"{stats['classes']['erosion']['percentage']}%")

            st.download_button(
                "Download Diagnostic Overlay",
                data=_get_image_bytes(overlay),
                file_name=f"{survey_id}_damage_overlay.jpg",
                mime="image/jpeg",
            )

if __name__ == "__main__":
    main()
