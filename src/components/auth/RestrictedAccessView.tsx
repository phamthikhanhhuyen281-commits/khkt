import React, { useState } from 'react';
import { Lock, ShieldAlert, Sparkles, Send, Building2, UserCheck, LogIn, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RestrictedAccessViewProps {
  onOpenAccessMatrix: () => void;
}

export const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({ onOpenAccessMatrix }) => {
  const { user, signInWithGoogle, requestElevation } = useAuth();
  const [organization, setOrganization] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập Google trước khi gửi đề xuất phân quyền.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestElevation('researcher', organization, reason);
      setSuccess(true);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 text-center animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300 shadow-md">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
          Khu Vực Giới Hạn Quyền Hạn
        </span>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          Yêu Cầu Quyền Hạn Cấp 2 (Nghiên cứu viên) hoặc Cấp 3 (Quản trị viên)
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
          Khu vực này chứa <strong>Ma trận nhầm lẫn (Confusion Matrix)</strong>, công cụ khảo nghiệm mẫu thực địa độc lập và tính toán chỉ số thống kê học máy phục vụ công bố khoa học. Nhằm bảo đảm tính khách quan, quyền truy cập được phân tầng nghiêm ngặt.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onOpenAccessMatrix}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 shadow-xs cursor-pointer"
        >
          Xem Bảng Ma Trận Phân Quyền Hệ Thống
        </button>

        {!user && (
          <button
            onClick={() => signInWithGoogle()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập để xác thực quyền</span>
          </button>
        )}
      </div>

      {/* Role Elevation Request Box */}
      {user && (
        <div className="mt-8 text-left bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                Gửi Đơn Đề Xuất Cấp Quyền Nghiên Cứu Viên
              </h3>
              <p className="text-xs text-stone-500">
                Tài khoản: <strong>{user.email}</strong>
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>

          {success ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
              <p className="text-xs font-bold text-emerald-950">
                Đã gửi đề xuất thành công!
              </p>
              <p className="text-[11px] text-emerald-800">
                Quản trị viên hệ thống sẽ thẩm định cơ quan công tác và kích hoạt quyền cho bạn trong vòng 24 giờ.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Cơ quan / Viện / Trường / Hợp tác xã công tác *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="ví dụ: Viện Khoa học Nông nghiệp Bắc Trung Bộ / Chi cục BVTV"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Mục đích khảo nghiệm & nghiên cứu *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả đề tài, mục đích phân tích ma trận nhầm lẫn hoặc nhu cầu xuất dữ liệu CSV..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Cho Quản Trị Viên'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
