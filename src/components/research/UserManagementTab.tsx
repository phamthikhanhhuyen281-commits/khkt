import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Building2,
  Mail,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { UserAccount, RoleUpgradeRequest, UserRole } from '../../types';
import { 
  fetchUsers, 
  updateUserRole, 
  fetchRoleUpgradeRequests, 
  processRoleUpgradeRequest 
} from '../../services/userService';
import { SYSTEM_ADMIN_EMAILS } from '../../context/AuthContext';

export const UserManagementTab: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [requests, setRequests] = useState<RoleUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        fetchUsers(),
        fetchRoleUpgradeRequests(),
      ]);
      setUsers(u);
      setRequests(r);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, userEmail: string) => {
    if (SYSTEM_ADMIN_EMAILS.includes(userEmail.toLowerCase()) && newRole !== 'administrator') {
      alert('Không thể hạ quyền của Quản trị viên gốc hệ thống.');
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setActionSuccess(`Đã cập nhật vai trò người dùng thành "${newRole}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Lỗi cập nhật vai trò: ' + err.message);
    }
  };

  const handleProcessRequest = async (
    req: RoleUpgradeRequest,
    status: 'approved' | 'rejected'
  ) => {
    try {
      await processRoleUpgradeRequest(
        req.id,
        status,
        req.userId,
        status === 'approved' ? req.requestedRole : undefined
      );
      await loadData();
      setActionSuccess(
        status === 'approved'
          ? `Đã phê duyệt quyền ${req.requestedRole} cho ${req.displayName}.`
          : `Đã từ chối yêu cầu của ${req.displayName}.`
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Lỗi xử lý yêu cầu: ' + err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Pending Role Upgrade Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Đơn Đề Xuất Phân Quyền Đang Chờ Duyệt ({pendingRequests.length})</span>
            </h3>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              Cần thẩm định
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3 shadow-xs text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-stone-900">{req.displayName}</h4>
                    <p className="text-[11px] text-stone-500">{req.userEmail}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    Đề xuất: {req.requestedRole === 'researcher' ? 'Nhà nghiên cứu' : 'Quản trị viên'}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-700">
                  <div className="flex items-center gap-1 font-semibold text-stone-900">
                    <Building2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>{req.organization}</span>
                  </div>
                  <p className="italic text-stone-600">"{req.reason}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleProcessRequest(req, 'rejected')}
                    className="px-3 py-1.5 rounded-xl font-semibold bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 transition-colors"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleProcessRequest(req, 'approved')}
                    className="px-4 py-1.5 rounded-xl font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition-colors"
                  >
                    Chấp thuận & Cấp quyền
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Users Management List */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Danh Sách Người Dùng & Phân Tầng Quyền Hạn</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Chỉ Quản trị viên cấp 3 mới có thẩm quyền thăng cấp hoặc hạ cấp người dùng trong hệ thống
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
            Tổng cộng: {users.length} thành viên
          </span>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên thành viên, email hoặc cơ quan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-emerald-600 bg-stone-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'administrator', label: 'Quản trị viên' },
              { id: 'researcher', label: 'Nghiên cứu viên' },
              { id: 'user', label: 'Nông dân' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRoleFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === f.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-900 font-bold">
              <tr>
                <th className="p-3">Thành Viên</th>
                <th className="p-3">Cơ Quan / Đơn Vị</th>
                <th className="p-3">Vai Trò Hiện Tại</th>
                <th className="p-3">Hành Động Phân Cấp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((u) => {
                const isSystemMaster = SYSTEM_ADMIN_EMAILS.includes(u.email.toLowerCase());
                return (
                  <tr key={u.id} className="hover:bg-stone-50/80">
                    <td className="p-3">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{u.displayName}</span>
                        {isSystemMaster && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-xs bg-purple-100 text-purple-900 border border-purple-300">
                            Root Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-stone-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="p-3 text-stone-600">
                      {u.organization || 'Hộ nông dân canh tác tự do'}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.role === 'administrator'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : u.role === 'researcher'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {u.role === 'administrator'
                            ? 'Cấp 3: Quản trị viên'
                            : u.role === 'researcher'
                            ? 'Cấp 2: Nghiên cứu viên'
                            : 'Cấp 1: Nông dân'}
                        </span>
                      </span>
                    </td>

                    <td className="p-3">
                      {isSystemMaster ? (
                        <span className="text-[11px] text-stone-400 italic">Quản trị viên tối cao</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.email)}
                            className="px-2.5 py-1 rounded-lg border border-stone-300 text-xs font-semibold bg-white cursor-pointer hover:border-emerald-600"
                          >
                            <option value="user">Cấp 1: Nông dân</option>
                            <option value="researcher">Cấp 2: Nghiên cứu viên</option>
                            <option value="administrator">Cấp 3: Quản trị viên</option>
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
