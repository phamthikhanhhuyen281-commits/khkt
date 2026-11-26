import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { DiseaseRecord, CropType } from '../../types';
import { fetchDiseases, saveDisease, deleteDisease, syncVerifiedDiseases } from '../../services/diseaseService';
import { useAuth } from '../../context/AuthContext';

interface KnowledgeLibraryProps {
  initialCrop?: CropType;
  onScanWithDisease?: (crop: CropType) => void;
}

export const KnowledgeLibrary: React.FC<KnowledgeLibraryProps> = ({
  initialCrop,
  onScanWithDisease,
}) => {
  const { isAdmin } = useAuth();
  const [diseases, setDiseases] = useState<DiseaseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>(initialCrop || 'all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Detail modal
  const [selectedDisease, setSelectedDisease] = useState<DiseaseRecord | null>(null);

  // Admin editor modal
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingDisease, setEditingDisease] = useState<Partial<DiseaseRecord>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadDiseases();
  }, []);

  useEffect(() => {
    if (initialCrop) setSelectedCropFilter(initialCrop);
  }, [initialCrop]);

  const loadDiseases = async () => {
    setLoading(true);
    try {
      const data = await fetchDiseases();
      setDiseases(data);
    } catch (err) {
      console.error('Failed to load diseases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStandard = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const updated = await syncVerifiedDiseases();
      setDiseases(updated);
      setSyncSuccessMsg('Đã cập nhật lại toàn bộ sổ bệnh chuẩn.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Lỗi đồng bộ:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredDiseases = diseases.filter((d) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      d.vietnameseName.toLowerCase().includes(q) ||
      d.symptoms.toLowerCase().includes(q) ||
      d.causes.toLowerCase().includes(q);

    const matchesCrop = selectedCropFilter === 'all' || d.cropType === selectedCropFilter;
    return matchesSearch && matchesCrop;
  });

  const handleOpenAdd = () => {
    setEditingDisease({
      id: `disease_${Date.now()}`,
      cropType: 'citrus',
      vietnameseName: '',
      englishName: '',
      symptoms: '',
      affectedPlantParts: ['leaf'],
      causes: '',
      favorableConditions: '',
      preventionMethods: '',
      safeManagement: '',
      references: 'Viện Bảo vệ Thực vật Việt Nam',
      verificationStatus: 'verified',
      sampleImageUrl: '/images/citrus_leaf_hlb.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (disease: DiseaseRecord) => {
    setEditingDisease({ ...disease });
    setIsEditorOpen(true);
  };

  const handleSaveDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisease.id || !editingDisease.vietnameseName || !editingDisease.cropType) return;

    setIsSaving(true);
    try {
      await saveDisease(editingDisease as DiseaseRecord);
      await loadDiseases();
      setIsEditorOpen(false);
      if (selectedDisease?.id === editingDisease.id) {
        setSelectedDisease(editingDisease as DiseaseRecord);
      }
    } catch (err) {
      console.error('Error saving disease:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDisease = async (id: string) => {
    await deleteDisease(id);
    await loadDiseases();
    if (selectedDisease?.id === id) setSelectedDisease(null);
  };

  const getCropInfo = (crop: CropType) => {
    switch (crop) {
      case 'citrus':
        return { label: 'Cây Cam, Bưởi', icon: '🍊' };
      case 'rice':
        return { label: 'Cây Lúa', icon: '🌾' };
      case 'peanut':
        return { label: 'Cây Lạc', icon: '🥜' };
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Sổ Tra Cứu Bệnh Cây
          </h1>
          <p className="text-base text-stone-600 mt-1">
            Xem dấu hiệu bệnh và cách phòng chữa đơn giản cho Cam, Lúa, Lạc.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncStandard}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 min-h-[44px] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang cập nhật...' : 'Đồng bộ dữ liệu'}</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-800 min-h-[44px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bệnh mới</span>
            </button>
          </div>
        )}
      </div>

      {syncSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-base text-emerald-900 font-semibold">
          {syncSuccessMsg}
        </div>
      )}

      {/* Search & Big Crop Filter Buttons */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Gõ tên bệnh muốn tìm (ví dụ: vàng lá, đạo ôn, đốm lá)..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 text-base focus:outline-none focus:border-emerald-700 bg-stone-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Tất cả cây' },
            { id: 'citrus', label: '🍊 Cây Cam' },
            { id: 'rice', label: '🌾 Cây Lúa' },
            { id: 'peanut', label: '🥜 Cây Lạc' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCropFilter(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold min-h-[44px] transition-colors cursor-pointer ${
                selectedCropFilter === tab.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disease Cards */}
      {loading ? (
        <div className="py-16 text-center text-base text-stone-500">Đang mở sổ bệnh cây...</div>
      ) : filteredDiseases.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-2xl border border-stone-200 p-6 space-y-2">
          <p className="text-lg font-bold text-stone-800">Không tìm thấy bệnh nào phù hợp.</p>
          <p className="text-base text-stone-600">Bác thử xóa ô tìm kiếm hoặc chọn "Tất cả cây" nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDiseases.map((disease) => {
            const crop = getCropInfo(disease.cropType);
            const hasImage = disease.sampleImageUrl && !failedImages[disease.id];
            return (
              <div
                key={disease.id}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 overflow-hidden flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="relative h-44 bg-stone-100 overflow-hidden flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={disease.sampleImageUrl}
                        alt={disease.vietnameseName}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [disease.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl" aria-hidden="true">
                        {crop.icon}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="text-sm font-semibold text-emerald-800">
                      {crop.icon} {crop.label}
                    </div>
                    <h3 className="font-bold text-lg text-stone-900 leading-snug">
                      {disease.vietnameseName}
                    </h3>
                    <p className="text-sm sm:text-base text-stone-600 line-clamp-3 leading-relaxed">
                      {disease.symptoms}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedDisease(disease)}
                    className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-base font-bold border border-emerald-200 cursor-pointer"
                  >
                    Xem cách nhận biết & chữa
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(disease)}
                        className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl cursor-pointer min-h-[44px]"
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDisease(disease.id)}
                        className="p-2.5 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl cursor-pointer min-h-[44px]"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCropInfo(selectedDisease.cropType).icon}</span>
                <h3 className="font-bold text-xl text-stone-900 leading-tight">
                  {selectedDisease.vietnameseName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDisease(null)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-base text-stone-800 leading-relaxed">
              {selectedDisease.sampleImageUrl && !failedImages[selectedDisease.id] && (
                <div className="rounded-xl overflow-hidden aspect-16/9 bg-stone-100 border border-stone-200">
                  <img
                    src={selectedDisease.sampleImageUrl}
                    alt={selectedDisease.vietnameseName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <h4 className="font-bold text-lg text-stone-900">Dấu hiệu nhận biết</h4>
                <p className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  {selectedDisease.symptoms}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-lg text-stone-900">Nguyên nhân gây bệnh</h4>
                <p className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  {selectedDisease.causes}
                </p>
              </div>

              {selectedDisease.favorableConditions && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-lg text-amber-950">Khi nào bệnh hay xuất hiện</h4>
                  <p className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    {selectedDisease.favorableConditions}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <h4 className="font-bold text-lg text-emerald-950">Cách phòng và chữa an toàn</h4>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
                  <p>{selectedDisease.safeManagement}</p>
                  {selectedDisease.preventionMethods && (
                    <p className="pt-2 border-t border-emerald-200 text-stone-800">
                      <strong>Phòng ngừa:</strong> {selectedDisease.preventionMethods}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-200 p-4 bg-stone-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {onScanWithDisease && (
                <button
                  onClick={() => {
                    onScanWithDisease(selectedDisease.cropType);
                    setSelectedDisease(null);
                  }}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl text-base font-bold bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Chụp ảnh kiểm tra cây này</span>
                </button>
              )}
              <button
                onClick={() => setSelectedDisease(null)}
                className="min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Editor Modal */}
      {isEditorOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveDisease}
            className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-lg text-stone-900">
                {editingDisease.id ? 'Sửa thông tin bệnh' : 'Thêm bệnh mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Loại cây *</label>
                <select
                  value={editingDisease.cropType || 'citrus'}
                  onChange={(e) => setEditingDisease({ ...editingDisease, cropType: e.target.value as CropType })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="citrus">Cây Cam, Bưởi</option>
                  <option value="rice">Cây Lúa</option>
                  <option value="peanut">Cây Lạc</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên bệnh tiếng Việt *</label>
                <input
                  type="text"
                  required
                  value={editingDisease.vietnameseName || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, vietnameseName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Dấu hiệu nhận biết *</label>
                <textarea
                  required
                  rows={3}
                  value={editingDisease.symptoms || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, symptoms: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nguyên nhân</label>
                <input
                  type="text"
                  value={editingDisease.causes || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, causes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Cách phòng ngừa</label>
                <textarea
                  rows={2}
                  value={editingDisease.preventionMethods || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, preventionMethods: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Cách xử lý an toàn</label>
                <textarea
                  rows={2}
                  value={editingDisease.safeManagement || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, safeManagement: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Đường dẫn ảnh mẫu</label>
                <input
                  type="text"
                  value={editingDisease.sampleImageUrl || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, sampleImageUrl: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-[44px] px-5 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
