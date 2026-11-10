import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserAccount, RoleUpgradeRequest, UserRole } from '../types';

const USERS_COLLECTION = 'users';
const REQUESTS_COLLECTION = 'role_requests';

// Default mock accounts for demonstration & testing
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_admin_01',
    email: 'phamthikhanhhuyen281@gmail.com',
    displayName: 'ThS. Phạm Thị Khánh Huyền',
    role: 'administrator',
    organization: 'Hội đồng Khoa học & Quản trị Hệ thống AgriVision',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'usr_res_02',
    email: 'nghiencuu.asir@edu.vn',
    displayName: 'TS. Nguyễn Văn Hùng',
    role: 'researcher',
    organization: 'Viện Khoa học Nông nghiệp Bắc Trung Bộ (ASIR)',
    status: 'active',
    createdAt: '2026-01-15T08:30:00Z',
    updatedAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 'usr_res_03',
    email: 'bvtv.nghean@gov.vn',
    displayName: 'Kỹ sư Trần Đức Thắng',
    role: 'researcher',
    organization: 'Chi cục Trồng trọt & BVTV Nghệ An',
    status: 'active',
    createdAt: '2026-02-01T09:15:00Z',
    updatedAt: '2026-02-25T14:20:00Z',
  },
  {
    id: 'usr_farmer_04',
    email: 'nongdan.camvinh@gmail.com',
    displayName: 'Nguyễn Văn Hải (Chủ vườn Cam Vinh)',
    role: 'user',
    organization: 'Hợp tác xã Nông nghiệp Quỳ Hợp, Nghệ An',
    status: 'active',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'usr_farmer_05',
    email: 'lethuy.lua@gmail.com',
    displayName: 'Lê Đình Khoa (Nông dân)',
    role: 'user',
    organization: 'Xã An Thủy, Huyện Lệ Thủy, Quảng Bình',
    status: 'active',
    createdAt: '2026-03-01T15:30:00Z',
    updatedAt: '2026-03-08T16:45:00Z',
  },
];

export const DEFAULT_REQUESTS: RoleUpgradeRequest[] = [
  {
    id: 'req_001',
    userId: 'usr_farmer_04',
    userEmail: 'nongdan.camvinh@gmail.com',
    displayName: 'Nguyễn Văn Hải (Chủ vườn Cam Vinh)',
    requestedRole: 'researcher',
    organization: 'Hợp tác xã Nông nghiệp Quỳ Hợp, Nghệ An',
    reason: 'Đang phối hợp với đoàn khảo nghiệm ASIR thu thập 50 mẫu lá cam nhiễm bệnh vàng lá gân xanh (HLB) tại vùng Quỳ Hợp.',
    status: 'pending',
    createdAt: '2026-03-09T08:00:00Z',
  },
];

const LOCAL_USERS_KEY = 'agrivision_local_users';
const LOCAL_REQUESTS_KEY = 'agrivision_local_role_requests';

function getLocalUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveLocalUsers(users: UserAccount[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn(e);
  }
}

function getLocalRequests(): RoleUpgradeRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_REQUESTS;
  } catch {
    return DEFAULT_REQUESTS;
  }
}

function saveLocalRequests(reqs: RoleUpgradeRequest[]) {
  try {
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(reqs));
  } catch (e) {
    console.warn(e);
  }
}

export async function fetchUsers(): Promise<UserAccount[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return getLocalUsers();
    }
    const items: UserAccount[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) });
    });
    // Merge with defaults so seed accounts are visible
    const existingIds = new Set(items.map((u) => u.id));
    const merged = [...items, ...getLocalUsers().filter((u) => !existingIds.has(u.id))];
    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    return getLocalUsers();
  }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  // Update local
  const users = getLocalUsers().map((u) => (u.id === userId ? { ...u, role: newRole, updatedAt: new Date().toISOString() } : u));
  saveLocalUsers(users);

  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
  }
}

export async function fetchRoleUpgradeRequests(): Promise<RoleUpgradeRequest[]> {
  try {
    const colRef = collection(db, REQUESTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return getLocalRequests();
    }
    const items: RoleUpgradeRequest[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REQUESTS_COLLECTION);
    return getLocalRequests();
  }
}

export async function submitRoleUpgradeRequest(
  userId: string,
  userEmail: string,
  displayName: string,
  requestedRole: 'researcher' | 'administrator',
  organization: string,
  reason: string
): Promise<RoleUpgradeRequest> {
  const newReq: RoleUpgradeRequest = {
    id: `req_${Date.now()}`,
    userId,
    userEmail,
    displayName,
    requestedRole,
    organization,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const reqs = getLocalRequests();
  reqs.unshift(newReq);
  saveLocalRequests(reqs);

  try {
    const reqRef = doc(db, REQUESTS_COLLECTION, newReq.id);
    await setDoc(reqRef, newReq);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REQUESTS_COLLECTION}/${newReq.id}`);
  }

  return newReq;
}

export async function processRoleUpgradeRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  userId: string,
  grantedRole?: UserRole
): Promise<void> {
  const reqs = getLocalRequests().map((r) => (r.id === requestId ? { ...r, status } : r));
  saveLocalRequests(reqs);

  if (status === 'approved' && grantedRole) {
    await updateUserRole(userId, grantedRole);
  }

  try {
    const reqRef = doc(db, REQUESTS_COLLECTION, requestId);
    await setDoc(reqRef, { status }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REQUESTS_COLLECTION}/${requestId}`);
  }
}
