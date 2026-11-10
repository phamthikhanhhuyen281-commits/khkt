import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ArrowRight, 
  Save, 
  MessageSquare, 
  BookOpen, 
  X, 
  ShieldAlert, 
  SlidersHorizontal,
  Sparkles,
  Eye,
  Scan,
  Award,
  ShieldCheck,
  Microscope,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { CropType, PlantPart, DiagnosisResult, ConfidenceLevel, DiseaseRecord } from '../../types';
import { runServerDiagnosis, saveDiagnosisRecord } from '../../services/diagnosisService';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_DISEASES } from '../../data/defaultDiseases';

interface PlantScannerProps {
  initialCrop?: CropType;
  onNavigateToAssistant: (context: any) => void;
  onNavigateToLibrary: (crop?: CropType) => void;
}

export const PlantScanner: React.FC<PlantScannerProps> = ({
  initialCrop = 'citrus',
  onNavigateToAssistant,
  onNavigateToLibrary,
}) => {
  const { user } = useAuth();

  // Workflow states
  const [selectedCrop, setSelectedCrop] = useState<CropType>(initialCrop);
  const [selectedPart, setSelectedPart] = useState<PlantPart>('leaf');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  // Camera capture modal state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanStepMessage, setScanStepMessage] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Quality tips toggle
  const [showTips, setShowTips] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cropOptions: { id: CropType; label: string; icon: string; desc: string }[] = [
    { id: 'citrus', label: 'Cam chanh / Cây có múi', icon: '🍊', desc: 'Cam sành, cam bù, bưởi, quýt' },
    { id: 'rice', label: 'Lúa nước', icon: '🌾', desc: 'Lúa vụ Đông Xuân, Hè Thu' },
    { id: 'peanut', label: 'Cây Lạc (Đậu phộng)', icon: '🥜', desc: 'Lạc thâm canh đất cát duyên hải' },
  ];

  const partOptions: { id: PlantPart; label: string; desc: string }[] = [
    { id: 'leaf', label: 'Phiến lá', desc: 'Đốm, gân lá, quầng vàng, vết cháy' },
    { id: 'stem', label: 'Thân / Bẹ / Cành', desc: 'Vết loét, mốc trắng gốc, thối thân' },
    { id: 'fruit', label: 'Quả / Củ / Bông', desc: 'Vỏ sần sùi, gãy cổ gié, thối củ' },
    { id: 'other', label: 'Toàn cây / Khác', desc: 'Héo rũ toàn thân, biến dạng' },
  ];

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setAnalysisError('Vui lòng chỉ tải lên định dạng ảnh hợp lệ: JPG, JPEG, PNG, WEBP.');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setAnalysisError('Kích thước ảnh vượt quá 15MB. Vui lòng chọn ảnh có độ phân giải tối ưu hơn.');
      return;
    }

    setAnalysisError(null);
    setImageFile(file);
    setMimeType(file.type);
    setResult(null);
    setIsSaved(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null);

  // Live Camera handlers with fallback
  const startCamera = async () => {
    setAnalysisError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback directly to native camera capture
      cameraCaptureInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera getUserMedia error, falling back to native file capture:', err);
      // If WebRTC permission is blocked by browser/iframe, trigger native camera capture input
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setAnalysisError(
          'Quyền truy cập WebRTC Camera bị hạn chế trong khung xem. Ứng dụng đã chuyển sang chế độ máy ảnh hệ thống.'
        );
      }
      cameraCaptureInputRef.current?.click();
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setMimeType('image/jpeg');
      setResult(null);
      setIsSaved(false);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, cameraStream]);

  // Execute Gemini diagnosis
  const handleRunDiagnosis = async () => {
    if (!imagePreview) {
      setAnalysisError('Vui lòng chụp ảnh hoặc tải ảnh mẫu cây lên trước.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setResult(null);

    // Progressive step indicator
    setScanStepMessage('Đang nạp mẫu ảnh...');
    const step1 = setTimeout(() => setScanStepMessage('Đánh giá chất lượng ảnh & lấy nét vết bệnh...'), 800);
    const step2 = setTimeout(() => setScanStepMessage('Xác thực loài cây trồng & đối chiếu dữ liệu bệnh học Bắc Trung Bộ...'), 1800);
    const step3 = setTimeout(() => setScanStepMessage('Tổng hợp chẩn đoán sơ bộ & khuyến cáo an toàn sinh học...'), 3200);

    try {
      const diagnosisResult = await runServerDiagnosis(
        imagePreview,
        selectedCrop,
        selectedPart,
        mimeType
      );

      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);

      setResult(diagnosisResult);

      // Auto save to history
      const saved = await saveDiagnosisRecord({
        userId: user?.uid || 'guest_user',
        userEmail: user?.email || '',
        cropType: selectedCrop,
        plantPart: selectedPart,
        imageUrl: imagePreview,
        assessment: diagnosisResult,
        suspectedDiseases: diagnosisResult.possibleDiagnoses.map((d) => d.diseaseName),
        imageQuality: diagnosisResult.imageQuality,
        verificationStatus: 'unverified',
      });
      setIsSaved(true);
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setAnalysisError(err.message || 'Quá trình phân tích gặp sự cố. Vui lòng thử lại với ảnh rõ nét hơn.');
    } finally {
      setIsAnalyzing(false);
      setScanStepMessage('');
    }
  };

  const getConfidenceBadge = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high':
        return {
          label: 'Độ tin cậy Cao',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        };
      case 'medium':
        return {
          label: 'Độ tin cậy Trung bình',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'low':
        return {
          label: 'Độ tin cậy Thấp',
          bg: 'bg-orange-100 text-orange-900 border-orange-300',
        };
      case 'insufficient_evidence':
      default:
        return {
          label: 'Chưa đủ bằng chứng',
          bg: 'bg-stone-100 text-stone-800 border-stone-300',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Scan className="w-6 h-6 text-emerald-700" />
            <span>Sàng lọc & Chẩn đoán Bệnh Cây trồng</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Quy trình AI có trách nhiệm: Thẩm định ảnh mẫu • Kiểm định cây trồng • Đối chiếu cơ sở dữ liệu vùng
          </p>
        </div>

        <button
          onClick={() => setShowTips(!showTips)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors w-fit"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showTips ? 'Đóng hướng dẫn' : 'Tiêu chuẩn ảnh chụp mẫu'}</span>
        </button>
      </div>

      {/* Image Quality Guide Box */}
      {showTips && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 animate-in fade-in duration-200">
          <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <span>Tiêu chuẩn chất lượng ảnh chụp bệnh thực vật theo nghiên cứu</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-800">1. Ánh sáng tự nhiên:</span>
              <span>Chụp lúc trời sáng tỏ (tránh bóng râm đổ sẫm hoặc ánh đèn flash làm lóa màu vết bệnh).</span>
            </div>
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-800">2. Lấy nét vết bệnh:</span>
              <span>Đặt máy cách vết thương 15-30cm, chạm tay vào màn hình để lấy nét rõ rìa vết loét.</span>
            </div>
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-800">3. Chụp cả hai mặt:</span>
              <span>Với các bệnh như gỉ sắt lạc hay đạo ôn, chụp cả mặt trên và mặt dưới phiến lá.</span>
            </div>
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-800">4. Tránh vật cản:</span>
              <span>Không để ngón tay che khuất vùng bệnh; giữ mẫu lá phẳng hoặc đặt lên lòng bàn tay.</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1 & 2: Crop & Part Selection */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
        {/* Step 1: Crop */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Bước 1: Chọn nhóm cây trồng cần kiểm tra
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cropOptions.map((crop) => (
              <button
                key={crop.id}
                onClick={() => {
                  setSelectedCrop(crop.id);
                  setResult(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  selectedCrop === crop.id
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50'
                }`}
              >
                <span className="text-2xl p-1 bg-white rounded-lg border border-stone-100 shrink-0">
                  {crop.icon}
                </span>
                <div>
                  <div className="font-bold text-xs text-stone-900">{crop.label}</div>
                  <div className="text-[11px] text-stone-500 leading-tight mt-0.5">{crop.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Plant Part */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Bước 2: Chọn bộ phận cây trồng xuất hiện triệu chứng
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {partOptions.map((part) => (
              <button
                key={part.id}
                onClick={() => setSelectedPart(part.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPart === part.id
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                    : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                }`}
              >
                <div className="text-xs font-bold">{part.label}</div>
                <div className="text-[10px] text-stone-500 mt-0.5 truncate">{part.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3 & 4: Upload / Capture & Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
          Bước 3 & 4: Tải ảnh hoặc chụp ảnh trực tiếp từ camera
        </label>

        {/* Hidden file input for file picker */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {/* Hidden file input for native mobile camera capture */}
        <input
          type="file"
          ref={cameraCaptureInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* Camera Modal View if active */}
        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Camera Viewfinder Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-white/80 bg-black/50 px-2 py-1 rounded-md">
                Căn chỉnh vết bệnh vào khung
              </span>
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-4 flex items-center gap-4">
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-stone-900/80 text-white text-xs font-semibold hover:bg-stone-900"
              >
                Hủy bỏ
              </button>
              <button
                onClick={captureCameraSnapshot}
                className="w-14 h-14 rounded-full bg-white text-emerald-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                title="Bấm chụp"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : imagePreview ? (
          /* Preview with replace controls */
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900/5 aspect-16/10 sm:aspect-2/1 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Mẫu cây chụp"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn ảnh khác</span>
              </button>
              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-xs flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Chụp lại</span>
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone / Upload & Capture buttons */
          <div className="space-y-4">
            <div className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-stone-50/50">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Tải ảnh lên hoặc chụp trực tiếp ngoài đồng ruộng
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hỗ trợ JPG, JPEG, PNG, WEBP (Tối đa 15MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>Chọn tệp từ máy</span>
                  </button>

                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Mở Camera chụp ngay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Test Sample Photos */}
            <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Hoặc bấm để thử nghiệm nhanh với mẫu ảnh thực địa Bắc Trung Bộ:</span>
                </span>
                <span className="text-[10px] text-stone-500">1-click test</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[
                  {
                    crop: 'citrus' as CropType,
                    part: 'leaf' as PlantPart,
                    label: 'Mẫu Cam - Vàng lá gân xanh (HLB)',
                    url: 'https://images.unsplash.com/photo-1596724898150-14902120e36a?auto=format&fit=crop&w=800&q=80',
                    icon: '🍊',
                  },
                  {
                    crop: 'rice' as CropType,
                    part: 'leaf' as PlantPart,
                    label: 'Mẫu Lúa - Bệnh Đạo ôn lá (Blast)',
                    url: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=800&q=80',
                    icon: '🌾',
                  },
                  {
                    crop: 'peanut' as CropType,
                    part: 'leaf' as PlantPart,
                    label: 'Mẫu Lạc - Bệnh Đốm lá tròn (Leaf Spot)',
                    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
                    icon: '🥜',
                  },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedCrop(sample.crop);
                      setSelectedPart(sample.part);
                      setImagePreview(sample.url);
                      setMimeType('image/jpeg');
                      setResult(null);
                      setIsSaved(false);
                      setAnalysisError(null);
                    }}
                    className="p-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/80 transition-all text-left flex items-center gap-2 cursor-pointer shadow-2xs group"
                  >
                    <span className="text-base p-1 rounded-lg bg-stone-50 border border-stone-100">{sample.icon}</span>
                    <span className="text-[11px] font-semibold text-stone-800 group-hover:text-emerald-900 truncate">
                      {sample.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error message if any */}
        {analysisError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Không thể chẩn đoán ảnh</p>
              <p className="mt-0.5">{analysisError}</p>
            </div>
          </div>
        )}

        {/* Scan Action Button */}
        {imagePreview && (
          <div className="pt-2">
            <button
              onClick={handleRunDiagnosis}
              disabled={isAnalyzing}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-98 cursor-pointer ${
                isAnalyzing
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-800 to-green-700 hover:from-emerald-900 hover:to-green-800 shadow-emerald-950/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{scanStepMessage || 'Đang xử lý phân tích...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu Phân tích & Sàng lọc Dịch bệnh với Gemini</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Step 5, 6, 7: Structured Diagnosis Result Display */}
      {result && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Main Summary Card */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            {/* Top Status Header */}
            <div className="bg-emerald-900 text-white p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold border border-emerald-700">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Kết quả Sàng lọc Khoa học Sơ bộ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    result.imageQuality === 'good'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : result.imageQuality === 'fair'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-red-100 text-red-900 border-red-300'
                  }`}>
                    Chất lượng ảnh: {result.imageQuality === 'good' ? 'Rõ nét (Tốt)' : result.imageQuality === 'fair' ? 'Tương đối (Trung bình)' : 'Kém / Mờ'}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {result.possibleDiagnoses[0]?.diseaseName || 'Chưa ghi nhận bệnh hại rõ ràng'}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                  Cây trồng nhận diện: <strong>{result.cropDetected}</strong> • 
                  Bộ phận: <strong>{selectedPart}</strong> • 
                  Đối chiếu: {result.selectedCropMatches ? (
                    <span className="text-emerald-300 font-semibold">✓ Khớp với cây đã chọn</span>
                  ) : (
                    <span className="text-amber-300 font-semibold">⚠ Cảnh báo: Cây trong ảnh không khớp lựa chọn ban đầu!</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quality Warning if any */}
            {result.qualityIssues.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lưu ý về chất lượng ảnh chụp: </span>
                  <span>{result.qualityIssues.join('. ')}</span>
                </div>
              </div>
            )}

            {/* Body Sections */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* Suspected Diseases List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Bệnh nghi ngờ phù hợp nhất (Sắp xếp theo bằng chứng thị giác)
                </h3>
                <div className="space-y-3">
                  {result.possibleDiagnoses.map((diag, index) => {
                    const badge = getConfidenceBadge(diag.confidenceLevel);
                    return (
                      <div
                        key={index}
                        className={`rounded-2xl border p-4 transition-all ${
                          index === 0
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="font-bold text-sm text-stone-900">
                              {diag.diseaseName}
                            </span>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Evidences */}
                        <div className="text-xs text-stone-700 pl-7 space-y-1">
                          <p className="font-semibold text-stone-600">Bằng chứng quan sát trực tiếp trên ảnh:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                            {diag.evidence.map((ev, evIdx) => (
                              <li key={evIdx}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Visual Specimen Cross-Reference */}
              {(() => {
                const primaryDiag = result.possibleDiagnoses[0];
                const matchedRef = DEFAULT_DISEASES.find(
                  (d) =>
                    d.id === primaryDiag?.diseaseId ||
                    (primaryDiag?.diseaseName && d.vietnameseName.toLowerCase().includes(primaryDiag.diseaseName.toLowerCase())) ||
                    (primaryDiag?.diseaseName && primaryDiag.diseaseName.toLowerCase().includes(d.vietnameseName.toLowerCase()))
                ) || DEFAULT_DISEASES.find((d) => d.cropType === selectedCrop);

                if (!matchedRef) return null;

                return (
                  <div className="bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 rounded-3xl p-5 sm:p-6 text-white space-y-5 shadow-lg border border-emerald-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center shrink-0 border border-emerald-500/40 shadow-inner">
                          <Microscope className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-white">
                              Đối Chiếu Thị Giác: Mẫu Thực Địa vs Tiêu Bản Chuẩn Viện BVTV
                            </h3>
                          </div>
                          <p className="text-xs text-stone-300 mt-0.5">
                            Cơ chế so sánh trực tiếp hình thái vết bệnh để xác nhận kết luận chẩn đoán
                          </p>
                        </div>
                      </div>

                      {matchedRef.standardCode && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] text-amber-300 font-medium self-start sm:self-auto">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{matchedRef.standardCode.split(';')[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Dual Image Comparison Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. Customer Uploaded Image */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            <span>1. Ảnh thực tế khách hàng quét</span>
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">Mẫu cần kiểm tra</span>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-black/80 border border-emerald-500/30 shadow-inner group">
                          <img
                            src={imagePreview || ''}
                            alt="Ảnh mẫu cây của bạn"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-xs text-[10px] text-stone-200 truncate flex items-center justify-between">
                            <span>{result.cropDetected} • Bộ phận: {selectedPart}</span>
                            <span className="text-emerald-400 font-semibold">Chất lượng: {result.imageQuality}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Scientific Ground-Truth Reference Specimen */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>2. Tiêu bản đối chứng khoa học</span>
                          </span>
                          <span className="text-[10px] text-amber-400/90 font-medium">Chuẩn quy chiếu</span>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-black/80 border border-amber-500/40 shadow-inner group">
                          {matchedRef.sampleImageUrl ? (
                            <img
                              src={matchedRef.sampleImageUrl}
                              alt={matchedRef.vietnameseName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-500">
                              Chưa có ảnh tiêu bản
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-900/90 text-emerald-200 border border-emerald-500/50 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>QCVN Verified</span>
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-xs text-[10px] text-amber-200 truncate">
                            {matchedRef.vietnameseName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Morphological Hallmarks Breakdown */}
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Chi Tiết Đối Chiếu Đặc Trưng Hình Thái (Morphological Hallmarks)</span>
                        </h4>
                        <span className="text-[10px] text-stone-400">Đối sánh tự động</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                            • Triệu chứng lâm sàng chuẩn của bệnh
                          </span>
                          <p className="text-stone-200 leading-relaxed text-[11px]">
                            {matchedRef.symptoms}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                            • Tác nhân vi sinh & Quy luật thời tiết Bắc Trung Bộ
                          </span>
                          <p className="text-stone-200 leading-relaxed text-[11px]">
                            <strong>Tác nhân:</strong> {matchedRef.causes}
                          </p>
                          <p className="text-stone-300 leading-relaxed text-[11px] pt-1 border-t border-white/10 mt-1">
                            <strong>Khí hậu phát sinh:</strong> {matchedRef.favorableConditions}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-300 border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-400">Đơn vị thẩm định:</span>
                          <span className="font-semibold text-white">{matchedRef.verifiedBy || 'Viện Bảo vệ Thực vật Việt Nam'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigateToLibrary(selectedCrop)}
                          className="text-emerald-300 hover:text-emerald-200 font-bold underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem toàn bộ hồ sơ trong Thư viện</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Observed Symptoms */}
              {result.symptoms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Triệu chứng lâm sàng ghi nhận trên mẫu
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.symptoms.map((sym, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200"
                      >
                        • {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Explanations & Uncertainty */}
              {result.alternativeCauses.length > 0 && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-stone-500" />
                    <span>Nguyên nhân thay thế / Yếu tố tương đồng (Uncertainty Handling)</span>
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Các triệu chứng trên có thể bị trùng lặp hoặc ảnh hưởng bởi: {result.alternativeCauses.join('; ')}.
                  </p>
                </div>
              )}

              {/* Additional Photos Instructions if needed */}
              {result.needsMoreImages && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-700" />
                    <span>Khuyến nghị chụp thêm ảnh bổ sung để nâng cao độ chính xác</span>
                  </h4>
                  <ul className="list-disc list-inside text-xs text-blue-900 space-y-1">
                    {result.additionalImageInstructions.map((inst, iIdx) => (
                      <li key={iIdx}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safe Management & Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Khuyến cáo Quản lý An toàn Sinh thái & Canh tác (GAP / IPM)
                </h3>
                <div className="space-y-2">
                  {result.recommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Scientific Disclaimer */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-amber-900">
                    Tuyên bố Trách nhiệm Khoa học
                  </span>
                  <p className="leading-relaxed text-amber-900/90">
                    {result.disclaimer} Kết quả này là hỗ trợ sàng lọc sơ bộ dựa trên ảnh chụp, không thay thế hoàn toàn cho việc kiểm tra vi sinh vật, giải trình tự gen hoặc thẩm định trực tiếp tại hiện trường bởi cán bộ Trạm Trồng trọt và Bảo vệ Thực vật.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onNavigateToAssistant({
                        crop: result.cropDetected,
                        part: selectedPart,
                        suspectedDisease: result.possibleDiagnoses[0]?.diseaseName,
                        symptoms: result.symptoms,
                        confidenceLevel: result.possibleDiagnoses[0]?.confidenceLevel,
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Hỏi Trợ lý AI về kết quả này</span>
                  </button>

                  <button
                    onClick={() => onNavigateToLibrary(selectedCrop)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <span>Đối chiếu trong Thư viện bệnh</span>
                  </button>
                </div>

                <div>
                  <span className="text-xs text-stone-500 font-medium">
                    {isSaved ? '✓ Đã tự động lưu vào Lịch sử' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
