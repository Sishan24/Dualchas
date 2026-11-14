import React from 'react';
import { Shield, Eye, Layers, Clock, Building2, Cpu, FileText } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemHealth, onOpenReport }) {
  const navItems = [
    { id: 'scanner', label: 'Damage Studio', icon: Eye },
    { id: 'twin3d', label: '3D Digital Twin', icon: Layers },
    { id: 'temporal', label: 'Longitudinal Change', icon: Clock },
    { id: 'registry', label: 'Heritage Registry', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 lg:px-8 py-3 bg-white/75 backdrop-blur-xl border-b border-orange-500/10 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('scanner')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="heritage-title text-xl font-bold tracking-wider text-orange-900">DUALCHAS</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-800 border border-orange-200">
                Heritage AI
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Indian Monument Preservation & 3D Digital Twin System
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-2xl border border-stone-200/70 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'gradient-saffron shadow-md shadow-orange-500/25 scale-[1.02]'
                    : 'text-stone-600 hover:text-orange-700 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & AI Model Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:border-orange-500 hover:text-orange-600 shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5 text-orange-600" />
            <span>Audit Report</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/60 text-xs font-medium text-orange-950">
            <Cpu className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
            <span>ResNet-34 U-Net (~75% IoU)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
