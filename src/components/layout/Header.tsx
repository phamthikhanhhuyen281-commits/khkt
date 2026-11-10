import React, { useState } from 'react';
import { 
  Sprout, 
  FlaskConical, 
  Scan, 
  BookOpen, 
  History, 
  Bot, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  LogIn,
  ChevronDown,
  Layers,
  Sparkles,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { AccessMatrixModal } from '../auth/AccessMatrixModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { 
    user, 
    role, 
    realRole, 
    signInWithGoogle, 
    signOut, 
    isAdmin, 
    isResearcher, 
    isRealAdmin, 
    isImpersonating, 
    impersonateRole, 
    resetImpersonation 
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; color: string; desc: string }> = {
    user: {
      label: 'Cấp 1: Nông dân',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: 'Sàng lọc ảnh bệnh, xem thư viện & lịch sử cá nhân',
    },
    researcher: {
      label: 'Cấp 2: Nghiên cứu viên',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      desc: 'Ma trận nhầm lẫn, tập mẫu thực địa & xuất dữ liệu CSV',
    },
    administrator: {
      label: 'Cấp 3: Quản trị viên',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      desc: 'Toàn quyền duyệt kết quả, sửa thư viện & phân cấp quyền',
    },
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Sprout },
    { id: 'scanner', label: 'Quét bệnh AI', icon: Scan },
    { id: 'assistant', label: 'Trợ lý AI', icon: Bot },
    { id: 'library', label: 'Thư viện bệnh', icon: BookOpen },
    { id: 'history', label: 'Lịch sử chẩn đoán', icon: History },
    { id: 'research', label: 'Nghiên cứu & Quản trị', icon: FlaskConical, highlight: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        {/* Banner if admin is in impersonation/preview mode */}
        {isImpersonating && (
          <div className="bg-amber-500 text-amber-950 px-4 py-1 text-center text-xs font-bold flex items-center justify-center gap-2">
            <span>Đang ở chế độ xem trước dưới vai trò: {roleLabels[role].label}</span>
            <button
              onClick={resetImpersonation}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-900 text-white text-[10px] hover:bg-black transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Quay lại Quản trị viên</span>
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div 
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setActiveTab('home')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-md shadow-emerald-900/20">
                <Sprout className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-emerald-950 font-sans">
                    AgriVision <span className="text-emerald-600">AI</span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Bắc Trung Bộ
                  </span>
                </div>
                <p className="text-xs text-stone-500 hidden sm:block">
                  Hệ thống AI sàng lọc dịch bệnh Cam chanh • Lúa • Lạc
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : item.highlight
                        ? 'text-stone-700 hover:text-emerald-800 hover:bg-emerald-50/80 border border-emerald-200'
                        : 'text-stone-600 hover:text-emerald-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                    {item.highlight && !isResearcher && (
                      <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Controls & RBAC Role Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Role Indicator Pill */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (isRealAdmin) {
                      setShowRoleMenu(!showRoleMenu);
                    } else {
                      setIsMatrixModalOpen(true);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${roleLabels[role].color}`}
                  title={isRealAdmin ? 'Quản trị viên: Bấm để chọn vai trò mô phỏng' : 'Bấm để xem Bảng phân quyền hệ thống'}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{roleLabels[role].label}</span>
                  <span className="sm:hidden capitalize">{role}</span>
                  {isRealAdmin ? (
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  ) : (
                    <span className="text-[10px] opacity-75 font-normal ml-0.5 underline">Chi tiết</span>
                  )}
                </button>

                {/* Admin-only Impersonation Dropdown */}
                {isRealAdmin && showRoleMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowRoleMenu(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-stone-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-900">Quyền Hạn Quản Trị Viên</p>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-900">
                          Root Access
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Bạn có toàn quyền. Chọn vai trò bên dưới để kiểm thử giao diện các cấp bậc.
                      </p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {(['administrator', 'researcher', 'user'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            impersonateRole(r);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-start gap-2 ${
                            role === r ? 'bg-purple-50 text-purple-900 font-bold' : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="mt-0.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${role === r ? 'bg-purple-600' : 'bg-stone-300'}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900">{roleLabels[r].label}</div>
                            <div className="text-[10px] text-stone-500">{roleLabels[r].desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-stone-100 px-3 py-1 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setIsMatrixModalOpen(true);
                        }}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        Bảng ma trận quyền hạn →
                      </button>
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setActiveTab('research');
                        }}
                        className="text-purple-700 hover:underline font-semibold"
                      >
                        Quản lý thành viên →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Google Sign-in / User Profile */}
              {user ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                    title={user.email || 'Người dùng'}
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Avatar'} 
                        className="w-7 h-7 rounded-full border border-stone-200 object-cover" 
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-xs font-medium text-stone-700 hidden lg:inline max-w-[100px] truncate">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Access Control Matrix Modal */}
      <AccessMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
      />
    </>
  );
};
