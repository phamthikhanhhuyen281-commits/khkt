import React, { useEffect, useState } from 'react';
import { 
  Scan, 
  Sprout, 
  BookOpen, 
  Bot, 
  FlaskConical, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Sparkles,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { fetchUserDiagnoses } from '../../services/diagnosisService';
import { fetchDiseases } from '../../services/diseaseService';
import { DiagnosisHistoryItem, DiseaseRecord, CropType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HomeDashboardProps {
  onStartScan: (crop?: CropType) => void;
  onNavigate: (tab: string) => void;
  onSelectDisease?: (disease: DiseaseRecord) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onStartScan, onNavigate, onSelectDisease }) => {
  const { user, isResearcher } = useAuth();
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisHistoryItem[]>([]);
  const [diseases, setDiseases] = useState<DiseaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [diags, dis] = await Promise.all([
          fetchUserDiagnoses(user?.uid),
          fetchDiseases(),
        ]);
        setRecentDiagnoses(diags.slice(0, 4));
        setDiseases(dis);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const cropShowcase = [
    {
      id: 'citrus' as CropType,
      nameVi: 'Cây Cam Chanh & Cây Có Múi',
      nameEn: 'Citrus Spp.',
      icon: '🍊',
      region: 'Nghệ An (Cam Vinh, Quỳ Hợp), Hà Tĩnh (Cam Bù, Bưởi Phúc Trạch)',
      keyDiseases: ['Vàng lá gân xanh (HLB)', 'Loét cam vi khuẩn', 'Ghẻ sẹo nấm'],
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'rice' as CropType,
      nameVi: 'Cây Lúa Nước',
      nameEn: 'Oryza Sativa',
      icon: '🌾',
      region: 'Vùng trọng điểm lúa Lệ Thủy, Yên Thành, Nam Đàn, Thạch Hà, Quảng Điền',
      keyDiseases: ['Đạo ôn lá & Cổ bông', 'Bạc lá vi khuẩn', 'Khô vằn da hổ', 'Đốm nâu'],
      bgGradient: 'from-emerald-500/10 to-green-500/5',
      borderColor: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      id: 'peanut' as CropType,
      nameVi: 'Cây Lạc (Đậu Phộng)',
      nameEn: 'Arachis Hypogaea',
      icon: '🥜',
      region: 'Đất cát pha duyên hải Diễn Châu, Nghi Xuân, Bố Trạch, Gio Linh',
      keyDiseases: ['Đốm lá sớm & muộn', 'Gỉ sắt lá lạc', 'Thối trắng thân héo rũ'],
      bgGradient: 'from-amber-600/10 to-yellow-600/5',
      borderColor: 'border-yellow-200/80',
      badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white p-6 sm:p-10 shadow-xl shadow-emerald-950/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-green-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Nghiên cứu khoa học & Ứng dụng nông nghiệp Bắc Trung Bộ</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white font-sans">
            Sàng lọc Dịch bệnh Cây trồng với <span className="text-emerald-300">Trí tuệ Nhân tạo</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Hỗ trợ bà con nông dân và các nhà nghiên cứu nhận diện chính xác triệu chứng, đánh giá chất lượng ảnh chụp và đối chiếu cơ sở dữ liệu bệnh học thực vật đã được kiểm chứng vùng Nghệ An, Hà Tĩnh, Quảng Bình, Quảng Trị, Thừa Thiên Huế.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartScan()}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-emerald-300 text-emerald-950 hover:from-emerald-300 hover:to-emerald-200 shadow-lg shadow-emerald-950/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Scan className="w-5 h-5 stroke-[2.5]" />
              <span>Chụp / Tải ảnh Quét Bệnh Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('library')}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Tra cứu Thư viện Bệnh</span>
            </button>

            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-xs cursor-pointer"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
              <span>Hỏi Trợ lý AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* Target Crop Groups */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              <span>3 Nhóm Cây trồng Mục tiêu Khảo nghiệm</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Chọn nhóm cây để bắt đầu sàng lọc chuyên biệt với bộ dữ liệu đối chuẩn khoa học
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cropShowcase.map((crop) => (
            <div
              key={crop.id}
              className={`rounded-2xl border ${crop.borderColor} bg-gradient-to-b ${crop.bgGradient} bg-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-3xl p-2 rounded-xl bg-white shadow-xs border border-stone-100">
                    {crop.icon}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${crop.badgeBg}`}>
                    {crop.nameEn}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {crop.nameVi}
                  </h3>
                  <div className="flex items-start gap-1.5 text-xs text-stone-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{crop.region}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/60">
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Dịch hại nguy hiểm trọng điểm:
                  </p>
                  <ul className="space-y-1">
                    {crop.keyDiseases.map((d, idx) => (
                      <li key={idx} className="text-xs text-stone-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <button
                  onClick={() => onStartScan(crop.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Quét bệnh cho cây {crop.nameVi.split(' ')[1]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regional Knowledge Highlights & Weather Epidemiology Notice */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-stone-900 text-base">
                Cảnh báo Dịch tễ Nông nghiệp Mùa vụ Vùng Bắc Trung Bộ
              </h3>
              <span className="text-[11px] font-medium text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                Cập nhật chuyên gia ASIR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              Thời tiết vụ Đông Xuân và chuyển mùa có sương mù kéo dài, độ ẩm không khí thường xuyên vượt <strong>85-95%</strong> tại Nghệ An, Hà Tĩnh, Quảng Bình. Đây là điều kiện tối ưu bùng phát nấm <strong>Đạo ôn lá (Pyricularia oryzae)</strong> trên lúa và các đợt phát sinh <strong>rầy chổng cánh (Diaphorina citri)</strong> truyền bệnh vàng lá gân xanh (HLB) trên các vườn cam đang bung đợt lộc non.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Thường xuyên thăm đồng sáng sớm
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bón phân N-P-K cân đối, ngưng bón đạm thừa
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chụp ảnh vết bệnh nghi ngờ để sàng lọc kịp thời
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Diagnoses & Quick Scientific Library Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Diagnoses */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Hồ sơ Chẩn đoán Gần đây</span>
              </h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-stone-400">Đang tải dữ liệu...</div>
            ) : recentDiagnoses.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-stone-500">Bạn chưa thực hiện lượt quét chẩn đoán nào.</p>
                <button
                  onClick={() => onStartScan()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Quét mẫu đầu tiên</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDiagnoses.map((diag) => (
                  <div
                    key={diag.id}
                    onClick={() => onNavigate('history')}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-stone-50/80 transition-all cursor-pointer"
                  >
                    <img
                      src={diag.imageUrl}
                      alt="Plant sample"
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {diag.suspectedDiseases[0] || 'Chẩn đoán sơ bộ'}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-sm bg-stone-100 text-stone-600 capitalize">
                          {diag.cropType === 'citrus' ? 'Cam' : diag.cropType === 'rice' ? 'Lúa' : 'Lạc'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        Chất lượng ảnh: <span className="font-medium text-stone-700">{diag.imageQuality}</span> • Bộ phận: {diag.plantPart}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {new Date(diag.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      {diag.verificationStatus === 'expert_verified' ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          Đã thẩm định
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                          AI sơ bộ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Scientific Knowledge Snippet */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Thư viện Bệnh học Thực vật Đã Kiểm chứng</span>
              </h3>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Tra cứu tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {diseases.slice(0, 3).map((dis) => (
                <div
                  key={dis.id}
                  onClick={() => onNavigate('library')}
                  className="p-3 rounded-xl border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 hover:text-emerald-800">
                      {dis.vietnameseName}
                    </h4>
                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      {dis.cropType === 'citrus' ? 'Cam quýt' : dis.cropType === 'rice' ? 'Lúa' : 'Lạc'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                    {dis.symptoms}
                  </p>
                  <div className="mt-2 text-[10px] text-stone-400 flex items-center justify-between">
                    <span>Tài liệu: {dis.references.split(';')[0]}</span>
                    <span className="text-emerald-700 font-medium">Chi tiết →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Tổng cộng {diseases.length} bệnh hại đã lưu chuẩn hóa</span>
            {isResearcher && (
              <button
                onClick={() => onNavigate('research')}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Xem ma trận nhầm lẫn & mẫu đối chứng</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
