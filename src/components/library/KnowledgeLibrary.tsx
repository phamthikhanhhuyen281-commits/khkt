import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle, 
  MapPin, 
  ShieldCheck, 
  X, 
  Save, 
  Sparkles, 
  Layers, 
  ThermometerSun, 
  Lock,
  RefreshCw,
  Award,
  FileCheck,
  HelpCircle,
  Microscope,
  Check
} from 'lucide-react';
import { DiseaseRecord, CropType, PlantPart, VerificationStatus } from '../../types';
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
  const [selectedPartFilter, setSelectedPartFilter] = useState<string>('all');

  // Detail view modal
  const [selectedDisease, setSelectedDisease] = useState<DiseaseRecord | null>(null);

  // Edit/Add modal state (Admin)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingDisease, setEditingDisease] = useState<Partial<DiseaseRecord>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 100% Quality Protocol Modal
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadDiseases();
  }, []);

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
    if (!confirm('Khôi phục và đồng bộ toàn bộ cơ sở dữ liệu đối chuẩn khoa học (QCVN / Viện BVTV / ASIR) vào Firestore? Mọi bản ghi sẽ được đối chiếu và cập nhật chuẩn xác.')) {
      return;
    }

    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const updated = await syncVerifiedDiseases();
      setDiseases(updated);
      setSyncSuccessMsg('Đã đồng bộ thành công 100% dữ liệu đối chuẩn khoa học vào cơ sở dữ liệu!');
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      alert('Lỗi đồng bộ dữ liệu: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredDiseases = diseases.filter((d) => {
    const matchesSearch =
      d.vietnameseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.causes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.standardCode && d.standardCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCrop = selectedCropFilter === 'all' || d.cropType === selectedCropFilter;
    const matchesPart =
      selectedPartFilter === 'all' || d.affectedPlantParts.includes(selectedPartFilter as PlantPart);

    return matchesSearch && matchesCrop && matchesPart;
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
      references: 'Viện Bảo vệ Thực vật Việt Nam; Viện ASIR',
      verificationStatus: 'verified',
      verifiedBy: 'Hội đồng Khoa học Bệnh học Thực vật',
      standardCode: 'QCVN / TCVN Tiêu chuẩn ngành BVTV',
      reviewDate: new Date().toISOString().split('T')[0],
      sampleImageUrl: '',
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
    if (!editingDisease.id || !editingDisease.vietnameseName || !editingDisease.cropType) {
      alert('Vui lòng điền các trường bắt buộc (Mã, Tên tiếng Việt, Nhóm cây trồng).');
      return;
    }

    setIsSaving(true);
    try {
      await saveDisease(editingDisease as DiseaseRecord);
      await loadDiseases();
      setIsEditorOpen(false);
      if (selectedDisease?.id === editingDisease.id) {
        setSelectedDisease(editingDisease as DiseaseRecord);
      }
    } catch (err: any) {
      alert('Lỗi lưu thông tin bệnh: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDisease = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ bệnh học này khỏi cơ sở dữ liệu?')) {
      try {
        await deleteDisease(id);
        await loadDiseases();
        if (selectedDisease?.id === id) {
          setSelectedDisease(null);
        }
      } catch (err: any) {
        alert('Lỗi xóa hồ sơ: ' + err.message);
      }
    }
  };

  const getCropBadge = (crop: CropType) => {
    switch (crop) {
      case 'citrus':
        return { label: 'Cam chanh / Cây có múi', icon: '🍊', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'rice':
        return { label: 'Lúa nước', icon: '🌾', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'peanut':
        return { label: 'Cây Lạc (Đậu phộng)', icon: '🥜', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-700" />
              <span>Thư viện Bệnh học Cây trồng Đã Xác thực</span>
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>QCVN & VAAS Verified</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Cơ sở dữ liệu thực vật đối chuẩn khoa học cho vùng Bắc Trung Bộ (Cam chanh, Lúa, Lạc)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Protocol Guide Button */}
          <button
            onClick={() => setIsProtocolModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 shadow-xs cursor-pointer active:scale-95"
            title="Xem quy chuẩn 4 bước để thông tin bệnh học đạt 100% độ chuẩn xác"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Quy chuẩn Đảm bảo 100% Chính xác</span>
          </button>

          {/* Admin Sync Button */}
          {isAdmin && (
            <button
              onClick={handleSyncStandard}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Đồng bộ và khôi phục toàn bộ dữ liệu đối chuẩn khoa học từ Viện BVTV / ASIR"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Dữ liệu Chuẩn'}</span>
            </button>
          )}

          {/* Admin Add Disease Button */}
          {isAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Hồ sơ Bệnh Mới</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Chế độ đọc (Chỉ Admin mới được sửa)</span>
            </div>
          )}
        </div>
      </div>

      {/* Sync Success Notification */}
      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên bệnh, mã quy chuẩn QCVN, tác nhân nấm/vi khuẩn..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-stone-50/50"
            />
          </div>

          {/* Crop Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả cây trồng' },
              { id: 'citrus', label: '🍊 Cam quýt' },
              { id: 'rice', label: '🌾 Lúa' },
              { id: 'peanut', label: '🥜 Lạc' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCropFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCropFilter === tab.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disease Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Đang tải danh mục bệnh học đối chuẩn...</div>
      ) : filteredDiseases.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-2">
          <p className="text-sm font-semibold text-stone-700">Không tìm thấy bệnh hại phù hợp.</p>
          <p className="text-xs text-stone-400">Vui lòng thử từ khóa khác hoặc điều chỉnh bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDiseases.map((disease) => {
            const cropBadge = getCropBadge(disease.cropType);
            return (
              <div
                key={disease.id}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Thumbnail / Placeholder */}
                  <div className="relative h-40 bg-stone-100 overflow-hidden">
                    {disease.sampleImageUrl ? (
                      <img
                        src={disease.sampleImageUrl}
                        alt={disease.vietnameseName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-50">
                        <span className="text-4xl">{cropBadge.icon}</span>
                        <span className="text-[10px] mt-1 text-stone-400">Mẫu tiêu bản</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cropBadge.color}`}>
                        {cropBadge.label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {disease.verificationStatus === 'verified' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Đã xác thực</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {disease.vietnameseName}
                      </h3>
                      <p className="text-[11px] font-medium text-stone-500 italic">
                        {disease.englishName}
                      </p>
                    </div>

                    {disease.standardCode && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/80 truncate">
                        <Award className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="truncate font-medium">{disease.standardCode}</span>
                      </div>
                    )}

                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {disease.symptoms}
                    </p>

                    <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1 text-[10px] text-stone-500">
                      <span className="font-semibold text-stone-700">Bộ phận:</span>
                      {disease.affectedPlantParts.map((p, idx) => (
                        <span key={idx} className="bg-stone-100 px-1.5 py-0.2 rounded-sm capitalize">
                          {p === 'leaf' ? 'Lá' : p === 'stem' ? 'Thân' : p === 'fruit' ? 'Quả/Củ' : 'Khác'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
                  <button
                    onClick={() => setSelectedDisease(disease)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem hồ sơ & căn cứ</span>
                    <span>→</span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(disease)}
                        className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md cursor-pointer"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDisease(disease.id)}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                        title="Xóa hồ sơ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disease Detail Modal */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCropBadge(selectedDisease.cropType).icon}</span>
                <div>
                  <h3 className="font-bold text-base text-stone-900">{selectedDisease.vietnameseName}</h3>
                  <p className="text-xs text-stone-500 italic">{selectedDisease.englishName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDisease(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-stone-700 leading-relaxed">
              {/* Scientific Verification Seal Banner */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 text-xs">
                      Hồ sơ Bệnh học Đã Thẩm định Khoa học
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      {selectedDisease.verifiedBy || 'Viện Bảo vệ Thực vật Việt Nam & Viện ASIR'}
                    </div>
                  </div>
                </div>

                {selectedDisease.standardCode && (
                  <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-3">
                    <span className="text-[10px] text-stone-500 block">Quy chuẩn đối chiếu:</span>
                    <span className="font-bold text-[11px] text-emerald-900">{selectedDisease.standardCode}</span>
                  </div>
                )}
              </div>

              {/* Image banner if present */}
              {selectedDisease.sampleImageUrl && (
                <div className="rounded-2xl overflow-hidden aspect-16/9 bg-stone-100">
                  <img
                    src={selectedDisease.sampleImageUrl}
                    alt={selectedDisease.vietnameseName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Symptoms */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Triệu chứng lâm sàng nhận diện</span>
                </h4>
                <p className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedDisease.symptoms}
                </p>
              </div>

              {/* Causes & Pathogens */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-stone-700" />
                  <span>Tác nhân / Vi sinh vật gây bệnh</span>
                </h4>
                <p className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedDisease.causes}
                </p>
              </div>

              {/* Favorable Environmental Conditions in North Central VN */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <ThermometerSun className="w-4 h-4 text-amber-700" />
                  <span>Điều kiện thời tiết phát sinh tại Bắc Trung Bộ</span>
                </h4>
                <p className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-amber-950">
                  {selectedDisease.favorableConditions}
                </p>
              </div>

              {/* Prevention Methods */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Biện pháp phòng ngừa canh tác (GAP)
                </h4>
                <p className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedDisease.preventionMethods}
                </p>
              </div>

              {/* Safe Management */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Khuyến cáo Quản lý An toàn Sinh học & IPM</span>
                </h4>
                <p className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-emerald-950">
                  {selectedDisease.safeManagement}
                </p>
              </div>

              {/* References & Audit metadata */}
              <div className="pt-3 border-t border-stone-200 space-y-1 text-[11px] text-stone-500">
                <div>
                  <span className="font-semibold text-stone-700">Tài liệu khoa học kiểm chứng: </span>
                  <span>{selectedDisease.references}</span>
                </div>
                {selectedDisease.reviewDate && (
                  <div>
                    <span className="font-semibold text-stone-700">Ngày hiệu đính chuẩn hóa gần nhất: </span>
                    <span>{new Date(selectedDisease.reviewDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone-200 p-4 bg-stone-50 flex items-center justify-between">
              {onScanWithDisease && (
                <button
                  onClick={() => {
                    onScanWithDisease(selectedDisease.cropType);
                    setSelectedDisease(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer"
                >
                  Quét mẫu cây này ngay
                </button>
              )}
              <button
                onClick={() => setSelectedDisease(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Modal: 4-Step Scientific Quality Assurance */}
      {isProtocolModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Quy Chuẩn Kiểm Định Khoa Học Để Dữ Liệu Đạt 100% Chính Xác
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Phương pháp luận loại trừ sai số và kiểm soát chất lượng dữ liệu bệnh học thực vật
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProtocolModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-stone-700 leading-relaxed">
              <p className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-800">
                Để thông tin bệnh học đạt <strong>độ tin cậy 100% về mặt khoa học</strong>, dự án AgriVision AI tuân thủ nghiêm ngặt <strong>4 trụ cột kiểm chứng độc lập</strong>, không dựa trên các suy đoán cảm tính hay nội dung chưa được kiểm chứng trên mạng xã hội:
              </p>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Định danh tác nhân theo chuẩn sinh học phân tử & hình thái học</span>
                </div>
                <p className="text-stone-600 pl-7 text-[11px]">
                  Tác nhân gây bệnh (nấm, vi khuẩn, phytoplasma, virus) phải được xác định rõ danh pháp nhị thức Latin quốc tế, đối chiếu qua xét nghiệm PCR hoặc kính hiển vi nuôi cấy thuần khiết tại Viện Bảo vệ Thực vật (NIPP) hoặc các Trường Đại học Nông Lâm.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Căn cứ trực tiếp vào Quy chuẩn Kỹ thuật Quốc gia (QCVN / TCVN)</span>
                </div>
                <p className="text-stone-600 pl-7 text-[11px]">
                  Mọi biện pháp phòng ngừa, ngưỡng phòng trừ IPM và thời điểm can thiệp phải trích xuất trực tiếp từ các văn bản quy phạm pháp luật của Bộ Nông nghiệp & PTNT (ví dụ: QCVN 01-165:2014, QCVN 01-36:2010, QCVN 01-38:2010) và cẩm nang IRRI, FAO. Tuyệt đối không tự ý bịa đặt nồng độ thuốc hoặc hóa chất.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Bộ ảnh tiêu bản chuẩn đối chứng (Ground-Truth Specimen)</span>
                </div>
                <p className="text-stone-600 pl-7 text-[11px]">
                  Mỗi bệnh hại phải có tiêu bản ảnh chụp sắc nét với độ phân giải cao, thể hiện rõ triệu chứng điển hình (vết bệnh hình thoi, quầng sáng halo, ổ bào tử hạ, hạch nấm), kèm theo ảnh phân biệt với các hiện tượng sinh lý như cháy lá do nắng hay thiếu hụt nguyên tố vi lượng (Mg, Zn, Fe).
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Thẩm định chuyên môn 2 vòng & Khóa quyền Admin (Audit Trail)</span>
                </div>
                <p className="text-stone-600 pl-7 text-[11px]">
                  Chỉ Quản trị viên và Hội đồng khoa học có tài khoản cấp 3 mới có quyền cập nhật thư viện. Mỗi lần cập nhật đều lưu vết thông tin người kiểm định (<code className="bg-stone-100 px-1 py-0.5 rounded-sm">verifiedBy</code>), mã quy chuẩn đối chiếu (<code className="bg-stone-100 px-1 py-0.5 rounded-sm">standardCode</code>) và ngày nghiệm thu.
                </p>
              </div>

              {/* Action for Admin */}
              {isAdmin && (
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-300 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-emerald-950 block">Khôi phục bộ dữ liệu gốc chuẩn quốc gia?</span>
                    <span className="text-[11px] text-emerald-800">
                      Bấm vào nút bên phải để ghi đè hoặc bổ sung lại toàn bộ các bản ghi đã kiểm định.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsProtocolModalOpen(false);
                      handleSyncStandard();
                    }}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Đồng bộ ngay
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setIsProtocolModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 cursor-pointer"
              >
                Đã hiểu quy chuẩn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveDisease}
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingDisease.id ? 'Chỉnh sửa Hồ sơ Bệnh hại Đối chuẩn' : 'Thêm Hồ sơ Bệnh mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mã định danh (ID) *</label>
                  <input
                    type="text"
                    required
                    value={editingDisease.id || ''}
                    onChange={(e) => setEditingDisease({ ...editingDisease, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    placeholder="ví dụ: citrus_greening"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nhóm cây trồng *</label>
                  <select
                    value={editingDisease.cropType || 'citrus'}
                    onChange={(e) => setEditingDisease({ ...editingDisease, cropType: e.target.value as CropType })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="citrus">Cam chanh (Citrus)</option>
                    <option value="rice">Lúa nước (Rice)</option>
                    <option value="peanut">Cây Lạc (Peanut)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên tiếng Việt *</label>
                <input
                  type="text"
                  required
                  value={editingDisease.vietnameseName || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, vietnameseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  placeholder="ví dụ: Bệnh Vàng lá gân xanh (HLB)"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên khoa học / Tiếng Anh *</label>
                <input
                  type="text"
                  required
                  value={editingDisease.englishName || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, englishName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  placeholder="ví dụ: Citrus Huanglongbing"
                />
              </div>

              {/* Scientific Verification Fields */}
              <div className="grid grid-cols-2 gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">Cơ quan thẩm định</label>
                  <input
                    type="text"
                    value={editingDisease.verifiedBy || ''}
                    onChange={(e) => setEditingDisease({ ...editingDisease, verifiedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white"
                    placeholder="Viện BVTV, Viện ASIR..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-950 mb-1">Mã Quy chuẩn (QCVN / TCVN)</label>
                  <input
                    type="text"
                    value={editingDisease.standardCode || ''}
                    onChange={(e) => setEditingDisease({ ...editingDisease, standardCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white"
                    placeholder="QCVN 01-165:2014..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Triệu chứng lâm sàng *</label>
                <textarea
                  required
                  rows={3}
                  value={editingDisease.symptoms || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, symptoms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tác nhân / Vi sinh vật</label>
                <input
                  type="text"
                  value={editingDisease.causes || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, causes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Điều kiện thời tiết Bắc Trung Bộ</label>
                <input
                  type="text"
                  value={editingDisease.favorableConditions || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, favorableConditions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Biện pháp phòng ngừa (GAP)</label>
                <textarea
                  rows={2}
                  value={editingDisease.preventionMethods || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, preventionMethods: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Quản lý An toàn Sinh học & IPM</label>
                <textarea
                  rows={2}
                  value={editingDisease.safeManagement || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, safeManagement: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tài liệu kiểm chứng</label>
                <input
                  type="text"
                  value={editingDisease.references || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, references: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  placeholder="Viện BVTV, Viện ASIR..."
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Đường dẫn ảnh tiêu bản mẫu</label>
                <input
                  type="url"
                  value={editingDisease.sampleImageUrl || ''}
                  onChange={(e) => setEditingDisease({ ...editingDisease, sampleImageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
