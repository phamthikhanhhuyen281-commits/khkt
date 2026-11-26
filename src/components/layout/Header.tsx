import React, { useState } from 'react';
import {
  Sprout,
  FlaskConical,
  Scan,
  BookOpen,
  History,
  MessageCircle,
  LogOut,
  User,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { AccessMatrixModal } from '../auth/AccessMatrixModal';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    user,
    role,
    openAuthModal,
    signOut,
    isResearcher,
    isRealAdmin,
    isImpersonating,
    impersonateRole,
    resetImpersonation,
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    user: {
      label: 'Nông dân',
      desc: 'Giao diện tối giản cho bà con',
    },
    researcher: {
      label: 'Nghiên cứu viên',
      desc: 'Xem mẫu thực địa & số liệu',
    },
    administrator: {
      label: 'Quản trị viên',
      desc: 'Quản lý sổ bệnh & người dùng',
    },
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Sprout },
    { id: 'scanner', label: 'Chụp khám', icon: Scan },
    { id: 'library', label: 'Sổ bệnh', icon: BookOpen },
    { id: 'assistant', label: 'Hỏi đáp', icon: MessageCircle },
    { id: 'history', label: 'Đã khám', icon: History },
    ...(isResearcher ? [{ id: 'research', label: 'Quản trị', icon: FlaskConical }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
        {isImpersonating && (
          <div className="bg-amber-100 text-amber-950 px-4 py-1.5 text-center text-sm font-semibold flex items-center justify-center gap-3 border-b border-amber-200">
            <span>Đang xem thử vai trò: {roleLabels[role].label}</span>
            <button
              onClick={resetImpersonation}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-900 text-white text-xs font-bold hover:bg-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Quay lại Quản trị</span>
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Zone 1: Brand */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer shrink-0 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-stone-900 whitespace-nowrap">
                AgriVision
              </span>
            </button>

            {/* Zone 2: Simple Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer min-h-[42px] ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'text-stone-700 hover:text-emerald-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Primary Action / Account */}
            <div className="flex items-center gap-2 shrink-0">
              {isRealAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200 cursor-pointer min-h-[42px] whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="hidden sm:inline">{roleLabels[role].label}</span>
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  </button>

                  {showRoleMenu && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50"
                      onMouseLeave={() => setShowRoleMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-sm font-bold text-stone-900">Chọn chế độ xem</p>
                      </div>
                      <div className="p-1.5 space-y-1">
                        {(['administrator', 'researcher', 'user'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              impersonateRole(r);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-colors cursor-pointer ${
                              role === r
                                ? 'bg-emerald-50 text-emerald-900 font-bold'
                                : 'text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <div>{roleLabels[r].label}</div>
                            <div className="text-xs text-stone-500 font-normal">{roleLabels[r].desc}</div>
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 mt-1 border-t border-stone-100 px-3 flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            setIsMatrixModalOpen(true);
                          }}
                          className="text-emerald-700 hover:underline font-semibold py-1 cursor-pointer"
                        >
                          Xem bảng quyền
                        </button>
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            setActiveTab('research');
                          }}
                          className="text-stone-700 hover:underline font-semibold py-1 cursor-pointer"
                        >
                          Trang quản trị →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2 py-1 rounded-xl"
                    title={user.email || user.phoneNumber || user.username || 'Tài khoản'}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Ảnh đại diện'}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-stone-200 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'B'}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-stone-800 max-w-[96px] sm:max-w-[140px] truncate">
                      {user.displayName || user.phoneNumber || user.email?.split('@')[0] || 'Bác Nông Dân'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-semibold text-stone-700 hover:text-red-700 hover:bg-red-50 rounded-xl border border-stone-200 transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                >
                  <User className="w-4 h-4" />
                  <span>Đăng nhập 1 chạm</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal />

      <AccessMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
      />
    </>
  );
};
