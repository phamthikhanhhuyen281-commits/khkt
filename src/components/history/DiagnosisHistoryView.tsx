import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Eye, 
  GitCompare, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Search,
  ExternalLink,
  ShieldCheck
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
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [viewItem, setViewItem] = useState<DiagnosisHistoryItem | null>(null);
  const [compareItems, setCompareItems] = useState<DiagnosisHistoryItem[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

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
    if (confirm('Bạn có chắc muốn xóa bản ghi chẩn đoán này khỏi lịch sử?')) {
      await deleteDiagnosisRecord(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      if (viewItem?.id === id) setViewItem(null);
      setCompareItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const toggleCompare = (item: DiagnosisHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareItems.some((c) => c.id === item.id)) {
      setCompareItems((prev) => prev.filter((c) => c.id !== item.id));
    } else {
      if (compareItems.length >= 2) {
        alert('Chỉ có thể so sánh đối chứng tối đa 2 mẫu cùng lúc.');
        return;
      }
      setCompareItems((prev) => [...prev, item]);
    }
  };

  const filteredItems = historyItems.filter((item) => {
    const matchesCrop = selectedCrop === 'all' || item.cropType === selectedCrop;
    const matchesSearch =
      item.suspectedDiseases.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.cropType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-700" />
            <span>Lịch sử Chẩn đoán & Theo dõi Mẫu bệnh</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Lưu trữ hình ảnh, kết quả sơ bộ và tiến trình phục hồi cây trồng
          </p>
        </div>

        <div className="flex items-center gap-2">
          {compareItems.length === 2 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 shadow-xs cursor-pointer animate-pulse"
            >
              <GitCompare className="w-4 h-4" />
              <span>Mở So sánh (2 mẫu đã chọn)</span>
            </button>
          )}

          <button
            onClick={onScanNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
          >
            <span>Quét mẫu mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo bệnh nghi ngờ, loài cây..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-emerald-600 bg-stone-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'citrus', label: '🍊 Cam quýt' },
            { id: 'rice', label: '🌾 Lúa' },
            { id: 'peanut', label: '🥜 Lạc' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCrop(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCrop === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Đang tải lịch sử chẩn đoán...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
          <p className="text-sm font-semibold text-stone-700">Chưa có bản ghi chẩn đoán nào.</p>
          <p className="text-xs text-stone-500">
            Chụp hoặc tải ảnh lên để bắt đầu lưu trữ hồ sơ dịch bệnh cây trồng của bạn.
          </p>
          <button
            onClick={onScanNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs mt-2"
          >
            <span>Quét mẫu đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isComparing = compareItems.some((c) => c.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => setViewItem(item)}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                  isComparing ? 'border-blue-500 ring-2 ring-blue-400/30' : 'border-stone-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-44 bg-stone-900 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt="Sample"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs capitalize">
                        {item.cropType === 'citrus' ? 'Cam chanh' : item.cropType === 'rice' ? 'Lúa nước' : 'Cây Lạc'} • {item.plantPart}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={(e) => toggleCompare(item, e)}
                        className={`p-1.5 rounded-lg text-xs backdrop-blur-xs transition-colors ${
                          isComparing
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-black/50 text-white hover:bg-black/80'
                        }`}
                        title="Chọn để so sánh đối chứng"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg bg-black/50 hover:bg-red-600 text-white text-xs backdrop-blur-xs transition-colors"
                        title="Xóa bản ghi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white/90">
                      <span>
                        Chất lượng: <strong className="capitalize">{item.imageQuality}</strong>
                      </span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Info Card Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {item.suspectedDiseases[0] || 'Chẩn đoán sơ bộ'}
                      </h3>
                    </div>

                    {item.assessment?.possibleDiagnoses[0]?.evidence && (
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {item.assessment.possibleDiagnoses[0].evidence.join('; ')}
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      {item.verificationStatus === 'expert_verified' ? (
                        <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Đã thẩm định</span>
                        </span>
                      ) : (
                        <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          AI sơ bộ
                        </span>
                      )}

                      <span className="text-emerald-700 font-semibold group-hover:underline">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-base text-stone-900">Chi tiết Hồ sơ Chẩn đoán Mẫu</h3>
                <p className="text-xs text-stone-500">
                  Mã hồ sơ: {viewItem.id} • Thời gian: {new Date(viewItem.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-stone-700 leading-relaxed">
              <div className="rounded-2xl overflow-hidden aspect-16/10 bg-stone-900">
                <img src={viewItem.imageUrl} alt="Mẫu bệnh" className="w-full h-full object-contain" />
              </div>

              <div>
                <span className="font-bold text-sm text-stone-900">Bệnh nghi ngờ: </span>
                <span className="text-sm font-extrabold text-emerald-900">
                  {viewItem.suspectedDiseases.join(', ')}
                </span>
              </div>

              {/* Assessment JSON structured summary */}
              {viewItem.assessment && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-800">Triệu chứng thị giác ghi nhận:</p>
                    <ul className="list-disc list-inside text-stone-600">
                      {viewItem.assessment.symptoms.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <p className="font-bold text-emerald-950">Khuyến cáo canh tác an toàn (GAP/IPM):</p>
                    <ul className="list-disc list-inside text-emerald-900">
                      {viewItem.assessment.recommendations.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {viewItem.expertNotes && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                  <span className="font-bold">Ghi chú của chuyên gia BVTV: </span>
                  <span>{viewItem.expertNotes}</span>
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 p-4 bg-stone-50 flex items-center justify-between">
              {onViewAssistantWithDiagnosis && (
                <button
                  onClick={() => {
                    onViewAssistantWithDiagnosis({
                      crop: viewItem.cropType,
                      suspectedDisease: viewItem.suspectedDiseases[0],
                      symptoms: viewItem.assessment?.symptoms || [],
                      confidenceLevel: viewItem.assessment?.possibleDiagnoses[0]?.confidenceLevel,
                    });
                    setViewItem(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer"
                >
                  Hỏi Trợ lý AI về mẫu này
                </button>
              )}

              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareOpen && compareItems.length === 2 && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-blue-700" />
                  <span>So sánh Đối chứng Hai Mẫu Bệnh</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Đánh giá sự khác biệt triệu chứng, độ tiến triển hoặc chẩn đoán chéo
                </p>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-700">
              {compareItems.map((item, idx) => (
                <div key={item.id} className="space-y-4 rounded-2xl border border-stone-200 p-4 bg-stone-50/50">
                  <div className="font-bold text-sm text-emerald-950 flex items-center justify-between">
                    <span>Mẫu {idx + 1}: {item.cropType === 'citrus' ? 'Cam chanh' : item.cropType === 'rice' ? 'Lúa nước' : 'Cây Lạc'}</span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="aspect-16/10 rounded-xl overflow-hidden bg-stone-900">
                    <img src={item.imageUrl} alt="Compare" className="w-full h-full object-contain" />
                  </div>

                  <div>
                    <span className="font-bold text-stone-900">Bệnh nghi ngờ: </span>
                    <span className="font-extrabold text-emerald-800">{item.suspectedDiseases[0]}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-stone-700">Triệu chứng quan sát:</span>
                    <ul className="list-disc list-inside text-stone-600 space-y-0.5">
                      {item.assessment?.symptoms.map((sym, sIdx) => (
                        <li key={sIdx}>{sym}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-stone-700">Khuyến nghị xử lý:</span>
                    <p className="text-[11px] text-stone-600 line-clamp-3">
                      {item.assessment?.recommendations.join('. ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 p-4 bg-stone-50 text-right">
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700"
              >
                Đóng so sánh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
