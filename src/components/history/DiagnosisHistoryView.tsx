import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  Camera,
  MessageCircle,
} from 'lucide-react';
import { DiagnosisHistoryItem, CropType } from '../../types';
import { fetchUserDiagnoses, deleteDiagnosisRecord } from '../../services/diagnosisService';
import { useAuth } from '../../context/AuthContext';

interface DiagnosisHistoryViewProps {
  onScanNew: () => void;
  onViewAssistantWithDiagnosis?: (context: any) => void;
}

export const DiagnosisHistoryView: React.FC<DiagnosisHistoryViewProps> = ({
  onScanNew,
  onViewAssistantWithDiagnosis,
}) => {
  const { user, isResearcher } = useAuth();
  const [historyItems, setHistoryItems] = useState<DiagnosisHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [viewItem, setViewItem] = useState<DiagnosisHistoryItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await fetchUserDiagnoses(user?.uid, isResearcher);
      setHistoryItems(items);
    } catch (err) {
      console.error('Error loading diagnosis history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDiagnosisRecord(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    if (viewItem?.id === id) setViewItem(null);
  };

  const getCropLabel = (crop: CropType) =>
    crop === 'citrus' ? '🍊 Cây Cam, Bưởi' : crop === 'rice' ? '🌾 Cây Lúa' : '🥜 Cây Lạc';

  const filteredItems = historyItems.filter(
    (item) => selectedCrop === 'all' || item.cropType === selectedCrop
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Các Lần Đã Khám
          </h1>
          <p className="text-base text-stone-600 mt-1">
            Xem lại ảnh và kết quả bệnh cây bác đã kiểm tra trước đây.
          </p>
        </div>

        <button
          onClick={onScanNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-base font-bold bg-emerald-700 text-white hover:bg-emerald-800 min-h-[48px] cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>Chụp khám cây mới</span>
        </button>
      </div>

      {/* Crop Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'citrus', label: '🍊 Cây Cam' },
          { id: 'rice', label: '🌾 Cây Lúa' },
          { id: 'peanut', label: '🥜 Cây Lạc' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCrop(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold min-h-[44px] transition-colors cursor-pointer ${
              selectedCrop === tab.id
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-stone-200 text-stone-800 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-base text-stone-500">Đang tải danh sách đã khám...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <p className="text-lg font-bold text-stone-800">Chưa có lần khám nào được lưu.</p>
          <p className="text-base text-stone-600">
            Khi bác chụp ảnh xem bệnh, kết quả sẽ tự động lưu vào đây để xem lại bất cứ lúc nào.
          </p>
          <button
            onClick={onScanNew}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold bg-emerald-700 text-white hover:bg-emerald-800 min-h-[48px] cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Chụp ảnh khám ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 overflow-hidden flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="h-44 bg-stone-100 overflow-hidden flex items-center justify-center">
                  {item.imageUrl && !failedImages[item.id] ? (
                    <img
                      src={item.imageUrl}
                      alt={item.suspectedDiseases[0] || 'Ảnh mẫu đã khám'}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-stone-500">Không có ảnh xem trước</span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-sm text-stone-600">
                    <span className="font-semibold text-emerald-800">
                      {getCropLabel(item.cropType)}
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-stone-900 leading-snug">
                    {item.suspectedDiseases[0] || 'Kết quả kiểm tra cây'}
                  </h3>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                <button
                  onClick={() => setViewItem(item)}
                  className="flex-1 min-h-[46px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-base border border-emerald-200 cursor-pointer"
                >
                  Xem lại
                </button>
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="min-h-[46px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
                  title="Xóa lần khám này"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-xl text-stone-900">
                  {viewItem.suspectedDiseases[0] || 'Chi tiết lần khám'}
                </h3>
                <p className="text-sm text-stone-600">
                  {getCropLabel(viewItem.cropType)} • Ngày{' '}
                  {new Date(viewItem.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-base text-stone-800 leading-relaxed">
              {viewItem.imageUrl && !failedImages[viewItem.id] && (
                <div className="rounded-xl overflow-hidden aspect-16/10 bg-stone-100 border border-stone-200">
                  <img
                    src={viewItem.imageUrl}
                    alt="Ảnh đã chụp"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {viewItem.assessment?.symptoms && viewItem.assessment.symptoms.length > 0 && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <p className="font-bold text-lg text-stone-900">Dấu hiệu nhìn thấy:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {viewItem.assessment.symptoms.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewItem.assessment?.recommendations && viewItem.assessment.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <p className="font-bold text-lg text-emerald-950">Cách xử lý nên làm:</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {viewItem.assessment.recommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ol>
                </div>
              )}

              {viewItem.expertNotes && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="font-bold">Lời dặn của cán bộ kỹ thuật: </span>
                  <span>{viewItem.expertNotes}</span>
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 p-4 bg-stone-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {onViewAssistantWithDiagnosis && (
                <button
                  onClick={() => {
                    onViewAssistantWithDiagnosis({
                      crop: getCropLabel(viewItem.cropType),
                      suspectedDisease: viewItem.suspectedDiseases[0],
                      symptoms: viewItem.assessment?.symptoms || [],
                    });
                    setViewItem(null);
                  }}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl text-base font-bold bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Hỏi thêm về bệnh này</span>
                </button>
              )}

              <button
                onClick={() => setViewItem(null)}
                className="min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
