import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import { submitRoleUpgradeRequest } from '../services/userService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  realRole: UserRole;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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

// System Master Administrator Whitelist
export const SYSTEM_ADMIN_EMAILS = [
  'phamthikhanhhuyen281@gmail.com',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Real database-determined role
  const [realRole, setRealRole] = useState<UserRole>('user');
  
  // Currently viewed role (allows Admin previewing lower roles for testing)
  const [activeRole, setActiveRole] = useState<UserRole>('user');
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userEmail = (currentUser.email || '').toLowerCase().trim();
          let assignedRole: UserRole = 'user';

          // 1. Check if user is in master admin email list
          if (SYSTEM_ADMIN_EMAILS.includes(userEmail)) {
            assignedRole = 'administrator';
          } else {
            // 2. Fetch role from Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists() && snap.data().role) {
              assignedRole = snap.data().role;
            } else {
              assignedRole = 'user';
            }
          }

          setRealRole(assignedRole);
          
          // Check if admin previously set an impersonation session
          const savedImpersonation = localStorage.getItem('agrivision_admin_preview_role') as UserRole | null;
          if (assignedRole === 'administrator' && savedImpersonation && savedImpersonation !== 'administrator') {
            setActiveRole(savedImpersonation);
            setIsImpersonating(true);
          } else {
            setActiveRole(assignedRole);
            setIsImpersonating(false);
          }

          // Sync profile to Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Người dùng AgriVision',
            role: assignedRole,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          // Fallback check
          if (SYSTEM_ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase())) {
            setRealRole('administrator');
            setActiveRole('administrator');
          }
        }
      } else {
        // Guest user default
        setRealRole('user');
        setActiveRole('user');
        setIsImpersonating(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ONLY real administrators can change viewed role to preview lower roles!
  const impersonateRole = (newRole: UserRole) => {
    if (realRole !== 'administrator') {
      console.warn('Cảnh báo bảo mật: Bạn không có quyền quản trị để thay đổi cấp bậc.');
      return;
    }

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
      throw new Error('Vui lòng đăng nhập để gửi yêu cầu phân quyền.');
    }

    await submitRoleUpgradeRequest(
      user.uid,
      user.email || '',
      user.displayName || 'Người dùng',
      targetRole,
      organization,
      reason
    );
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Lỗi đăng nhập Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setRealRole('user');
      setActiveRole('user');
      setIsImpersonating(false);
      localStorage.removeItem('agrivision_admin_preview_role');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
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
        signInWithGoogle,
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
