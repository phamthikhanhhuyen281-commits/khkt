import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DiagnosisResult, DiagnosisHistoryItem, CropType, PlantPart } from '../types';

const COLLECTION_NAME = 'diagnoses';
const LOCAL_STORAGE_KEY = 'agrivision_local_diagnoses';

export async function runServerDiagnosis(
  imageBase64: string,
  cropType: CropType,
  plantPart: PlantPart,
  mimeType: string = 'image/jpeg'
): Promise<DiagnosisResult> {
  const response = await fetch('/api/diagnose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      cropType,
      plantPart,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || 'Lỗi khi gửi ảnh phân tích đến máy chủ.');
  }

  const result: DiagnosisResult = await response.json();
  return result;
}

export async function saveDiagnosisRecord(
  item: Omit<DiagnosisHistoryItem, 'id' | 'createdAt'>,
  customId?: string
): Promise<DiagnosisHistoryItem> {
  const id = customId || `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullItem: DiagnosisHistoryItem = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
  };

  // Always cache in localStorage for immediate offline access
  try {
    const local = getLocalDiagnoses();
    local.unshift(fullItem);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local.slice(0, 50)));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // Save to Firestore if authenticated
  if (item.userId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, fullItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
      // Do not throw so user doesn't lose their diagnosis UI experience if offline
    }
  }

  return fullItem;
}

export async function fetchUserDiagnoses(userId?: string, isAdminOrResearcher: boolean = false): Promise<DiagnosisHistoryItem[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q;

    if (isAdminOrResearcher && !userId) {
      // Admin review mode: fetch latest across all users
      q = query(colRef, limit(100));
    } else if (userId) {
      q = query(colRef, where('userId', '==', userId), limit(50));
    } else {
      return getLocalDiagnoses();
    }

    const snap = await getDocs(q);
    if (snap.empty) {
      return getLocalDiagnoses();
    }

    const items: DiagnosisHistoryItem[] = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });

    // Sort by createdAt desc
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return getLocalDiagnoses();
  }
}

export async function updateDiagnosisVerification(
  id: string,
  status: 'unverified' | 'expert_verified' | 'corrected',
  expertNotes?: string,
  correctedDisease?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updatePayload: any = {
      verificationStatus: status,
      updatedAt: new Date().toISOString(),
    };
    if (expertNotes !== undefined) updatePayload.expertNotes = expertNotes;
    if (correctedDisease !== undefined) updatePayload.correctedDisease = correctedDisease;

    await setDoc(docRef, updatePayload, { merge: true });

    // Update local storage copy as well
    const local = getLocalDiagnoses().map((item) => {
      if (item.id === id) {
        return {
          ...item,
          verificationStatus: status,
          expertNotes: expertNotes ?? item.expertNotes,
          correctedDisease: correctedDisease ?? item.correctedDisease,
        };
      }
      return item;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
}

export async function deleteDiagnosisRecord(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    const local = getLocalDiagnoses().filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    const local = getLocalDiagnoses().filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  }
}

function getLocalDiagnoses(): DiagnosisHistoryItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
