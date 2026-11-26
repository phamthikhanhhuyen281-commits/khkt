import React from 'react';
import { Sprout, Scan, BookOpen, MessageCircle, History, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { isResearcher } = useAuth();

  const items = [
    { id: 'home', label: 'Trang chủ', icon: Sprout },
    { id: 'library', label: 'Sổ bệnh', icon: BookOpen },
    { id: 'scanner', label: 'Chụp khám', icon: Scan, primary: true },
    { id: 'assistant', label: 'Hỏi đáp', icon: MessageCircle },
    {
      id: isResearcher ? 'research' : 'history',
      label: isResearcher ? 'Quản trị' : 'Đã khám',
      icon: isResearcher ? FlaskConical : History,
    },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng dưới"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-2 h-16 flex items-center justify-around"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        if (item.primary) {
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl min-h-[48px] min-w-[68px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-bold mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              isActive
                ? 'text-emerald-800 font-bold bg-emerald-50/70'
                : 'text-stone-600 hover:text-stone-900 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
