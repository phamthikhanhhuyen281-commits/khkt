import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEFAULT_RESEARCH_SAMPLES } from '../data/defaultResearchSamples';
import { ResearchSample, EvaluationMetrics, ConfusionMatrixData, CropType } from '../types';

const COLLECTION_NAME = 'research_samples';

export async function fetchResearchSamples(): Promise<ResearchSample[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      console.log('Seeding initial ground-truth research samples...');
      try {
        for (const sample of DEFAULT_RESEARCH_SAMPLES) {
          await setDoc(doc(db, COLLECTION_NAME, sample.sampleId), sample);
        }
      } catch (seedErr) {
        console.warn('Seed notice for research:', seedErr);
      }
      return DEFAULT_RESEARCH_SAMPLES;
    }

    const items: ResearchSample[] = [];
    snap.forEach((docSnap) => {
      items.push({ sampleId: docSnap.id, ...(docSnap.data() as any) });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return DEFAULT_RESEARCH_SAMPLES;
  }
}

export async function saveResearchSample(sample: ResearchSample): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, sample.sampleId);
    await setDoc(docRef, sample, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${sample.sampleId}`);
    throw error;
  }
}

export async function deleteResearchSample(sampleId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, sampleId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${sampleId}`);
    throw error;
  }
}

/**
 * Calculates scientific evaluation metrics strictly from expert-verified ground-truth labels.
 * Avoids fabricated accuracy percentages and conforms to standard ML evaluation standards.
 */
export function calculateEvaluationMetrics(samples: ResearchSample[]): EvaluationMetrics {
  // 1. Strict filter: only calculate from expert-verified ground truth samples
  const verifiedSamples = samples.filter(
    (s) => s.verificationStatus === 'expert_verified' && s.diseaseLabel && s.aiPrediction
  );

  const totalVerified = verifiedSamples.length;
  if (totalVerified === 0) {
    return {
      totalVerified: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      confusionMatrix: { labels: [], matrix: [] },
      byCrop: {},
    };
  }

  // 2. Identify unique labels
  const labelSet = new Set<string>();
  verifiedSamples.forEach((s) => {
    labelSet.add(s.diseaseLabel.trim());
    labelSet.add(s.aiPrediction.trim());
  });
  const labels = Array.from(labelSet).sort();

  // 3. Build Confusion Matrix: rows = actual (ground truth), cols = predicted
  const labelIndexMap = new Map<string, number>();
  labels.forEach((lbl, idx) => labelIndexMap.set(lbl, idx));

  const matrix: number[][] = Array(labels.length)
    .fill(0)
    .map(() => Array(labels.length).fill(0));

  let correctCount = 0;

  verifiedSamples.forEach((sample) => {
    const actualIdx = labelIndexMap.get(sample.diseaseLabel.trim());
    const predIdx = labelIndexMap.get(sample.aiPrediction.trim());

    if (actualIdx !== undefined && predIdx !== undefined) {
      matrix[actualIdx][predIdx] += 1;
      if (actualIdx === predIdx) {
        correctCount += 1;
      }
    }
  });

  const overallAccuracy = correctCount / totalVerified;

  // 4. Calculate Macro Precision, Recall, F1
  let sumPrecision = 0;
  let sumRecall = 0;
  let validClasses = 0;

  for (let i = 0; i < labels.length; i++) {
    const tp = matrix[i][i];
    let totalPredicted = 0;
    let totalActual = 0;

    for (let j = 0; j < labels.length; j++) {
      totalPredicted += matrix[j][i];
      totalActual += matrix[i][j];
    }

    if (totalActual > 0) {
      validClasses += 1;
      const prec = totalPredicted > 0 ? tp / totalPredicted : 0;
      const rec = tp / totalActual;
      sumPrecision += prec;
      sumRecall += rec;
    }
  }

  const macroPrecision = validClasses > 0 ? sumPrecision / validClasses : 0;
  const macroRecall = validClasses > 0 ? sumRecall / validClasses : 0;
  const f1Score =
    macroPrecision + macroRecall > 0
      ? (2 * macroPrecision * macroRecall) / (macroPrecision + macroRecall)
      : 0;

  // 5. Breakdown by Crop
  const byCrop: EvaluationMetrics['byCrop'] = {};
  const crops: CropType[] = ['citrus', 'rice', 'peanut'];

  crops.forEach((crop) => {
    const cropSamples = verifiedSamples.filter((s) => s.cropType === crop);
    const cropTotal = cropSamples.length;
    const cropCorrect = cropSamples.filter((s) => s.isCorrect === 'correct' || s.diseaseLabel.trim() === s.aiPrediction.trim()).length;
    byCrop[crop] = {
      total: cropTotal,
      correct: cropCorrect,
      accuracy: cropTotal > 0 ? cropCorrect / cropTotal : 0,
    };
  });

  return {
    totalVerified,
    accuracy: overallAccuracy,
    precision: macroPrecision,
    recall: macroRecall,
    f1Score,
    confusionMatrix: {
      labels,
      matrix,
    },
    byCrop,
  };
}

/**
 * Generates anonymized scientific CSV export for research data.
 */
export function exportResearchDataToCSV(samples: ResearchSample[]): string {
  const headers = [
    'Sample_ID',
    'Crop_Group',
    'Ground_Truth_Disease_Label',
    'Coarse_Location',
    'Collection_Date',
    'Image_Source',
    'Verification_Status',
    'AI_Prediction',
    'Confidence_Level',
    'Prediction_Correctness',
    'Scientific_Notes',
  ];

  const escapeCSV = (str: string = '') => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = samples.map((s) => [
    escapeCSV(s.sampleId),
    escapeCSV(s.cropType),
    escapeCSV(s.diseaseLabel),
    escapeCSV(s.location),
    escapeCSV(s.collectionDate),
    escapeCSV(s.imageSource),
    escapeCSV(s.verificationStatus),
    escapeCSV(s.aiPrediction),
    escapeCSV(s.confidenceLevel),
    escapeCSV(s.isCorrect),
    escapeCSV(s.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
