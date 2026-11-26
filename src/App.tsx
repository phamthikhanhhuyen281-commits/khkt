import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { HomeDashboard } from './components/home/HomeDashboard';
import { PlantScanner } from './components/scanner/PlantScanner';
import { KnowledgeLibrary } from './components/library/KnowledgeLibrary';
import { AgriculturalAssistant } from './components/assistant/AgriculturalAssistant';
import { DiagnosisHistoryView } from './components/history/DiagnosisHistoryView';
import { ResearchAdminDashboard } from './components/research/ResearchAdminDashboard';
import { RestrictedAccessView } from './components/auth/RestrictedAccessView';
import { AccessMatrixModal } from './components/auth/AccessMatrixModal';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { CropType } from './types';
import { Sprout } from 'lucide-react';

function AppContent() {
  const { isResearcher } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [scannerCrop, setScannerCrop] = useState<CropType>('citrus');
  const [assistantContext, setAssistantContext] = useState<any>(null);
  const [libraryInitialCrop, setLibraryInitialCrop] = useState<CropType | undefined>(undefined);
  const [isMatrixOpen, setIsMatrixOpen] = useState<boolean>(false);

  const handleStartScan = (crop?: CropType) => {
    if (crop) setScannerCrop(crop);
    setActiveTab('scanner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAssistant = (context: any) => {
    setAssistantContext(context);
    setActiveTab('assistant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLibrary = (crop?: CropType) => {
    setLibraryInitialCrop(crop);
    setActiveTab('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f6f9f6] text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
        {activeTab === 'home' && (
          <HomeDashboard
            onStartScan={handleStartScan}
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'scanner' && (
          <PlantScanner
            initialCrop={scannerCrop}
            onNavigateToAssistant={handleNavigateToAssistant}
            onNavigateToLibrary={handleNavigateToLibrary}
          />
        )}

        {activeTab === 'assistant' && (
          <AgriculturalAssistant
            initialContext={assistantContext}
            onClearContext={() => setAssistantContext(null)}
          />
        )}

        {activeTab === 'library' && (
          <KnowledgeLibrary
            initialCrop={libraryInitialCrop}
            onScanWithDisease={(crop) => handleStartScan(crop)}
          />
        )}

        {activeTab === 'history' && (
          <DiagnosisHistoryView
            onScanNew={() => handleStartScan()}
            onViewAssistantWithDiagnosis={handleNavigateToAssistant}
          />
        )}

        {activeTab === 'research' && (
          isResearcher ? (
            <ResearchAdminDashboard />
          ) : (
            <RestrictedAccessView onOpenAccessMatrix={() => setIsMatrixOpen(true)} />
          )
        )}
      </main>

      <AccessMatrixModal isOpen={isMatrixOpen} onClose={() => setIsMatrixOpen(false)} />
      <PwaInstallBanner />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <footer className="hidden md:block bg-white border-t border-stone-200 mt-auto py-5 text-stone-600 text-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="font-bold text-stone-900">AgriVision</span>
            <span className="text-stone-400">•</span>
            <span>Hỗ trợ bà con nhận biết bệnh cây Cam, Lúa, Lạc</span>
          </div>
          <span className="text-stone-500">Dễ nhìn • Dễ dùng</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
