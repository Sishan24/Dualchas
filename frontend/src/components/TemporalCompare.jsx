import React, { useState } from 'react';
import { Clock, TrendingUp, AlertOctagon, CheckCircle2, ArrowRight, Layers, FileCheck } from 'lucide-react';

export default function TemporalCompare() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dateA, setDateA] = useState('2026-01-15');
  const [dateB, setDateB] = useState('2026-11-14');
  const [viewTab, setViewTab] = useState('diff'); // 'diff', 'compare'

  const runSampleComparison = async () => {
    setLoading(true);
    try {
      // Fetch sample images for Konark & Darbhanga
      const resA = await fetch('/api/sample-image/konark_sun_temple_chariot_wheel.jpg');
      const b64A = await resA.text();
      const blobA = await (await fetch(b64A)).blob();
      const fileA = new File([blobA], 'survey_a.jpg', { type: 'image/jpeg' });

      const resB = await fetch('/api/sample-image/darbhanga_fort_ram_bagh_gate.jpg');
      const b64B = await resB.text();
      const blobB = await (await fetch(b64B)).blob();
      const fileB = new File([blobB], 'survey_b.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('survey_a', fileA);
      formData.append('survey_b', fileB);
      formData.append('date_a', dateA);
      formData.append('date_b', dateB);

      const compRes = await fetch('/api/temporal-compare', {
        method: 'POST',
        body: formData,
      });

      if (!compRes.ok) throw new Error('Temporal compare failed');
      const data = await compRes.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Failed running longitudinal comparison.');
    } finally {
      setLoading(false);
    }
  };

  const report = result?.report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-600" />
            Module D · Multi-Temporal Homography & Change Detection
          </span>
          <h2 className="text-2xl font-bold text-stone-900">Longitudinal Deterioration Monitoring</h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Geometric alignment & differential segmentation between baseline surveys and recent inspections.
          </p>
        </div>

        <button
          onClick={runSampleComparison}
          disabled={loading}
          className="btn-glossy gradient-saffron"
        >
          {loading ? 'Aligning & Computing Diff...' : 'Run Benchmark Survey Comparison'}
        </button>
      </div>

      {result ? (
        <div className="space-y-6">
          {/* Urgent Risk Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              report.urgency_level === 'HIGH'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : report.urgency_level === 'MODERATE'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  report.urgency_level === 'HIGH'
                    ? 'bg-rose-200 text-rose-700'
                    : 'bg-emerald-200 text-emerald-700'
                }`}
              >
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Status: {report.conservation_status}
                </span>
                <p className="font-bold text-base">{report.expert_alert}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="block text-stone-400 font-bold">Survey A</span>
                <strong>{report.survey_a_date}</strong>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400" />
              <div>
                <span className="block text-stone-400 font-bold">Survey B</span>
                <strong>{report.survey_b_date}</strong>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5">
              <span className="text-xs font-bold text-stone-400 uppercase">Net Damage Delta</span>
              <div className="text-2xl font-black text-stone-900 mt-1 flex items-baseline gap-1">
                <span className={report.net_damage_delta > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {report.net_damage_delta > 0 ? `+${report.net_damage_delta}%` : `${report.net_damage_delta}%`}
                </span>
              </div>
              <span className="text-[11px] text-stone-500">Surface change</span>
            </div>

            <div className="glass-panel p-5">
              <span className="text-xs font-bold text-stone-400 uppercase">Newly Observed</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {report.change_breakdown.newly_observed_pct}%
              </div>
              <span className="text-[11px] text-stone-500">Fresh fractures</span>
            </div>

            <div className="glass-panel p-5">
              <span className="text-xs font-bold text-stone-400 uppercase">Progressing Flaws</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {report.change_breakdown.progressing_pct}%
              </div>
              <span className="text-[11px] text-stone-500">Widening cracks</span>
            </div>

            <div className="glass-panel p-5">
              <span className="text-xs font-bold text-stone-400 uppercase">Alignment Match</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {report.alignment.confidence}%
              </div>
              <span className="text-[11px] text-stone-500">ORB RANSAC inliers</span>
            </div>
          </div>

          {/* Differential Viewport */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-base">Longitudinal Change Visualizer</h3>
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  New Deterioration
                </span>
                <span className="flex items-center gap-1.5 font-bold text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Progressing Damage
                </span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Treated / Grouting
                </span>
              </div>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200">
              <img src={result.diff_image} alt="Temporal Difference Overlay" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-lg">No Longitudinal Comparison Active</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Click 'Run Benchmark Survey Comparison' above to register Survey A and Survey B, map temporal deltas, and detect newly formed cracks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
