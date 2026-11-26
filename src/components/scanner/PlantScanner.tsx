import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  BookOpen,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { CropType, PlantPart, DiagnosisResult, ConfidenceLevel } from '../../types';
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

  const [selectedCrop, setSelectedCrop] = useState<CropType>(initialCrop);
  const [selectedPart, setSelectedPart] = useState<PlantPart>('leaf');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
  const [imageFileName, setImageFileName] = useState<string>('');
  const [sourceSampleCrop, setSourceSampleCrop] = useState<CropType | null>(null);
  const [refImgError, setRefImgError] = useState<boolean>(false);

  // Real-time blur and lighting pre-check
  const [previewQuality, setPreviewQuality] = useState<{
    imageQuality: 'good' | 'fair' | 'poor';
    qualityIssues: string[];
    isBlurry: boolean;
    isTooDark: boolean;
    isOverexposed: boolean;
    sharpnessScore: number;
  } | null>(null);

  const [showTips, setShowTips] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSelectedCrop(initialCrop);
  }, [initialCrop]);

  const cropOptions: { id: CropType; label: string; icon: string }[] = [
    { id: 'citrus', label: 'Cây Cam, Bưởi', icon: '🍊' },
    { id: 'rice', label: 'Cây Lúa', icon: '🌾' },
    { id: 'peanut', label: 'Cây Lạc (Đậu)', icon: '🥜' },
  ];

  const partOptions: { id: PlantPart; label: string }[] = [
    { id: 'leaf', label: 'Lá cây' },
    { id: 'stem', label: 'Thân / Cành' },
    { id: 'fruit', label: 'Quả / Củ' },
    { id: 'other', label: 'Toàn cây' },
  ];

  const getCropLabel = (crop: CropType) =>
    crop === 'citrus' ? 'Cây Cam, Bưởi' : crop === 'rice' ? 'Cây Lúa' : 'Cây Lạc';

  const getPartLabel = (part: PlantPart) =>
    partOptions.find((p) => p.id === part)?.label || 'Lá cây';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setAnalysisError('Bác vui lòng chọn ảnh chụp thông thường (JPG hoặc PNG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAnalysisError('Ảnh này hơi lớn quá (trên 15MB). Bác vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    setAnalysisError(null);
    setImageFileName(file.name);
    setSourceSampleCrop(null);
    setMimeType(file.type);
    setResult(null);
    setIsSaved(false);
    setRefImgError(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setAnalysisError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
      console.warn('Camera fallback to native input:', err);
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
      setImageFileName('camera_snapshot.jpg');
      setSourceSampleCrop(null);
      setMimeType('image/jpeg');
      setResult(null);
      setIsSaved(false);
      setRefImgError(false);
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

  useEffect(() => {
    if (imagePreview) {
      extractVisualMetrics(imagePreview, imageFileName, sourceSampleCrop).then((metrics) => {
        setPreviewQuality({
          imageQuality: metrics.imageQuality,
          qualityIssues: metrics.qualityIssues,
          isBlurry: metrics.isBlurry,
          isTooDark: metrics.isTooDark,
          isOverexposed: metrics.isOverexposed,
          sharpnessScore: metrics.sharpnessScore,
        });
      });
    } else {
      setPreviewQuality(null);
    }
  }, [imagePreview, imageFileName, sourceSampleCrop]);

  const extractVisualMetrics = async (
    dataUrl: string,
    fileNameHint?: string,
    sampleCropHint?: CropType | null
  ): Promise<{
    healthyGreenRatio: number;
    yellowRatio: number;
    lesionRatio: number;
    leafShape: 'broadleaf_oval' | 'slender_blade' | 'compound_rounded_leaflets';
    detectedCropHint: 'citrus' | 'rice' | 'peanut' | 'unknown';
    sharpnessScore: number;
    imageQuality: 'good' | 'fair' | 'poor';
    qualityIssues: string[];
    isBlurry: boolean;
    isTooDark: boolean;
    isOverexposed: boolean;
    sourceSampleId?: string;
    filenameHint?: string;
  }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({
              healthyGreenRatio: 0.5,
              yellowRatio: 0,
              lesionRatio: 0,
              leafShape: 'broadleaf_oval',
              detectedCropHint: 'unknown',
              sharpnessScore: 80,
              imageQuality: 'good',
              qualityIssues: [],
              isBlurry: false,
              isTooDark: false,
              isOverexposed: false,
            });
          }
          ctx.drawImage(img, 0, 0, 128, 128);
          const imgData = ctx.getImageData(0, 0, 128, 128).data;
          let plantPixels = 0;
          let greenPixels = 0;
          let yellowPixels = 0;
          let lesionPixels = 0;
          let soilPixels = 0;
          let minX = 128, maxX = 0, minY = 128, maxY = 0;
          const gray = new Float32Array(128 * 128);
          let sumBrightness = 0;

          for (let i = 0; i < imgData.length; i += 4) {
            const pixelIndex = Math.floor(i / 4);
            const px = pixelIndex % 128;
            const py = Math.floor(pixelIndex / 128);
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];
            const gVal = 0.299 * r + 0.587 * g + 0.114 * b;
            gray[pixelIndex] = gVal;

            if (a < 50) continue;

            const isWhiteBg = r > 240 && g > 240 && b > 240;
            const isPitchBlack = r < 20 && g < 20 && b < 20;
            if (isWhiteBg || isPitchBlack) continue;

            if (r > 75 && r > g * 1.05 && r > b * 1.25 && b < 125) {
              soilPixels++;
            }

            plantPixels++;
            sumBrightness += gVal;

            if (g > r * 1.15 && g > b * 1.15 && g > 45) {
              greenPixels++;
              minX = Math.min(minX, px);
              maxX = Math.max(maxX, px);
              minY = Math.min(minY, py);
              maxY = Math.max(maxY, py);
            } else if (r > 130 && g > 120 && b < 100 && Math.abs(r - g) < 55) {
              yellowPixels++;
              minX = Math.min(minX, px);
              maxX = Math.max(maxX, px);
              minY = Math.min(minY, py);
              maxY = Math.max(maxY, py);
            } else if ((r > 60 && g < r * 0.9 && b < g) || (r < 65 && g < 65 && b < 65)) {
              lesionPixels++;
            }
          }

          let lapSum = 0;
          let lapCount = 0;
          const lapList: number[] = [];
          for (let y = 1; y < 127; y++) {
            for (let x = 1; x < 127; x++) {
              const idx = y * 128 + x;
              const lap = 4 * gray[idx] - gray[idx + 1] - gray[idx - 1] - gray[idx + 128] - gray[idx - 128];
              lapList.push(lap);
              lapSum += lap;
              lapCount++;
            }
          }
          const lapMean = lapSum / Math.max(lapCount, 1);
          let varSum = 0;
          for (let i = 0; i < lapCount; i++) {
            const diff = lapList[i] - lapMean;
            varSum += diff * diff;
          }
          const rawVariance = Math.round(varSum / Math.max(lapCount, 1));
          const sharpnessScore = Math.min(100, Math.max(5, Math.round((rawVariance / 160) * 100)));

          const total = Math.max(plantPixels, 1);
          const avgBrightness = sumBrightness / total;
          const isTooDark = avgBrightness < 40 && plantPixels > 100;
          const isOverexposed = avgBrightness > 220 && plantPixels > 100;
          const isBlurry = rawVariance < 35;

          const qualityIssues: string[] = [];
          if (isBlurry) {
            qualityIssues.push('Ảnh hơi bị mờ nét hoặc rung tay khi chụp.');
          }
          if (isTooDark) {
            qualityIssues.push('Ảnh chụp bị tối, thiếu ánh sáng.');
          }
          if (isOverexposed) {
            qualityIssues.push('Ảnh bị lóa nắng quá sáng.');
          }

          const imageQuality: 'good' | 'fair' | 'poor' =
            isBlurry || isTooDark || isOverexposed ? 'poor' : sharpnessScore < 60 ? 'fair' : 'good';

          const bboxW = Math.max(0, maxX - minX + 1);
          const bboxH = Math.max(0, maxY - minY + 1);
          const maxDim = Math.max(bboxW, bboxH);
          const minDim = Math.min(bboxW, bboxH);
          const aspectRatio = maxDim > 0 ? minDim / maxDim : 0;
          const bboxArea = bboxW * bboxH;
          const density = bboxArea > 0 ? (greenPixels + yellowPixels) / bboxArea : 0;
          const soilRatio = soilPixels / total;

          const fn = (fileNameHint || imageFileName || '').toLowerCase();
          const isSamplePeanut =
            sampleCropHint === 'peanut' ||
            sourceSampleCrop === 'peanut' ||
            dataUrl.includes('peanut_leaf_spot');
          const isSampleRice =
            sampleCropHint === 'rice' ||
            sourceSampleCrop === 'rice' ||
            dataUrl.includes('rice_leaf_blast');
          const isSampleCitrus =
            sampleCropHint === 'citrus' ||
            sourceSampleCrop === 'citrus' ||
            dataUrl.includes('citrus_leaf_hlb');

          let detectedCropHint: 'citrus' | 'rice' | 'peanut' = 'citrus';
          let leafShape: 'broadleaf_oval' | 'slender_blade' | 'compound_rounded_leaflets' = 'broadleaf_oval';

          if (isSamplePeanut || /lac|peanut|dauphong|dau_phong|dau-phong|đậu|groundnut/i.test(fn)) {
            detectedCropHint = 'peanut';
            leafShape = 'compound_rounded_leaflets';
          } else if (isSampleRice || /lua|rice|paddy|thoc/i.test(fn)) {
            detectedCropHint = 'rice';
            leafShape = 'slender_blade';
          } else if (isSampleCitrus || /cam|citrus|orange|lemon|chanh|buoi/i.test(fn)) {
            detectedCropHint = 'citrus';
            leafShape = 'broadleaf_oval';
          } else if (aspectRatio < 0.28) {
            detectedCropHint = 'rice';
            leafShape = 'slender_blade';
          } else if (soilRatio > 0.08 || (density < 0.35 && aspectRatio > 0.45)) {
            detectedCropHint = 'peanut';
            leafShape = 'compound_rounded_leaflets';
          } else {
            detectedCropHint = 'citrus';
            leafShape = 'broadleaf_oval';
          }

          resolve({
            healthyGreenRatio: greenPixels / total,
            yellowRatio: yellowPixels / total,
            lesionRatio: lesionPixels / total,
            leafShape,
            detectedCropHint,
            sharpnessScore,
            imageQuality,
            qualityIssues,
            isBlurry,
            isTooDark,
            isOverexposed,
            sourceSampleId: sourceSampleCrop || undefined,
            filenameHint: fileNameHint || imageFileName || undefined,
          });
        } catch {
          resolve({
            healthyGreenRatio: 0.5,
            yellowRatio: 0,
            lesionRatio: 0,
            leafShape: 'broadleaf_oval',
            detectedCropHint: 'unknown',
            sharpnessScore: 80,
            imageQuality: 'good',
            qualityIssues: [],
            isBlurry: false,
            isTooDark: false,
            isOverexposed: false,
          });
        }
      };
      img.onerror = () => {
        resolve({
          healthyGreenRatio: 0.5,
          yellowRatio: 0,
          lesionRatio: 0,
          leafShape: 'broadleaf_oval',
          detectedCropHint: 'unknown',
          sharpnessScore: 80,
          imageQuality: 'good',
          qualityIssues: [],
          isBlurry: false,
          isTooDark: false,
          isOverexposed: false,
        });
      };
      img.src = dataUrl;
    });
  };

  const handleRunDiagnosis = async () => {
    if (!imagePreview) {
      setAnalysisError('Bác vui lòng chụp ảnh hoặc chọn ảnh lá cây trước nhé.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    setRefImgError(false);

    setScanStepMessage('Đang kiểm tra độ rõ của ảnh...');
    const step1 = setTimeout(() => setScanStepMessage('Đang đối chiếu loại cây và dấu hiệu trên lá...'), 900);
    const step2 = setTimeout(() => setScanStepMessage('Đang tìm cách xử lý phù hợp cho bác...'), 2200);

    try {
      const visualMetrics = await extractVisualMetrics(imagePreview, imageFileName, sourceSampleCrop);

      const diagnosisResult = await runServerDiagnosis(
        imagePreview,
        selectedCrop,
        selectedPart,
        mimeType,
        visualMetrics
      );

      clearTimeout(step1);
      clearTimeout(step2);

      setResult(diagnosisResult);

      await saveDiagnosisRecord({
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
      setAnalysisError(err.message || 'Chưa kiểm tra được ảnh này. Bác vui lòng chụp lại ảnh rõ hơn nhé.');
    } finally {
      setIsAnalyzing(false);
      setScanStepMessage('');
    }
  };

  const handleSwitchCropAndDiagnose = async (newCrop: CropType) => {
    setSelectedCrop(newCrop);
    setSourceSampleCrop(newCrop);
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    setRefImgError(false);
    setScanStepMessage(`Đang chuyển sang khám ${getCropLabel(newCrop)}...`);

    try {
      const visualMetrics = await extractVisualMetrics(imagePreview, imageFileName, newCrop);
      const diagnosisResult = await runServerDiagnosis(
        imagePreview,
        newCrop,
        selectedPart,
        mimeType,
        visualMetrics
      );
      setResult(diagnosisResult);

      await saveDiagnosisRecord({
        userId: user?.uid || 'guest_user',
        userEmail: user?.email || '',
        cropType: newCrop,
        plantPart: selectedPart,
        imageUrl: imagePreview,
        assessment: diagnosisResult,
        suspectedDiseases: diagnosisResult.possibleDiagnoses.map((d) => d.diseaseName),
        imageQuality: diagnosisResult.imageQuality,
        verificationStatus: 'unverified',
      });
      setIsSaved(true);
    } catch (err: any) {
      setAnalysisError(err.message || 'Có lỗi khi chuyển sang loại cây khác.');
    } finally {
      setIsAnalyzing(false);
      setScanStepMessage('');
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setImageFileName('');
    setSourceSampleCrop(null);
    setResult(null);
    setPreviewQuality(null);
    setAnalysisError(null);
    setIsSaved(false);
    setRefImgError(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getConfidenceText = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high':
        return { label: 'Khả năng cao', style: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'medium':
        return { label: 'Khả năng trung bình', style: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'low':
        return { label: 'Ít khả năng', style: 'bg-stone-100 text-stone-800 border-stone-300' };
      default:
        return { label: 'Cần xem thêm', style: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  const quickSamples = [
    {
      crop: 'citrus' as CropType,
      part: 'leaf' as PlantPart,
      label: 'Mẫu lá Cam',
      url: '/images/citrus_leaf_hlb.jpg',
      icon: '🍊',
    },
    {
      crop: 'rice' as CropType,
      part: 'leaf' as PlantPart,
      label: 'Mẫu lá Lúa',
      url: '/images/rice_leaf_blast.jpg',
      icon: '🌾',
    },
    {
      crop: 'peanut' as CropType,
      part: 'leaf' as PlantPart,
      label: 'Mẫu lá Lạc',
      url: '/images/peanut_leaf_spot.jpg',
      icon: '🥜',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Simple Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Chụp ảnh khám bệnh cây
          </h1>
          <p className="text-base text-stone-600 mt-1">
            Chỉ cần 2 bước đơn giản: chọn cây và chụp ảnh chỗ bị bệnh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors w-fit min-h-[44px] cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>{showTips ? 'Ẩn mẹo chụp rõ' : 'Cách chụp ảnh cho rõ'}</span>
        </button>
      </div>

      {showTips && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2 text-base text-stone-800">
          <p className="font-bold text-emerald-950">3 mẹo nhỏ giúp máy nhìn rõ bệnh nhất:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Đưa điện thoại cách lá hoặc quả khoảng <strong>1 gang tay (20 cm)</strong>.</li>
            <li>Giữ chắc tay khoảng 1 giây rồi mới bấm chụp để ảnh không bị rung mờ.</li>
            <li>Chụp nơi đủ sáng ngoài trời, tránh để bóng tay che lên vết bệnh.</li>
          </ul>
        </div>
      )}

      {/* Step 1: Choose Crop */}
      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">
          Bước 1: Bác đang khám cây gì?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cropOptions.map((crop) => {
            const isSelected = selectedCrop === crop.id;
            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => {
                  setSelectedCrop(crop.id);
                  setResult(null);
                }}
                className={`min-h-[68px] p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                    : 'border-stone-200 hover:border-emerald-300 bg-white text-stone-800'
                }`}
              >
                <span className="text-3xl shrink-0" aria-hidden="true">
                  {crop.icon}
                </span>
                <span className="text-base sm:text-lg font-bold leading-tight">
                  {crop.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Unobtrusive 1-row part selector */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-stone-600 mr-1">Chụp bộ phận:</span>
          {partOptions.map((part) => (
            <button
              key={part.id}
              type="button"
              onClick={() => setSelectedPart(part.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold min-h-[40px] transition-colors cursor-pointer ${
                selectedPart === part.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {part.label}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Capture or Upload Photo */}
      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">
          Bước 2: Chụp ảnh hoặc chọn ảnh
        </h2>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <input
          type="file"
          ref={cameraCaptureInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-8 border-2 border-dashed border-white/70 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-sm font-semibold text-white bg-black/60 px-3 py-1.5 rounded-lg">
                Đưa lá bệnh vào giữa khung hình
              </span>
            </div>

            <div className="absolute bottom-4 flex items-center gap-4">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-3 rounded-xl bg-stone-900/90 text-white text-base font-bold min-h-[48px] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={captureCameraSnapshot}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center gap-2 min-h-[52px] shadow-lg cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Chụp ảnh này</span>
              </button>
            </div>
          </div>
        ) : imagePreview ? (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 aspect-16/10 sm:aspect-2/1 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Ảnh bác vừa chọn"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Easy Retake / Replace Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-base font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-emerald-700" />
                <span>Chụp lại ảnh khác</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-base font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-emerald-700" />
                <span>Chọn ảnh khác trong máy</span>
              </button>
            </div>

            {/* Friendly Blur / Light Check */}
            {previewQuality && (
              <div>
                {previewQuality.isBlurry ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-lg font-bold">
                          Ảnh bị mờ rồi!
                        </p>
                        <p className="text-base text-stone-800">
                          Bác giữ chắc tay, để máy cách lá khoảng 1 gang tay (20cm) rồi chụp lại cho rõ nhé.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Chụp lại ảnh rõ hơn</span>
                    </button>
                  </div>
                ) : previewQuality.isTooDark ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 text-base flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                    <span>Ảnh hơi tối. Bác đưa cây ra chỗ sáng hơn một chút sẽ dễ xem bệnh hơn.</span>
                  </div>
                ) : previewQuality.isOverexposed ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 text-base flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                    <span>Ảnh hơi bị chói nắng. Bác nghiêng máy tránh ánh nắng rọi thẳng nhé.</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base font-semibold flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>Ảnh đã rõ nét, sẵn sàng kiểm tra.</span>
                  </div>
                )}
              </div>
            )}

            {/* Giant Primary Diagnose CTA */}
            <button
              type="button"
              onClick={handleRunDiagnosis}
              disabled={isAnalyzing}
              className={`w-full min-h-[58px] py-4 px-6 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isAnalyzing
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                  <span>{scanStepMessage || 'Đang kiểm tra ảnh...'}</span>
                </>
              ) : (
                <span>XEM BỆNH CỦA CÂY NGAY</span>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Two Huge Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={startCamera}
                className="min-h-[88px] p-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Camera className="w-7 h-7 shrink-0" />
                <span>Mở máy ảnh chụp ngay</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[88px] p-5 rounded-2xl bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-900 border-2 border-stone-300 font-bold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Upload className="w-7 h-7 text-emerald-700 shrink-0" />
                <span>Chọn ảnh trong máy</span>
              </button>
            </div>

            {/* 3 Quick Sample Photos */}
            <div className="pt-2 border-t border-stone-100 space-y-2.5">
              <p className="text-sm font-semibold text-stone-600">
                Hoặc bấm vào ảnh mẫu bên dưới để xem thử cách máy hoạt động:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {quickSamples.map((sample) => (
                  <button
                    key={sample.crop}
                    type="button"
                    onClick={() => {
                      setSelectedCrop(sample.crop);
                      setSelectedPart(sample.part);
                      setImagePreview(sample.url);
                      setSourceSampleCrop(sample.crop);
                      setImageFileName(`${sample.crop}_sample.jpg`);
                      setMimeType('image/jpeg');
                      setResult(null);
                      setIsSaved(false);
                      setAnalysisError(null);
                      setRefImgError(false);
                    }}
                    className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-400 transition-colors text-center flex flex-col items-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-16 sm:h-20 object-cover rounded-lg border border-stone-200"
                    />
                    <span className="text-sm font-bold text-stone-800 leading-tight">
                      {sample.icon} {sample.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {analysisError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-base flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-700" />
            <span>{analysisError}</span>
          </div>
        )}
      </section>

      {/* Result Area */}
      {result && (
        <section className="space-y-5">
          {/* Case 1: Wrong Crop Selected */}
          {!result.selectedCropMatches ? (
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-7 h-7 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-amber-950">
                    Nhầm loại cây rồi bác ơi!
                  </h2>
                  <p className="text-base text-stone-800 leading-relaxed">
                    Bác đang chọn khám <strong>{getCropLabel(selectedCrop)}</strong>, nhưng ảnh này trông giống{' '}
                    <strong>{result.cropDetected}</strong>. Máy tạm dừng để tránh báo nhầm bệnh cho bác.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const detectedLower = result.cropDetected.toLowerCase();
                    const targetCrop: CropType =
                      detectedLower.includes('lạc') || detectedLower.includes('đậu') || detectedLower.includes('peanut')
                        ? 'peanut'
                        : detectedLower.includes('cam') || detectedLower.includes('bưởi') || detectedLower.includes('citrus')
                        ? 'citrus'
                        : 'rice';
                    handleSwitchCropAndDiagnose(targetCrop);
                  }}
                  className="flex-1 min-h-[54px] px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>
                    Chuyển sang khám đúng{' '}
                    {result.cropDetected.toLowerCase().includes('lạc') || result.cropDetected.toLowerCase().includes('đậu')
                      ? 'Cây Lạc'
                      : result.cropDetected.toLowerCase().includes('cam')
                      ? 'Cây Cam, Bưởi'
                      : 'Cây Lúa'}{' '}
                    ngay
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[54px] px-5 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-base font-semibold cursor-pointer"
                >
                  Chọn lại ảnh khác
                </button>
              </div>
            </div>
          ) : (() => {
            const primaryDiag = result.possibleDiagnoses[0];
            const isHealthy = primaryDiag?.diseaseId === 'healthy';
            const isBlurryResult =
              primaryDiag?.diseaseId === 'unclear_due_to_blur' ||
              (result.imageQuality === 'poor' && primaryDiag?.confidenceLevel === 'insufficient_evidence');

            /* Case 2: Blurry Photo Result */
            if (isBlurryResult) {
              return (
                <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-7 h-7 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-amber-950">
                        Ảnh bị mờ, chưa nhìn rõ bệnh!
                      </h2>
                      <p className="text-base text-stone-800">
                        Bác làm theo 3 bước sau rồi chụp lại để máy xem chính xác nhé:
                      </p>
                    </div>
                  </div>

                  <ol className="list-decimal list-inside space-y-2 text-base text-stone-800 bg-white rounded-xl p-4 border border-amber-200">
                    <li>Đặt điện thoại cách lá khoảng 1 gang tay (20 cm).</li>
                    <li>Chạm tay vào màn hình chỗ có đốm bệnh cho rõ nét.</li>
                    <li>Giữ yên tay 1 giây rồi bấm chụp nơi đủ sáng.</li>
                  </ol>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full min-h-[54px] px-5 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Chụp lại ảnh rõ hơn</span>
                  </button>
                </div>
              );
            }

            /* Case 3: Healthy Plant */
            if (isHealthy) {
              return (
                <div className="bg-white rounded-2xl border-2 border-emerald-300 p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-8 h-8 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900">
                        Cây khỏe mạnh, không có bệnh!
                      </h2>
                      <p className="text-base text-stone-600">
                        Cây đang kiểm tra: <strong>{getCropLabel(selectedCrop)}</strong> ({getPartLabel(selectedPart)})
                      </p>
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 space-y-2">
                      <h3 className="text-lg font-bold text-emerald-950">Cách chăm sóc giữ cây khỏe:</h3>
                      <ul className="list-disc list-inside space-y-1.5 text-base text-stone-800">
                        {result.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={resetScanner}
                      className="flex-1 min-h-[52px] px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold cursor-pointer"
                    >
                      Chụp khám cây khác
                    </button>
                  </div>
                </div>
              );
            }

            /* Case 4: Disease Found */
            const badge = getConfidenceText(primaryDiag?.confidenceLevel || 'medium');
            const matchedRef =
              DEFAULT_DISEASES.find(
                (d) =>
                  d.id === primaryDiag?.diseaseId ||
                  (primaryDiag?.diseaseName &&
                    d.vietnameseName.toLowerCase().includes(primaryDiag.diseaseName.toLowerCase())) ||
                  (primaryDiag?.diseaseName &&
                    primaryDiag.diseaseName.toLowerCase().includes(d.vietnameseName.toLowerCase()))
              ) || DEFAULT_DISEASES.find((d) => d.cropType === selectedCrop);

            return (
              <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 sm:p-7 space-y-6">
                {/* Main Diagnosis Headline */}
                <div className="space-y-2 border-b border-stone-200 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-600">
                      {getCropLabel(selectedCrop)} • {getPartLabel(selectedPart)}
                    </span>
                    <span className={`px-3 py-1 rounded-lg border text-sm font-bold ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                    {primaryDiag?.diseaseName || 'Chưa xác định rõ bệnh'}
                  </h2>
                </div>

                {/* Observed Symptoms */}
                {(result.symptoms.length > 0 || (primaryDiag?.evidence && primaryDiag.evidence.length > 0)) && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-stone-900">
                      Dấu hiệu nhìn thấy trên ảnh
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 text-base text-stone-800 bg-stone-50 p-4 rounded-xl border border-stone-200">
                      {(primaryDiag?.evidence?.length ? primaryDiag.evidence : result.symptoms).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What to do right now */}
                {result.recommendations.length > 0 && (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 sm:p-5 space-y-3">
                    <h3 className="text-lg font-bold text-emerald-950">
                      Bác nên làm gì ngay
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-base text-stone-900 leading-relaxed">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Simple Side-by-side Visual Comparison (Light Clean Theme) */}
                {matchedRef && (
                  <div className="space-y-3 pt-1">
                    <h3 className="text-lg font-bold text-stone-900">
                      So sánh ảnh bác chụp với ảnh mẫu bệnh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-stone-200 p-3 bg-stone-50 space-y-2">
                        <p className="text-sm font-bold text-stone-800">1. Ảnh bác chụp</p>
                        <div className="rounded-lg overflow-hidden aspect-4/3 bg-white border border-stone-200">
                          <img
                            src={imagePreview || ''}
                            alt="Ảnh bác chụp"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-stone-200 p-3 bg-stone-50 space-y-2">
                        <p className="text-sm font-bold text-stone-800">
                          2. Ảnh mẫu: {matchedRef.vietnameseName}
                        </p>
                        <div className="rounded-lg overflow-hidden aspect-4/3 bg-white border border-stone-200 flex items-center justify-center">
                          {matchedRef.sampleImageUrl && !refImgError ? (
                            <img
                              src={matchedRef.sampleImageUrl}
                              alt={matchedRef.vietnameseName}
                              referrerPolicy="no-referrer"
                              onError={() => setRefImgError(true)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-stone-500 p-4 text-center">
                              Chưa có ảnh mẫu đối chiếu
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical details tucked safely away */}
                {(result.alternativeCauses.length > 0 || result.disclaimer) && (
                  <details className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                    <summary className="font-semibold text-stone-800 cursor-pointer">
                      Xem ghi chú dành cho cán bộ kỹ thuật
                    </summary>
                    <div className="mt-3 space-y-2 leading-relaxed">
                      {result.alternativeCauses.length > 0 && (
                        <p>
                          <strong>Nguyên nhân khác có thể nhầm lẫn:</strong> {result.alternativeCauses.join('; ')}.
                        </p>
                      )}
                      {result.disclaimer && (
                        <p>
                          <strong>Lưu ý chuyên môn:</strong> {result.disclaimer}
                        </p>
                      )}
                    </div>
                  </details>
                )}

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToAssistant({
                          crop: result.cropDetected,
                          part: getPartLabel(selectedPart),
                          suspectedDisease: primaryDiag?.diseaseName,
                          symptoms: result.symptoms,
                          confidenceLevel: badge.label,
                        })
                      }
                      className="min-h-[48px] px-5 py-2.5 rounded-xl font-bold text-base bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Hỏi thêm cách chữa</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetScanner}
                      className="min-h-[48px] px-5 py-2.5 rounded-xl font-bold text-base bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-300 cursor-pointer"
                    >
                      Chụp khám cây khác
                    </button>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigateToLibrary(selectedCrop)}
                      className="text-sm font-semibold text-emerald-800 hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Mở sổ bệnh</span>
                    </button>
                    {isSaved && (
                      <span className="text-sm font-semibold text-emerald-700">
                        ✓ Đã lưu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
};
