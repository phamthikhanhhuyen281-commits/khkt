import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 bg-emerald-950 text-white p-4 rounded-2xl shadow-2xl border border-emerald-700/60 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-white">Cài đặt ứng dụng AgriVision AI</p>
          <p className="text-emerald-200/80 text-[11px]">
            Cài đặt lên màn hình chính để dùng nhanh ngay ngoài đồng ruộng
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-xs whitespace-nowrap"
        >
          Cài đặt
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 text-emerald-400 hover:text-white rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
