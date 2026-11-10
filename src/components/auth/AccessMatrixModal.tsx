import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Lock, 
  Send, 
  AlertCircle, 
  Building2, 
  FileText, 
  Info,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AccessMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessMatrixModal: React.FC<AccessMatrixModalProps> = ({ isOpen, onClose }) => {
  const { user, role, realRole, isRealAdmin, impersonateRole, resetImpersonation, isImpersonating, requestElevation } = useAuth();

  const [activeTab, setActiveTab] = useState<'matrix' | 'request'>('matrix');
  const [organization, setOrganization] = useState('');
  const [reason, setReason] = useState('');
  const [requestedRole, setRequestedRole] = useState<'researcher' | 'administrator'>('researcher');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const permissionsList = [
    {
      feature: 'Sàng lọc ảnh bệnh thực vật (AI Scanner)',
      user: true,
      researcher: true,
      admin: true,
      desc: 'Tải ảnh, chụp camera, nhận diện triệu chứng sơ bộ với Gemini',
    },
    {
      feature: 'Trò chuyện với Trợ lý AI nông nghiệp',
      user: true,
      researcher: true,
      admin: true,
      desc: 'Hỏi đáp kỹ thuật, triệu chứng và quy trình quản lý sâu bệnh',
    },
    {
      feature: 'Tra cứu Thư viện Bệnh học Bắc Trung Bộ',
      user: 'Chỉ đọc',
      researcher: 'Chỉ đọc',
      admin: 'Toàn quyền',
      desc: 'Thêm mới, sửa đổi, kiểm duyệt hồ sơ bệnh trong cơ sở dữ liệu',
    },
    {
      feature: 'Lịch sử chẩn đoán cá nhân',
      user: 'Cá nhân',
      researcher: 'Cá nhân',
      admin: 'Toàn bộ',
      desc: 'Xem lại ảnh và kết quả quét của chính mình',
    },
    {
      feature: 'Xem Chỉ số Khoa học & Ma trận Nhầm lẫn',
      user: false,
      researcher: true,
      admin: true,
      desc: 'Accuracy, Precision, Recall, F1-Score & Confusion Matrix',
    },
    {
      feature: 'Khảo sát & Quản lý Tập Mẫu Thực địa',
      user: false,
      researcher: true,
      admin: true,
      desc: 'Xem và bổ sung mẫu bệnh thực tế tại các huyện Nghệ An, Hà Tĩnh...',
    },
    {
      feature: 'Xuất Dữ liệu Nghiên cứu An danh (CSV)',
      user: false,
      researcher: true,
      admin: true,
      desc: 'Tải tập dữ liệu đối chứng chuẩn phục vụ phân tích khoa học',
    },
    {
      feature: 'Thẩm định & Hiệu đính Mẫu của Nông dân',
      user: false,
      researcher: true,
      admin: true,
      desc: 'Ghi chú chuyên môn, xác thực nhãn bệnh chính thức',
    },
    {
      feature: 'Quản trị Thành viên & Phân cấp Quyền (RBAC)',
      user: false,
      researcher: false,
      admin: true,
      desc: 'Chỉ định quyền hạn, phê duyệt đơn nâng cấp của cán bộ',
    },
  ];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập bằng Google trước khi gửi yêu cầu nâng cấp quyền.');
      return;
    }

    if (!organization.trim() || !reason.trim()) {
      alert('Vui lòng điền tên tổ chức và lý do tiếp cận dữ liệu nghiên cứu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestElevation(requestedRole, organization, reason);
      setSubmitSuccess(true);
    } catch (err: any) {
      alert('Lỗi gửi yêu cầu: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                Phân Cấp Quyền Hạn Hệ Thống (RBAC)
              </h3>
              <p className="text-xs text-stone-500">
                Chính sách bảo mật dữ liệu và phân tầng truy cập khoa học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Status Bar */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500">Tài khoản của bạn:</span>
            <span className="font-bold text-stone-900">
              {user?.email || 'Khách vãng lai (Chưa đăng nhập)'}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
              realRole === 'administrator'
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : realRole === 'researcher'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              Cấp bậc thực tế: {realRole === 'administrator' ? 'Cấp 3: Quản trị viên' : realRole === 'researcher' ? 'Cấp 2: Nhà nghiên cứu' : 'Cấp 1: Nông dân'}
            </span>
          </div>

          {/* Admin Preview Mode Switcher (ONLY for real admins) */}
          {isRealAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-purple-900 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Mô phỏng góc nhìn:</span>
              </span>
              <div className="flex rounded-lg border border-purple-200 bg-white p-0.5">
                {(['user', 'researcher', 'administrator'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => impersonateRole(r)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize transition-colors ${
                      role === r
                        ? 'bg-purple-800 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {r === 'user' ? 'Nông dân' : r === 'researcher' ? 'Nghiên cứu' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b border-stone-200 px-6 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Bảng Ma Trận Quyền Hạn Chi Tiết
          </button>
          {!isRealAdmin && (
            <button
              onClick={() => setActiveTab('request')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'request'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Gửi Đề Xuất Cấp Quyền Nghiên Cứu
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700">
          {activeTab === 'matrix' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Để đảm bảo tính toàn vẹn khoa học của dữ liệu bệnh học và tránh gian lận mẫu khảo nghiệm, hệ thống áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege). Người dùng không thể tự ý nâng cấp vai trò mà phải qua phê duyệt của Hội đồng Quản trị.
                </p>
              </div>

              {/* Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-900 font-bold">
                      <th className="p-3">Chức năng & Nghiệp vụ</th>
                      <th className="p-3 text-center bg-emerald-50/50 text-emerald-950">
                        Cấp 1: Nông dân
                      </th>
                      <th className="p-3 text-center bg-blue-50/50 text-blue-950">
                        Cấp 2: Nghiên cứu viên
                      </th>
                      <th className="p-3 text-center bg-purple-50/50 text-purple-950">
                        Cấp 3: Quản trị viên
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {permissionsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/80">
                        <td className="p-3">
                          <div className="font-bold text-stone-900">{item.feature}</div>
                          <div className="text-[11px] text-stone-500">{item.desc}</div>
                        </td>

                        {/* User */}
                        <td className="p-3 text-center">
                          {item.user === true ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : item.user === false ? (
                            <Lock className="w-3.5 h-3.5 text-stone-300 mx-auto" />
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-sm">
                              {item.user}
                            </span>
                          )}
                        </td>

                        {/* Researcher */}
                        <td className="p-3 text-center">
                          {item.researcher === true ? (
                            <Check className="w-4 h-4 text-blue-600 mx-auto" />
                          ) : item.researcher === false ? (
                            <Lock className="w-3.5 h-3.5 text-stone-300 mx-auto" />
                          ) : (
                            <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-sm">
                              {item.researcher}
                            </span>
                          )}
                        </td>

                        {/* Admin */}
                        <td className="p-3 text-center">
                          {item.admin === true ? (
                            <Check className="w-4 h-4 text-purple-600 mx-auto" />
                          ) : item.admin === false ? (
                            <Lock className="w-3.5 h-3.5 text-stone-300 mx-auto" />
                          ) : (
                            <span className="text-[10px] font-semibold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded-sm">
                              {item.admin}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Request Form */
            <div className="space-y-4">
              {submitSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Đã Gửi Đề Xuất Phân Quyền Thành Công!
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed max-w-md mx-auto">
                    Yêu cầu của bạn đã được chuyển đến Quản trị viên hệ thống. Sau khi thẩm định tư cách nghiên cứu viên hoặc cơ quan công tác, quyền truy cập sẽ được tự động kích hoạt.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setActiveTab('matrix');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900"
                  >
                    Xem lại bảng quyền hạn
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                    Dành cho các cán bộ khuyến nông, giảng viên, sinh viên hoặc nghiên cứu viên thuộc Viện BVTV, Viện ASIR, Chi cục Trồng trọt các tỉnh cần tiếp cận ma trận đối chuẩn và xuất dữ liệu CSV.
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Cấp bậc đề xuất nâng cấp *
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                    >
                      <option value="researcher">Cấp 2: Cán bộ Nghiên cứu Khoa học (Researcher)</option>
                      <option value="administrator">Cấp 3: Quản trị viên Bệnh học (Administrator)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Tên Cơ quan / Viện / Hợp tác xã công tác *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="ví dụ: Viện Khoa học Nông nghiệp Bắc Trung Bộ / ĐH Nông Lâm Huế"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Mục đích tiếp cận và khảo nghiệm dữ liệu *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Mô tả đề tài nghiên cứu, đề án khảo nghiệm dịch hại vùng hoặc nhu cầu thu thập mẫu..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Đề Xuất Phân Quyền'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Hệ thống phân quyền Zero-Trust theo vai trò RBAC</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
