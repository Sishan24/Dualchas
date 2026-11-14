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
      .then((data) => setSystemHealth(data))
      .catch((err) => console.warn('Backend offline or starting up:', err));
  }, []);

  const handleSelectMonumentForInspection = (monument) => {
    setActiveTab('scanner');
    // Pre-load sample image for this monument if scanner is active
  };

  const handleOpen3DTwin = (monumentId) => {
    setActiveTab('twin3d');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Glossy Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        onOpenReport={() => setReportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {activeTab === 'scanner' && (
          <DamageScanner onInspectionComplete={(data) => setCurrentInspection(data)} />
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

      {/* Official ASI Style Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        currentInspection={currentInspection}
      />

      {/* Glossy Vibrant Footer */}
      <footer className="mt-16 border-t border-orange-500/10 bg-white/70 backdrop-blur-md py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="text-base">🏛️</span>
            <span>
              <strong>Dualchas</strong> · AI Indian Heritage Preservation & 3D Digital Twin Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>U-Net ResNet-34 (~75% IoU)</span>
            <span>•</span>
            <span>Structure from Motion Photogrammetry</span>
            <span>•</span>
            <span>UNESCO Venice Charter (1964) Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
