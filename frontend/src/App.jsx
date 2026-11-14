
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DamageScanner from './components/DamageScanner';
import DigitalTwin3D from './components/DigitalTwin3D';
import TemporalCompare from './components/TemporalCompare';
import MonumentRegistry from './components/MonumentRegistry';
import ReportModal from './components/ReportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [reportOpen, setReportOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setSystemHealth)
      .catch((err) => console.warn('Backend offline:', err));
  }, []);

  const handleSelectMonumentForInspection = () => {
    setActiveTab('scanner');
  };

  const handleOpen3DTwin = () => {
    setActiveTab('twin3d');
  };

  return (
    <div className="min-h-screen flex flex-col relative">

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        onOpenReport={() => setReportOpen(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {activeTab === 'scanner' && (
          <DamageScanner
            onInspectionComplete={setCurrentInspection}
          />
        )}

        {activeTab === 'twin3d' && <DigitalTwin3D />}

        {activeTab === 'temporal' && <TemporalCompare />}

        {activeTab === 'registry' && (
          <MonumentRegistry
            onSelectMonument={handleSelectMonumentForInspection}
            onOpen3DTwin={handleOpen3DTwin}
          />
        )}

      </main>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        currentInspection={currentInspection}
      />

      <footer className="mt-12 border-t border-orange-100 bg-white/65 backdrop-blur-xl px-5 py-7">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-saffron flex items-center justify-center text-white text-xl shadow-md">
              🏛️
            </div>

            <div>
              <p className="heritage-title font-bold text-sm">
                DUALCHAS
              </p>
              <p className="text-[10px] text-stone-500">
                AI Heritage Intelligence & Preservation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-stone-500 font-medium">
            <span>ResNet-34 U-Net</span>
            <span>•</span>
            <span>3D Digital Reconstruction</span>
            <span>•</span>
            <span>Temporal Damage Analysis</span>
          </div>

          <p className="text-[10px] text-stone-400">
            Preserving heritage through intelligence.
          </p>

        </div>
      </footer>

    </div>
  );
}
