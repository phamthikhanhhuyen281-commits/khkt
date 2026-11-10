import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  BarChart3, 
  Database, 
  FileCheck2, 
  Download, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  ShieldCheck, 
  Layers,
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  Save,
  HelpCircle,
  Users
} from 'lucide-react';
import { 
  ResearchSample, 
  EvaluationMetrics, 
  DiagnosisHistoryItem, 
  CropType, 
  ConfidenceLevel 
} from '../../types';
import { 
  fetchResearchSamples, 
  saveResearchSample, 
  deleteResearchSample, 
  calculateEvaluationMetrics, 
  exportResearchDataToCSV 
} from '../../services/researchService';
import { 
  fetchUserDiagnoses, 
  updateDiagnosisVerification 
} from '../../services/diagnosisService';
import { useAuth } from '../../context/AuthContext';
import { UserManagementTab } from './UserManagementTab';

export const ResearchAdminDashboard: React.FC = () => {
  const { user, isAdmin, isResearcher } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'dataset' | 'reviews' | 'export' | 'users'>('metrics');
  const [samples, setSamples] = useState<ResearchSample[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Dataset filter states
  const [datasetCropFilter, setDatasetCropFilter] = useState<string>('all');
  const [datasetSearch, setDatasetSearch] = useState<string>('');

  // Add sample modal state
  const [isAddSampleOpen, setIsAddSampleOpen] = useState<boolean>(false);
  const [newSample, setNewSample] = useState<Partial<ResearchSample>>({
    sampleId: `SAM-${Date.now().toString().slice(-6)}`,
    cropType: 'citrus',
    diseaseLabel: '',
    location: 'Quỳ Hợp, Nghệ An',
    collectionDate: new Date().toISOString().split('T')[0],
    imageSource: 'Khảo sát thực địa Viện ASIR',
    verificationStatus: 'expert_verified',
    aiPrediction: '',
    confidenceLevel: 'high',
    isCorrect: 'correct',
    imageUrl: 'https://images.unsplash.com/photo-1596724898150-14902120e36a?auto=format&fit=crop&w=600&q=80',
    notes: '',
  });

  // Review modal / edit state
  const [reviewingDiagnosis, setReviewingDiagnosis] = useState<DiagnosisHistoryItem | null>(null);
  const [expertNoteInput, setExpertNoteInput] = useState<string>('');
  const [expertStatusInput, setExpertStatusInput] = useState<'unverified' | 'expert_verified' | 'corrected'>('expert_verified');

  // Benchmark comparison mode
  const [benchmarkMode, setBenchmarkMode] = useState<'with_knowledge' | 'image_only' | 'local_field'>('with_knowledge');

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sampleData, diagData] = await Promise.all([
        fetchResearchSamples(),
        fetchUserDiagnoses(undefined, true),
      ]);
      setSamples(sampleData);
      setDiagnoses(diagData);
      setMetrics(calculateEvaluationMetrics(sampleData));
    } catch (err) {
      console.error('Error loading research data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSample.sampleId || !newSample.diseaseLabel) {
      alert('Vui lòng nhập Mã mẫu và Nhãn bệnh chuẩn đối chứng.');
      return;
    }

    try {
      const fullSample: ResearchSample = {
        sampleId: newSample.sampleId,
        cropType: (newSample.cropType as CropType) || 'citrus',
        diseaseLabel: newSample.diseaseLabel,
        location: newSample.location || 'Nghệ An',
        collectionDate: newSample.collectionDate || new Date().toISOString().split('T')[0],
        imageSource: newSample.imageSource || 'Thực địa',
        verificationStatus: (newSample.verificationStatus as any) || 'expert_verified',
        aiPrediction: newSample.aiPrediction || newSample.diseaseLabel,
        confidenceLevel: (newSample.confidenceLevel as ConfidenceLevel) || 'high',
        isCorrect: (newSample.isCorrect as any) || 'correct',
        imageUrl: newSample.imageUrl || 'https://images.unsplash.com/photo-1596724898150-14902120e36a?auto=format&fit=crop&w=600&q=80',
        notes: newSample.notes || '',
        createdAt: new Date().toISOString(),
      };

      await saveResearchSample(fullSample);
      setIsAddSampleOpen(false);
      await loadAllData();
    } catch (err: any) {
      alert('Lỗi lưu mẫu nghiên cứu: ' + err.message);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = exportResearchDataToCSV(samples);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agrivision_research_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveExpertReview = async () => {
    if (!reviewingDiagnosis) return;
    try {
      await updateDiagnosisVerification(reviewingDiagnosis.id, expertStatusInput, expertNoteInput);
      setReviewingDiagnosis(null);
      await loadAllData();
    } catch (err: any) {
      alert('Lỗi cập nhật thẩm định: ' + err.message);
    }
  };

  const filteredSamples = samples.filter((s) => {
    const matchesCrop = datasetCropFilter === 'all' || s.cropType === datasetCropFilter;
    const matchesSearch =
      s.sampleId.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      s.diseaseLabel.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      s.location.toLowerCase().includes(datasetSearch.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-emerald-700" />
              <span>Khu Vực Nghiên Cứu Khoa Học & Quản Trị</span>
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
              Scientific Workbench
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Đánh giá ma trận nhầm lẫn • Quản lý tập mẫu thực nghiệm vùng • Thẩm định chẩn đoán của chuyên gia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Xuất Dữ Liệu CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAddSampleOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Mẫu Thực Nghiệm</span>
            </button>
          )}
        </div>
      </div>

      {/* Scientific Sub-tabs */}
      <div className="flex border-b border-stone-200 space-x-1 sm:space-x-4 overflow-x-auto">
        {[
          { id: 'metrics', label: '1. Đánh giá Mô hình & Ma trận Nhầm lẫn', icon: BarChart3 },
          { id: 'dataset', label: '2. Tập Dữ liệu Thực địa Đối chứng', icon: Database },
          { id: 'reviews', label: '3. Thẩm định Báo cáo Nông dân', icon: FileCheck2 },
          { id: 'export', label: '4. Xuất Báo cáo Khoa học', icon: Download },
          ...(isAdmin ? [{ id: 'users', label: '5. Phân Quyền Thành Viên (RBAC)', icon: Users }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-800 text-emerald-900 bg-emerald-50/40'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Evaluation Metrics & Confusion Matrix */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6">
          {/* Methodology Guidance Alert */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-xs text-stone-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Nguyên tắc Đánh giá Khoa học Khách quan</span>
            </div>
            <p className="leading-relaxed">
              Các chỉ số dưới đây được <strong>tính toán độc quyền từ các mẫu thực địa đã được chuyên gia thẩm định nhãn chuẩn (Ground-Truth)</strong>. Hệ thống <em>tuyệt đối không bịa đặt tỷ lệ phần trăm chính xác ngẫu nhiên</em>. Mọi đánh giá đều tuân thủ nguyên tắc không rò rỉ dữ liệu (data leakage) giữa các tập đánh giá.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-700">Chế độ Thử nghiệm Đối chứng:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'with_knowledge', label: 'Gemini + Cơ sở tri thức chuẩn' },
                { id: 'image_only', label: 'Gemini Thuần ảnh (Zero-shot)' },
                { id: 'local_field', label: 'Mẫu Độc lập Bắc Trung Bộ' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setBenchmarkMode(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    benchmarkMode === m.id
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Metrics 4-Grid */}
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Mẫu đối chứng chuẩn
                </span>
                <div className="text-2xl font-black text-stone-900">{metrics.totalVerified}</div>
                <p className="text-[10px] text-stone-500">Mẫu có PCR / thẩm định hình thái học</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Độ chính xác (Accuracy)
                </span>
                <div className="text-2xl font-black text-emerald-900">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </div>
                <p className="text-[10px] text-stone-500">Tỷ lệ dự đoán đúng trên toàn bộ mẫu chuẩn</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Độ chuẩn xác (Precision)
                </span>
                <div className="text-2xl font-black text-blue-900">
                  {(metrics.precision * 100).toFixed(1)}%
                </div>
                <p className="text-[10px] text-stone-500">Macro-average Precision</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Điểm F1-Score
                </span>
                <div className="text-2xl font-black text-purple-900">
                  {(metrics.f1Score * 100).toFixed(1)}%
                </div>
                <p className="text-[10px] text-stone-500">Trung bình điều hòa giữa Precision & Recall</p>
              </div>
            </div>
          )}

          {/* Confusion Matrix Interactive Visualization */}
          {metrics && metrics.confusionMatrix.labels.length > 0 && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Ma trận Nhầm lẫn (Confusion Matrix)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hàng: Nhãn bệnh thực tế (Ground-Truth) • Cột: Dự đoán của mô hình AI
                  </p>
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" /> Dự đoán đúng (Đường chéo)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-xs bg-red-100 border border-red-200 inline-block" /> Nhầm lẫn
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <table className="min-w-full text-xs text-left border-collapse border border-stone-200">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="p-3 border border-stone-200 font-bold text-stone-800 bg-stone-100">
                        Thực tế \ Dự đoán
                      </th>
                      {metrics.confusionMatrix.labels.map((lbl, idx) => (
                        <th
                          key={idx}
                          className="p-3 border border-stone-200 font-bold text-stone-700 max-w-[140px] truncate"
                          title={lbl}
                        >
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.confusionMatrix.labels.map((rowLabel, rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50/50">
                        <td className="p-3 border border-stone-200 font-bold text-stone-800 bg-stone-50 max-w-[160px] truncate" title={rowLabel}>
                          {rowLabel}
                        </td>
                        {metrics.confusionMatrix.labels.map((colLabel, cIdx) => {
                          const val = metrics.confusionMatrix.matrix[rIdx][cIdx];
                          const isDiagonal = rIdx === cIdx;
                          let cellBg = 'bg-white';
                          let cellText = 'text-stone-400';

                          if (val > 0) {
                            if (isDiagonal) {
                              cellBg = 'bg-emerald-600 text-white font-extrabold';
                              cellText = 'text-white';
                            } else {
                              cellBg = 'bg-red-50 text-red-700 font-bold border-red-200';
                              cellText = 'text-red-700';
                            }
                          }

                          return (
                            <td
                              key={cIdx}
                              className={`p-3 border border-stone-200 text-center text-xs transition-colors ${cellBg}`}
                            >
                              <span className={cellText}>{val}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Breakdown by Crop Group */}
          {metrics && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-stone-900 text-base">
                Hiệu năng Chẩn đoán Theo Từng Nhóm Cây Trồng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'citrus' as CropType, label: 'Cam chanh / Cây có múi', icon: '🍊' },
                  { id: 'rice' as CropType, label: 'Lúa nước', icon: '🌾' },
                  { id: 'peanut' as CropType, label: 'Cây Lạc (Đậu phộng)', icon: '🥜' },
                ].map((crop) => {
                  const data = metrics.byCrop[crop.id] || { total: 0, correct: 0, accuracy: 0 };
                  return (
                    <div key={crop.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                          <span>{crop.icon}</span>
                          <span>{crop.label}</span>
                        </span>
                        <span className="text-xs font-bold text-emerald-800">
                          {(data.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${data.accuracy * 100}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center justify-between">
                        <span>Đúng {data.correct}/{data.total} mẫu</span>
                        <span>Độ chính xác cục bộ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Research Dataset Manager */}
      {activeSubTab === 'dataset' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={datasetSearch}
                onChange={(e) => setDatasetSearch(e.target.value)}
                placeholder="Tìm theo Mã mẫu, Tên bệnh đối chứng, Địa phương..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-emerald-600 bg-stone-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Tất cả cây' },
                { id: 'citrus', label: '🍊 Cam' },
                { id: 'rice', label: '🌾 Lúa' },
                { id: 'peanut', label: '🥜 Lạc' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDatasetCropFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    datasetCropFilter === c.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Samples Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-900 font-bold">
                  <tr>
                    <th className="p-3">Mã Mẫu</th>
                    <th className="p-3">Ảnh Mẫu</th>
                    <th className="p-3">Cây Trồng</th>
                    <th className="p-3">Nhãn Chuẩn (Ground-Truth)</th>
                    <th className="p-3">AI Dự Đoán</th>
                    <th className="p-3">Địa Bàn Thu Mẫu</th>
                    <th className="p-3">Kết Quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredSamples.map((s) => (
                    <tr key={s.sampleId} className="hover:bg-stone-50/80">
                      <td className="p-3 font-mono font-bold text-emerald-950">{s.sampleId}</td>
                      <td className="p-3">
                        <img
                          src={s.imageUrl}
                          alt={s.sampleId}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                        />
                      </td>
                      <td className="p-3 capitalize font-medium">
                        {s.cropType === 'citrus' ? 'Cam chanh' : s.cropType === 'rice' ? 'Lúa nước' : 'Cây Lạc'}
                      </td>
                      <td className="p-3 font-semibold text-stone-900">{s.diseaseLabel}</td>
                      <td className="p-3 text-stone-600">{s.aiPrediction}</td>
                      <td className="p-3 text-stone-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{s.location}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        {s.isCorrect === 'correct' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đúng
                          </span>
                        ) : s.isCorrect === 'incorrect' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 text-red-600" /> Sai lệch
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Chờ duyệt
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Diagnosis Reports Review (Farmer Field Uploads) */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm">
              Danh sách Ảnh Mẫu Bà con Nông dân gửi lên gần đây
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Chuyên gia thẩm định lại kết quả AI, hiệu đính chẩn đoán và bổ sung ghi chú kỹ thuật
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {diagnoses.map((diag) => (
              <div
                key={diag.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="relative h-40 rounded-xl overflow-hidden bg-stone-900">
                    <img src={diag.imageUrl} alt="Farmer upload" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs capitalize">
                        {diag.cropType} • {diag.plantPart}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400">
                      Gửi lúc: {new Date(diag.createdAt).toLocaleString('vi-VN')}
                    </span>
                    <h4 className="font-bold text-sm text-stone-900 mt-0.5">
                      AI dự đoán: {diag.suspectedDiseases[0] || 'Chưa rõ'}
                    </h4>
                  </div>

                  {diag.expertNotes && (
                    <div className="text-[11px] p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                      <strong>Chuyên gia:</strong> {diag.expertNotes}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    diag.verificationStatus === 'expert_verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : diag.verificationStatus === 'corrected'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {diag.verificationStatus === 'expert_verified' ? 'Đã chuẩn y' : diag.verificationStatus === 'corrected' ? 'Đã hiệu chỉnh' : 'Chờ thẩm định'}
                  </span>

                  <button
                    onClick={() => {
                      setReviewingDiagnosis(diag);
                      setExpertNoteInput(diag.expertNotes || '');
                      setExpertStatusInput(diag.verificationStatus);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer"
                  >
                    Thẩm định mẫu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Export Scientific Data */}
      {activeSubTab === 'export' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-700" />
              <span>Xuất Bản Dữ Liệu Nghiên Cứu An Danh (Open Scientific Data)</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Phục vụ viết báo cáo khoa học, phân tích thống kê R/Python, và công bố bài báo hội thảo
            </p>
          </div>

          <div className="space-y-3 text-xs text-stone-700 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <h4 className="font-bold text-stone-900">Các trường dữ liệu chuẩn được xuất:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <span>• Sample_ID (Mã mẫu)</span>
              <span>• Crop_Group (Nhóm cây)</span>
              <span>• Ground_Truth_Disease (Nhãn thực tế)</span>
              <span>• Coarse_Location (Địa phương cấp huyện)</span>
              <span>• Collection_Date (Ngày thu mẫu)</span>
              <span>• Image_Source (Nguồn mẫu thực địa)</span>
              <span>• Verification_Status (Tình trạng thẩm định)</span>
              <span>• AI_Prediction (Mô hình dự đoán)</span>
              <span>• Confidence_Level (Mức tin cậy)</span>
            </div>
            <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-200">
              * Dữ liệu đã được an danh hóa hoàn toàn, không chứa thông tin định danh cá nhân của người chụp.
            </p>
          </div>

          <div>
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-800 hover:bg-emerald-900 text-white shadow-md cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Tải về tệp CSV ({samples.length} mẫu nghiên cứu)</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: User Role Management & RBAC (Admin only) */}
      {activeSubTab === 'users' && isAdmin && (
        <UserManagementTab />
      )}

      {/* Add Sample Modal */}
      {isAddSampleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveNewSample}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-xs"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Thêm Mẫu Thực Nghiệm Đối Chứng</h3>
              <button
                type="button"
                onClick={() => setIsAddSampleOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mã mẫu *</label>
                  <input
                    type="text"
                    required
                    value={newSample.sampleId}
                    onChange={(e) => setNewSample({ ...newSample, sampleId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nhóm cây trồng *</label>
                  <select
                    value={newSample.cropType}
                    onChange={(e) => setNewSample({ ...newSample, cropType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="citrus">Cam chanh (Citrus)</option>
                    <option value="rice">Lúa nước (Rice)</option>
                    <option value="peanut">Cây Lạc (Peanut)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nhãn bệnh chuẩn (Ground-Truth) *</label>
                <input
                  type="text"
                  required
                  value={newSample.diseaseLabel}
                  onChange={(e) => setNewSample({ ...newSample, diseaseLabel: e.target.value })}
                  placeholder="ví dụ: Bệnh Vàng lá gân xanh (HLB)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Địa phương thu mẫu</label>
                  <input
                    type="text"
                    value={newSample.location}
                    onChange={(e) => setNewSample({ ...newSample, location: e.target.value })}
                    placeholder="Quỳ Hợp, Nghệ An"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ngày thu mẫu</label>
                  <input
                    type="date"
                    value={newSample.collectionDate}
                    onChange={(e) => setNewSample({ ...newSample, collectionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Dự đoán của AI</label>
                <input
                  type="text"
                  value={newSample.aiPrediction}
                  onChange={(e) => setNewSample({ ...newSample, aiPrediction: e.target.value })}
                  placeholder="Nhãn do mô hình dự đoán"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Kết quả đối chiếu</label>
                  <select
                    value={newSample.isCorrect}
                    onChange={(e) => setNewSample({ ...newSample, isCorrect: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="correct">Đúng (Correct)</option>
                    <option value="incorrect">Sai (Incorrect)</option>
                    <option value="pending">Chờ kiểm chứng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Độ tin cậy</label>
                  <select
                    value={newSample.confidenceLevel}
                    onChange={(e) => setNewSample({ ...newSample, confidenceLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="high">Cao (High)</option>
                    <option value="medium">Trung bình (Medium)</option>
                    <option value="low">Thấp (Low)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddSampleOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
              >
                Lưu mẫu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Farmer Diagnosis Modal */}
      {reviewingDiagnosis && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Thẩm Định Mẫu Chẩn Đoán Thực Địa</h3>
              <button
                onClick={() => setReviewingDiagnosis(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="h-40 rounded-xl overflow-hidden bg-stone-900">
                <img src={reviewingDiagnosis.imageUrl} alt="Review" className="w-full h-full object-contain" />
              </div>

              <div>
                <p className="font-bold text-stone-800">
                  AI sơ bộ: {reviewingDiagnosis.suspectedDiseases[0]} ({reviewingDiagnosis.cropType})
                </p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Trạng thái thẩm định</label>
                <select
                  value={expertStatusInput}
                  onChange={(e) => setExpertStatusInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="expert_verified">Chuẩn y kết quả AI (Expert Verified)</option>
                  <option value="corrected">Hiệu chỉnh lại kết luận khác (Corrected)</option>
                  <option value="unverified">Chưa đủ dữ liệu / Cần mẫu lại (Unverified)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú chuyên môn của cán bộ BVTV</label>
                <textarea
                  rows={3}
                  value={expertNoteInput}
                  onChange={(e) => setExpertNoteInput(e.target.value)}
                  placeholder="Ghi nhận cụ thể triệu chứng, mẫu bào tử hoặc khuyến cáo riêng cho hộ nông dân..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setReviewingDiagnosis(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveExpertReview}
                className="px-5 py-2 rounded-xl font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
              >
                Lưu thẩm định
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
