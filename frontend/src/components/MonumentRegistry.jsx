import React, { useEffect, useState } from 'react';
import { Building2, MapPin, Calendar, ShieldCheck, ArrowUpRight, Box, AlertTriangle } from 'lucide-react';

export default function MonumentRegistry({ onSelectMonument, onOpen3DTwin }) {
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/monuments')
      .then((res) => res.json())
      .then((data) => {
        setMonuments(data.monuments || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-orange-600" />
            National Heritage Digital Repository
          </span>
          <h2 className="text-2xl font-bold text-stone-900">Protected Indian Monuments & Archaeological Sites</h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Registered survey datasets across Konark Sun Temple, Darbhanga Fort, Hooghly Imambara, Hampi, and Rani ki Vav.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-stone-500">Loading monument records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monuments.map((m) => (
            <div
              key={m.id}
              className="glass-panel p-6 flex flex-col justify-between hover:border-orange-400 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      m.severity_level === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : m.severity_level === 'MODERATE'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {m.severity_level}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {m.coordinates.lat.toFixed(2)}°N, {m.coordinates.lng.toFixed(2)}°E
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-orange-600 transition mb-1">
                  {m.name}
                </h3>
                <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  {m.location}
                </p>

                <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                  <div>
                    <span className="text-stone-400 font-medium">Dynasty: </span>
                    <strong className="text-stone-800">{m.dynasty}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 font-medium">Material: </span>
                    <strong className="text-stone-800">{m.material}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 font-medium">Status: </span>
                    <span className="text-emerald-700 font-semibold">{m.unesco_status}</span>
                  </div>
                </div>

                {/* Primary Threats Tags */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Key Vulnerabilities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.primary_threats.map((t, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => onSelectMonument(m)}
                  className="flex-1 btn-glossy gradient-saffron text-xs py-2"
                >
                  Inspect in Studio
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                {m['3d_twin_available'] && (
                  <button
                    onClick={() => onOpen3DTwin(m.id)}
                    className="btn-glass-secondary text-xs py-2 px-3"
                    title="View 3D Digital Twin"
                  >
                    <Box className="w-4 h-4 text-orange-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
