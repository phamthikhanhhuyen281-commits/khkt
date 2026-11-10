import React from 'react';
import { Sprout, Scan, BookOpen, Bot, History, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { isResearcher } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'home' ? 'text-emerald-800 font-semibold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sprout className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Trang chủ</span>
        </button>

        {/* Library */}
        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'library' ? 'text-emerald-800 font-semibold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'library' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Thư viện</span>
        </button>

        {/* Large Prominent Camera Scan Button in Center */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-90 ${
              activeTab === 'scanner'
                ? 'bg-emerald-800 text-white ring-4 ring-emerald-200'
                : 'bg-gradient-to-tr from-emerald-700 to-green-600 text-white shadow-emerald-900/30'
            }`}
            title="Quét bệnh cây trồng ngay"
          >
            <Scan className="w-6 h-6 stroke-[2.2]" />
            <span className="text-[9px] font-bold tracking-tight uppercase mt-0.5">Quét AI</span>
          </button>
        </div>

        {/* AI Assistant */}
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'assistant' ? 'text-emerald-800 font-semibold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Bot className={`w-5 h-5 ${activeTab === 'assistant' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Trợ lý AI</span>
        </button>

        {/* Research / History */}
        <button
          onClick={() => setActiveTab(isResearcher ? 'research' : 'history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'research' || activeTab === 'history'
              ? 'text-emerald-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {isResearcher ? (
            <FlaskConical className={`w-5 h-5 ${activeTab === 'research' ? 'stroke-[2.5]' : ''}`} />
          ) : (
            <History className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : ''}`} />
          )}
          <span className="text-[10px] mt-0.5">{isResearcher ? 'Nghiên cứu' : 'Lịch sử'}</span>
        </button>
      </div>
    </div>
  );
};
