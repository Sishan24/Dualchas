import React, { useState } from 'react';
import { Upload, Sliders, AlertTriangle, CheckCircle, Download, RefreshCw, Image as ImageIcon, Zap, Sparkles } from 'lucide-react';

const PRESET_MONUMENTS = [
  { id: 'konark', name: 'Konark Sun Temple', file: 'konark_sun_temple_chariot_wheel.jpg', desc: 'Odisha Sandstone Chariot Wheel' },
  { id: 'darbhanga', name: 'Darbhanga Fort', file: 'darbhanga_fort_ram_bagh_gate.jpg', desc: 'Bihar Red Laterite Bastion' },
  { id: 'hooghly', name: 'Hooghly Imambara', file: 'hooghly_imambara_sun_dial_courtyard.jpg', desc: 'Bengal Historic Stucco & Courtyard' },
  { id: 'hampi', name: 'Hampi Vittala', file: 'hampi_vittala_musical_pillars.jpg', desc: 'Karnataka Carved Granite Pillars' },
  { id: 'rani_vav', 'name': 'Rani ki Vav', file: 'rani_ki_vav_stepwell_frieze.jpg', desc: 'Gujarat Subterranean Tiered Stepwell' },
];

export default function DamageScanner({ onInspectionComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'original', 'mask', 'split'
  const [overlayAlpha, setOverlayAlpha] = useState(0.55);
  const [activePreset, setActivePreset] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await analyzeImage(file);
  };

  const loadPreset = async (preset) => {
    setActivePreset(preset.id);
    setLoading(true);
    try {
      const res = await fetch(`/api/sample-image/${preset.file}`);
      const b64 = await res.text();
      // Convert base64 data to blob
      const blob = await (await fetch(b64)).blob();
      const file = new File([blob], preset.file, { type: 'image/jpeg' });
      await analyzeImage(file);
    } catch (err) {
      console.error('Error loading preset:', err);
      setLoading(false);
    }
  };

  const analyzeImage = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alpha', overlayAlpha.toString());

      const res = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      if (onInspectionComplete) {
        onInspectionComplete(data);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Analysis failed. Ensure the FastAPI backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const stats = result?.stats;
  const severity = stats?.severity_index ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner with Radiant Indian Heritage Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-orange-200/80 shadow-lg shadow-orange-500/5">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-amber-300/20 via-orange-400/20 to-rose-400/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Deep Learning Conservation Screening
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-2">
            AI Monument Deterioration Studio
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Upload field surveys or high-resolution drone photographs. Our calibrated U-Net with ResNet-34 encoder generates sub-pixel masks for structural cracks, stone spalling, biological moss/lichen, and salt erosion.
          </p>

          {/* Quick Preset Selector */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">
              Sample Indian Monuments:
            </span>
            {PRESET_MONUMENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  activePreset === p.id
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white/80 hover:bg-white text-stone-700 border-stone-200 hover:border-orange-400 shadow-sm'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Display & Inspection Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-stone-900 text-base">Photogrammetric Inspection View</h3>
              </div>

              {/* View Switcher Pills */}
              {result && (
                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-medium">
                  {['overlay', 'original', 'mask'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded-lg capitalize transition ${
                        viewMode === mode
                          ? 'bg-white text-orange-950 font-bold shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Image Canvas / Viewport */}
            <div className="relative aspect-video rounded-2xl bg-stone-900/5 border border-stone-200/80 overflow-hidden flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-orange-600 animate-spin"></div>
                  <p className="font-semibold text-sm text-stone-700">Deep Learning Segmentation in Progress...</p>
                  <p className="text-xs text-stone-500">Feature pyramid extraction & multi-defect boundary classification</p>
                </div>
              ) : result ? (
                <div className="relative w-full h-full">
                  <img
                    src={
                      viewMode === 'original'
                        ? result.original_image
                        : viewMode === 'mask'
                        ? result.mask_image
                        : result.overlay_image
                    }
                    alt="Inspection result"
                    className="w-full h-full object-contain"
                  />
                  {/* Floating Class Tag */}
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-mono">
                    Mode: {viewMode.toUpperCase()} | Resolution: 512×512
                  </div>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 cursor-pointer hover:bg-orange-50/30 transition text-center">
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-base">Drop monument photograph here</p>
                    <p className="text-xs text-stone-500 mt-1">Supports high-res JPG, PNG (or click a sample preset above)</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Bottom Controls / Opacity Slider */}
            {result && (
              <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Sliders className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Mask Opacity: {Math.round(overlayAlpha * 100)}%</span>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={overlayAlpha}
                    onChange={(e) => setOverlayAlpha(parseFloat(e.target.value))}
                    className="accent-orange-600 w-32 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={result.overlay_image}
                    download="heritage_damage_overlay.jpg"
                    className="btn-glass-secondary text-xs py-1.5 px-3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Overlay
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Damage Analytics & Conservation Directives (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Structural Severity Score Card */}
          <div className="glass-panel p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Conservation Index</span>
                <h4 className="text-xl font-bold text-stone-900">Structural Vulnerability</h4>
              </div>
              <div
                className={`px-3 py-1.5 rounded-xl font-extrabold text-sm ${
                  severity > 5.0
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : severity > 2.0
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {severity > 5.0 ? 'CRITICAL RISK' : severity > 2.0 ? 'MODERATE RISK' : 'STABLE CONDITION'}
              </div>
            </div>

            {/* Severity Dial Meter */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-stone-900">{severity.toFixed(1)}</span>
              <span className="text-stone-400 font-bold text-sm">/ 10.0</span>
              <span className="text-xs text-stone-500 ml-auto">
                Total Damaged Area: <strong className="text-stone-900">{stats?.damage_percentage ?? 0}%</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden p-0.5 border border-stone-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  severity > 5.0
                    ? 'gradient-rose'
                    : severity > 2.0
                    ? 'gradient-gold'
                    : 'gradient-emerald'
                }`}
                style={{ width: `${Math.min(100, severity * 10)}%` }}
              ></div>
            </div>
          </div>

          {/* Breakdown by Specific Damage Class */}
          <div className="glass-panel p-6 space-y-4">
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center justify-between">
              <span>Damage Class Partition</span>
              <span className="text-xs font-normal text-stone-500">Pixel Area %</span>
            </h4>

            {stats ? (
              <div className="space-y-3">
                {/* Crack Class */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-red-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Structural Cracks
                    </span>
                    <span className="font-mono font-bold text-stone-800">{stats.classes.crack.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, stats.classes.crack.percentage * 5)}%` }}></div>
                  </div>
                </div>

                {/* Spalling Class */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Stone Spalling / Delamination
                    </span>
                    <span className="font-mono font-bold text-stone-800">{stats.classes.spalling.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, stats.classes.spalling.percentage * 5)}%` }}></div>
                  </div>
                </div>

                {/* Vegetation Class */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Micro-Vegetation / Moss
                    </span>
                    <span className="font-mono font-bold text-stone-800">{stats.classes.vegetation.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, stats.classes.vegetation.percentage * 5)}%` }}></div>
                  </div>
                </div>

                {/* Erosion Class */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Surface Weathering & Erosion
                    </span>
                    <span className="font-mono font-bold text-stone-800">{stats.classes.erosion.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, stats.classes.erosion.percentage * 5)}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic text-center py-4">
                Run an inspection to calculate class distributions
              </p>
            )}
          </div>

          {/* ASI / UNESCO Conservation Action Directives */}
          <div className="glass-panel p-6 space-y-3 bg-gradient-to-br from-white to-orange-50/50">
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              Conservation Action Directives
            </h4>
            {stats ? (
              <ul className="space-y-2">
                {stats.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-stone-700 leading-relaxed p-2.5 rounded-xl bg-white/80 border border-orange-200/50 shadow-sm flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400 italic">Directives generated dynamically based on detected damage profile.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
