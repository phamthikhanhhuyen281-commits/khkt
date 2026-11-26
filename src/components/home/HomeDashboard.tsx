import React, { useEffect, useState } from 'react';
import {
  Camera,
  BookOpen,
  MessageCircle,
  History,
  Sun,
} from 'lucide-react';
import { fetchUserDiagnoses } from '../../services/diagnosisService';
import { CropType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HomeDashboardProps {
  onStartScan: (crop?: CropType) => void;
  onNavigate: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onStartScan, onNavigate }) => {
  const { user } = useAuth();
  const [diagnosisCount, setDiagnosisCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    async function loadCount() {
      try {
        const diags = await fetchUserDiagnoses(user?.uid);
        if (active) setDiagnosisCount(diags.length);
      } catch (err) {
        console.error('Error loading diagnosis count:', err);
      }
    }
    loadCount();
    return () => {
      active = false;
    };
  }, [user]);

  const crops: {
    id: CropType;
    name: string;
    icon: string;
    desc: string;
    cardStyle: string;
  }[] = [
    {
      id: 'citrus',
      name: 'Cây Cam, Bưởi',
      icon: '🍊',
      desc: 'Xem bệnh vàng lá, loét quả, ghẻ lá',
      cardStyle: 'border-amber-200 hover:border-amber-400',
    },
    {
      id: 'rice',
      name: 'Cây Lúa',
      icon: '🌾',
      desc: 'Xem bệnh đạo ôn, bạc lá, khô vằn',
      cardStyle: 'border-emerald-200 hover:border-emerald-400',
    },
    {
      id: 'peanut',
      name: 'Cây Lạc (Đậu)',
      icon: '🥜',
      desc: 'Xem bệnh đốm lá, gỉ sắt, héo rũ',
      cardStyle: 'border-orange-200 hover:border-orange-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Clear Minimalist Welcome Header */}
      <section className="text-center sm:text-left space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Bác muốn khám bệnh cho cây nào?
        </h1>
        <p className="text-base sm:text-lg text-stone-600">
          Chọn loại cây bên dưới rồi chụp ảnh lá hoặc quả bị bệnh để xem ngay.
        </p>
      </section>

      {/* 3 Large Crop Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {crops.map((crop) => (
          <div
            key={crop.id}
            className={`bg-white rounded-2xl border-2 ${crop.cardStyle} p-6 flex flex-col justify-between gap-5 shadow-xs transition-all`}
          >
            <div className="space-y-3">
              <div className="text-5xl leading-none" aria-hidden="true">
                {crop.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-stone-900">
                  {crop.name}
                </h2>
                <p className="text-base text-stone-600 leading-snug">
                  {crop.desc}
                </p>
              </div>
            </div>

            <button
              onClick={() => onStartScan(crop.id)}
              className="w-full min-h-[52px] px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-base font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5 shrink-0" />
              <span>Chụp ảnh khám cây này</span>
            </button>
          </div>
        ))}
      </section>

      {/* 3 Simple Utility Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-800">
          Hoặc bác có thể xem thêm
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('library')}
            className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 p-5 text-left flex items-start gap-4 transition-colors cursor-pointer min-h-[88px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-stone-900">Xem sổ bệnh cây</div>
              <p className="text-sm text-stone-600 mt-0.5">
                Xem hình mẫu và cách chữa đơn giản
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('assistant')}
            className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 p-5 text-left flex items-start gap-4 transition-colors cursor-pointer min-h-[88px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-stone-900">Hỏi bác sĩ cây trồng</div>
              <p className="text-sm text-stone-600 mt-0.5">
                Nhắn tin hỏi nhanh bằng tiếng Việt
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 p-5 text-left flex items-start gap-4 transition-colors cursor-pointer min-h-[88px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-stone-900">Các lần đã khám</div>
              <p className="text-sm text-stone-600 mt-0.5">
                {diagnosisCount > 0
                  ? `Đã lưu ${diagnosisCount} lần khám trước đây`
                  : 'Chưa có lần khám nào'}
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Calm 1-Sentence Seasonal Reminder */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <Sun className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-base text-stone-800 leading-relaxed">
          <strong>Nhắc nhẹ mùa này:</strong> Sáng sớm có nhiều sương ẩm, bác nhớ thăm vườn thường xuyên để phát hiện sớm bệnh đạo ôn trên lúa và vàng lá trên cam nhé.
        </p>
      </section>
    </div>
  );
};
