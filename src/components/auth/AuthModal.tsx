import React, { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    quickSignInPhone,
  } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setPhone('');
      setError(null);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 11) {
      setError('Bác vui lòng nhập đúng số điện thoại (9 - 11 chữ số) nhé.');
      return;
    }
    setError(null);
    quickSignInPhone(phone.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            Đăng nhập / Lưu hồ sơ
          </h2>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-base font-medium">
              {error}
            </div>
          )}

          {/* Direct Phone Sign-in (no Google, no OTP code, no password) */}
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label className="block text-lg font-bold text-stone-900 mb-2">
                Nhập số điện thoại của bác
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoFocus
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full min-h-[54px] pl-11 pr-4 py-3 rounded-xl border-2 border-stone-300 text-lg font-semibold focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[58px] rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-lg font-bold transition-all cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </form>

          {/* Friendly Note at Bottom */}
          <p className="pt-3 border-t border-stone-200 text-sm sm:text-base text-stone-600 leading-relaxed text-center">
            Bác không cần đăng nhập vẫn dùng được bình thường. Đăng nhập giúp lưu lại lịch sử khám bệnh không bị mất khi đổi điện thoại.
          </p>
        </div>
      </div>
    </div>
  );
};
