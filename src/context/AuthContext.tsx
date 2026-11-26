import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import { submitRoleUpgradeRequest } from '../services/userService';

export interface AppUser {
  uid: string;
  email: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  displayName: string | null;
  photoURL: string | null;
  authProvider: 'quick' | 'firebase';
}

const QUICK_PROFILE_STORAGE_KEY = 'agrivision_quick_profile';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  realRole: UserRole;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  quickSignInPhone: (phone: string) => void;
  signOut: () => Promise<void>;
  impersonateRole: (role: UserRole) => void;
  requestElevation: (role: 'researcher' | 'administrator', organization: string, reason: string) => Promise<void>;
  isAdmin: boolean;
  isResearcher: boolean;
  isRealAdmin: boolean;
  isImpersonating: boolean;
  resetImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SYSTEM_ADMIN_EMAILS = [
  'phamthikhanhhuyen281@gmail.com',
  'cl8593834@gmail.com',
];

function loadSavedQuickProfile(): AppUser | null {
  try {
    const raw = localStorage.getItem(QUICK_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.uid === 'string' && typeof parsed.displayName === 'string') {
      return {
        uid: parsed.uid,
        email: null,
        phoneNumber: typeof parsed.phoneNumber === 'string' ? parsed.phoneNumber : null,
        username: null,
        displayName: parsed.displayName,
        photoURL: null,
        authProvider: 'quick',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<AppUser | null>(null);
  const [quickUser, setQuickUser] = useState<AppUser | null>(() => loadSavedQuickProfile());

  const [realRole, setRealRole] = useState<UserRole>('user');
  const [activeRole, setActiveRole] = useState<UserRole>('user');
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const mapped: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          phoneNumber: currentUser.phoneNumber,
          username: null,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          authProvider: 'firebase',
        };
        setFirebaseUser(mapped);

        try {
          const userEmail = (currentUser.email || '').toLowerCase().trim();
          let assignedRole: UserRole = 'user';

          if (SYSTEM_ADMIN_EMAILS.includes(userEmail)) {
            assignedRole = 'administrator';
          } else {
            const userRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists() && snap.data().role) {
              assignedRole = snap.data().role;
            }
          }

          setRealRole(assignedRole);
          const savedImpersonation = localStorage.getItem('agrivision_admin_preview_role') as UserRole | null;
          if (assignedRole === 'administrator' && savedImpersonation && savedImpersonation !== 'administrator') {
            setActiveRole(savedImpersonation);
            setIsImpersonating(true);
          } else {
            setActiveRole(assignedRole);
            setIsImpersonating(false);
          }

          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Bác Nông Dân',
            role: assignedRole,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          if (SYSTEM_ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase())) {
            setRealRole('administrator');
            setActiveRole('administrator');
          }
        }
      } else {
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const user = quickUser || firebaseUser;

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const quickSignInPhone = (rawPhone: string) => {
    const cleaned = rawPhone.replace(/\s+/g, '').trim();
    const profile: AppUser = {
      uid: `farmer_phone_${cleaned}`,
      email: null,
      phoneNumber: cleaned,
      username: null,
      displayName: cleaned,
      photoURL: null,
      authProvider: 'quick',
    };
    setQuickUser(profile);
    try {
      localStorage.setItem(QUICK_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
    setIsAuthModalOpen(false);
  };

  const impersonateRole = (newRole: UserRole) => {
    if (realRole !== 'administrator') return;
    if (newRole === realRole) {
      resetImpersonation();
      return;
    }
    setActiveRole(newRole);
    setIsImpersonating(true);
    localStorage.setItem('agrivision_admin_preview_role', newRole);
  };

  const resetImpersonation = () => {
    setActiveRole(realRole);
    setIsImpersonating(false);
    localStorage.removeItem('agrivision_admin_preview_role');
  };

  const requestElevation = async (
    targetRole: 'researcher' | 'administrator',
    organization: string,
    reason: string
  ) => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập trước khi gửi yêu cầu.');
    }

    await submitRoleUpgradeRequest(
      user.uid,
      user.email || user.phoneNumber || '',
      user.displayName || 'Bác Nông Dân',
      targetRole,
      organization,
      reason
    );
  };

  const signOut = async () => {
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
    } finally {
      setQuickUser(null);
      setFirebaseUser(null);
      setRealRole('user');
      setActiveRole('user');
      setIsImpersonating(false);
      localStorage.removeItem(QUICK_PROFILE_STORAGE_KEY);
      localStorage.removeItem('agrivision_admin_preview_role');
    }
  };

  const isRealAdmin = realRole === 'administrator';
  const isAdmin = activeRole === 'administrator';
  const isResearcher = activeRole === 'researcher' || activeRole === 'administrator';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: activeRole,
        realRole,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        quickSignInPhone,
        signOut,
        impersonateRole,
        requestElevation,
        isAdmin,
        isResearcher,
        isRealAdmin,
        isImpersonating,
        resetImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
