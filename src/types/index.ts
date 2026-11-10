export type CropType = 'citrus' | 'rice' | 'peanut';

export type PlantPart = 'leaf' | 'stem' | 'fruit' | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient_evidence';

export type SeverityAssessment = 'mild' | 'moderate' | 'severe' | 'uncertain';

export type ImageQuality = 'good' | 'fair' | 'poor';

export type VerificationStatus = 'verified' | 'draft' | 'pending_review';

export type DiagnosisVerificationStatus = 'unverified' | 'expert_verified' | 'corrected';

export type UserRole = 'user' | 'researcher' | 'administrator';

export interface PossibleDiagnosis {
  diseaseId: string;
  diseaseName: string;
  evidence: string[];
  confidenceLevel: ConfidenceLevel;
}

export interface DiagnosisResult {
  isPlantImage: boolean;
  cropDetected: string;
  selectedCropMatches: boolean;
  imageQuality: ImageQuality;
  qualityIssues: string[];
  symptoms: string[];
  possibleDiagnoses: PossibleDiagnosis[];
  alternativeCauses: string[];
  severityAssessment: SeverityAssessment;
  needsMoreImages: boolean;
  additionalImageInstructions: string[];
  recommendations: string[];
  expertVerificationRecommended: boolean;
  disclaimer: string;
}

export interface DiseaseRecord {
  id: string;
  cropType: CropType;
  vietnameseName: string;
  englishName: string;
  symptoms: string;
  affectedPlantParts: PlantPart[];
  causes: string;
  favorableConditions: string;
  preventionMethods: string;
  safeManagement: string;
  references: string;
  verificationStatus: VerificationStatus;
  sampleImageUrl?: string;
  verifiedBy?: string;
  standardCode?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosisHistoryItem {
  id: string;
  userId: string;
  userEmail?: string;
  cropType: CropType;
  plantPart: PlantPart;
  imageUrl: string;
  assessment: DiagnosisResult;
  suspectedDiseases: string[];
  imageQuality: ImageQuality;
  verificationStatus: DiagnosisVerificationStatus;
  expertNotes?: string;
  correctedDisease?: string;
  createdAt: string;
}

export interface ResearchSample {
  sampleId: string;
  cropType: CropType;
  diseaseLabel: string;
  location: string;
  collectionDate: string;
  imageSource: string;
  verificationStatus: 'expert_verified' | 'pending' | 'unverified';
  aiPrediction: string;
  confidenceLevel: ConfidenceLevel;
  isCorrect: 'correct' | 'incorrect' | 'partial' | 'pending';
  imageUrl: string;
  notes?: string;
  createdAt: string;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][]; // rows: true label, cols: predicted label
}

export interface EvaluationMetrics {
  totalVerified: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: ConfusionMatrixData;
  byCrop: {
    [key in CropType]?: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextDiagnosis?: {
    crop: string;
    suspectedDisease: string;
  };
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization?: string;
  status?: 'active' | 'pending_approval' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface RoleUpgradeRequest {
  id: string;
  userId: string;
  userEmail: string;
  displayName: string;
  requestedRole: 'researcher' | 'administrator';
  organization: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

