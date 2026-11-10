import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEFAULT_DISEASES } from '../data/defaultDiseases';
import { DiseaseRecord, CropType } from '../types';

const COLLECTION_NAME = 'diseases';

export async function fetchDiseases(): Promise<DiseaseRecord[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    
    if (snap.empty) {
      // First-time seed into Firestore if empty
      console.log('Seeding initial verified botanical disease library...');
      try {
        for (const disease of DEFAULT_DISEASES) {
          await setDoc(doc(db, COLLECTION_NAME, disease.id), disease);
        }
      } catch (seedErr) {
        console.warn('Seed notice:', seedErr);
      }
      return DEFAULT_DISEASES;
    }

    const items: DiseaseRecord[] = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return DEFAULT_DISEASES;
  }
}

export async function saveDisease(disease: DiseaseRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, disease.id);
    const payload = {
      ...disease,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${disease.id}`);
    throw error;
  }
}

export async function deleteDisease(diseaseId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, diseaseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${diseaseId}`);
    throw error;
  }
}

/**
 * Synchronize and restore 100% verified botanical baseline diseases into Firestore.
 * Used by Administrators to reset or update against official national standards.
 */
export async function syncVerifiedDiseases(): Promise<DiseaseRecord[]> {
  try {
    for (const disease of DEFAULT_DISEASES) {
      const docRef = doc(db, COLLECTION_NAME, disease.id);
      await setDoc(docRef, {
        ...disease,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    return fetchDiseases();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    throw error;
  }
}

