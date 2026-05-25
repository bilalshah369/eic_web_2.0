import { api } from './api';

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalApplications: number;
  totalOffices: number;
  totalAuditLogs: number;
  userType: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: string;
  createdAt: string;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  type: 'EIC' | 'EIA' | 'SUB_EIA';
  parentId: string | null;
  parent: { id: string; name: string; code: string } | null;
  address: string | null;
  state: string | null;
  district: string | null;
  subDistrict: string | null;
  city: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  hasLab: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfficesResponse {
  offices: Office[];
  total: number;
  limit: number;
  offset: number;
}

export interface OfficeStub {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface CreateOfficeDto {
  name: string;
  code: string;
  type: string;
  parentId?: string | null;
  address?: string;
  state?: string;
  district?: string;
  subDistrict?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  hasLab?: boolean;
}

export interface Officer {
  id: string;
  name: string;
  qualification: string;
  designation: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  telephone: string | null;
  mobile: string | null;
  email: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  isActive: boolean;
  createdAt: string;
  _count: { offices: number; categories: number };
}

export interface OfficerDetail extends Omit<Officer, '_count'> {
  offices:    { office: { id: string; name: string; code: string; type: string } }[];
  categories: { category: string }[];
}

export interface OfficersResponse {
  officers: Officer[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateOfficerDto {
  name: string;
  qualification: string;
  designation: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface CertificateProduct {
  id: string;
  name: string;
  category: string | null;
  hsCode: string | null;
  sortOrder: number;
}

export const adminApi = {
  getStats: () =>
    api.get<{ success: boolean; data: AdminStats }>('/admin/stats'),

  getAuditLogs: (params?: { limit?: number; offset?: number; action?: string; search?: string }) =>
    api.get<{ success: boolean; data: AuditLogsResponse }>('/admin/audit-logs', { params }),

  getUsers: (params?: { limit?: number; offset?: number; search?: string }) =>
    api.get<{ success: boolean; data: UsersResponse }>('/admin/users', { params }),

  getOffices: (params?: { limit?: number; offset?: number; search?: string; type?: string }) =>
    api.get<{ success: boolean; data: OfficesResponse }>('/admin/offices', { params }),

  getAllOffices: () =>
    api.get<{ success: boolean; data: OfficeStub[] }>('/admin/offices/all'),

  createOffice: (data: CreateOfficeDto) =>
    api.post<{ success: boolean; data: Office }>('/admin/offices', data),

  updateOffice: (id: string, data: Partial<CreateOfficeDto> & { isActive?: boolean }) =>
    api.put<{ success: boolean; data: Office }>(`/admin/offices/${id}`, data),

  resetOfficeLogin: (id: string) =>
    api.post<{ success: boolean; data: { email: string; tempPassword: string; role: string } }>(`/admin/offices/${id}/reset-login`),

  resetOfficerLogin: (id: string) =>
    api.post<{ success: boolean; data: { email: string; tempPassword: string; role: string } }>(`/admin/officers/${id}/reset-login`),

  getOfficers: (params?: { limit?: number; offset?: number; search?: string }) =>
    api.get<{ success: boolean; data: OfficersResponse }>('/admin/officers', { params }),

  getOfficerById: (id: string) =>
    api.get<{ success: boolean; data: OfficerDetail }>(`/admin/officers/${id}`),

  createOfficer: (data: CreateOfficerDto) =>
    api.post<{ success: boolean; data: Officer }>('/admin/officers', data),

  updateOfficer: (id: string, data: Partial<CreateOfficerDto> & { isActive?: boolean }) =>
    api.put<{ success: boolean; data: Officer }>(`/admin/officers/${id}`, data),

  assignOfficerOffices: (id: string, officeIds: string[]) =>
    api.put<{ success: boolean; data: OfficerDetail }>(`/admin/officers/${id}/assign-offices`, { officeIds }),

  assignOfficerCategories: (id: string, categories: string[]) =>
    api.put<{ success: boolean; data: OfficerDetail }>(`/admin/officers/${id}/assign-categories`, { categories }),

  getCertificateProducts: () =>
    api.get<{ success: boolean; data: CertificateProduct[] }>('/admin/certificate-products'),

  createCertificateProduct: (data: { name: string; category?: string; hsCode?: string; sortOrder?: number }) =>
    api.post<{ success: boolean; data: CertificateProduct }>('/admin/certificate-products', data),

  updateCertificateProduct: (id: string, data: { name?: string; category?: string; hsCode?: string; sortOrder?: number }) =>
    api.put<{ success: boolean; data: CertificateProduct }>(`/admin/certificate-products/${id}`, data),

  deleteCertificateProduct: (id: string) =>
    api.delete(`/admin/certificate-products/${id}`),

  deleteOffice: (id: string) => api.delete(`/admin/offices/${id}`),
  deleteOfficer: (id: string) => api.delete(`/admin/officers/${id}`),

  // ── PIA Masters ──────────────────────────────────────────────
  getMinerals: () =>
    api.get<{ success: boolean; data: PIAMineralOre[] }>('/admin/pia/minerals'),
  createMineral: (data: { name: string; code?: string; hsCode?: string }) =>
    api.post<{ success: boolean; data: PIAMineralOre }>('/admin/pia/minerals', data),
  updateMineral: (id: string, data: { name?: string; code?: string; hsCode?: string; isActive?: boolean }) =>
    api.put<{ success: boolean; data: PIAMineralOre }>(`/admin/pia/minerals/${id}`, data),
  deleteMineral: (id: string) => api.delete(`/admin/pia/minerals/${id}`),

  getPorts: () =>
    api.get<{ success: boolean; data: PIAPort[] }>('/admin/pia/ports'),
  createPort: (data: { name: string; code?: string; state?: string }) =>
    api.post<{ success: boolean; data: PIAPort }>('/admin/pia/ports', data),
  updatePort: (id: string, data: { name?: string; code?: string; state?: string; isActive?: boolean }) =>
    api.put<{ success: boolean; data: PIAPort }>(`/admin/pia/ports/${id}`, data),
  deletePort: (id: string) => api.delete(`/admin/pia/ports/${id}`),

  getFeeConfig: () =>
    api.get<{ success: boolean; data: PIAFeeConfig[] }>('/admin/pia/fee-config'),
  upsertFeeConfig: (data: { feeType: string; label: string; amount: number; description?: string; isActive?: boolean }) =>
    api.post<{ success: boolean; data: PIAFeeConfig }>('/admin/pia/fee-config', data),

  getDocumentChecklist: (subType?: string) =>
    api.get<{ success: boolean; data: PIADocumentChecklist[] }>('/admin/pia/document-checklist', { params: subType ? { subType } : undefined }),
  createDocumentChecklist: (data: { subType: string; documentType: string; documentLabel: string; description?: string; isMandatory?: boolean; sortOrder?: number }) =>
    api.post<{ success: boolean; data: PIADocumentChecklist }>('/admin/pia/document-checklist', data),
  updateDocumentChecklist: (id: string, data: { documentLabel?: string; description?: string; isMandatory?: boolean; sortOrder?: number; isActive?: boolean }) =>
    api.put<{ success: boolean; data: PIADocumentChecklist }>(`/admin/pia/document-checklist/${id}`, data),
  deleteDocumentChecklist: (id: string) => api.delete(`/admin/pia/document-checklist/${id}`),

  getStatusMaster: () =>
    api.get<{ success: boolean; data: PIAStatusMaster[] }>('/admin/pia/status-master'),
  createStatusMaster: (data: { code: string; label: string; description?: string; phase: string; sortOrder?: number; isActive?: boolean }) =>
    api.post<{ success: boolean; data: PIAStatusMaster }>('/admin/pia/status-master', data),
  updateStatusMaster: (id: string, data: { label?: string; description?: string; isActive?: boolean; sortOrder?: number }) =>
    api.put<{ success: boolean; data: PIAStatusMaster }>(`/admin/pia/status-master/${id}`, data),
  deleteStatusMaster: (id: string) => api.delete(`/admin/pia/status-master/${id}`),

  getDocumentMaster: () =>
    api.get<{ success: boolean; data: PIADocumentMaster[] }>('/admin/pia/document-master'),
  createDocumentMaster: (data: { code: string; label: string; description?: string; isRequired?: boolean; sortOrder?: number }) =>
    api.post<{ success: boolean; data: PIADocumentMaster }>('/admin/pia/document-master', data),
  updateDocumentMaster: (id: string, data: { code?: string; label?: string; description?: string; isRequired?: boolean; sortOrder?: number; isActive?: boolean }) =>
    api.put<{ success: boolean; data: PIADocumentMaster }>(`/admin/pia/document-master/${id}`, data),
  deleteDocumentMaster: (id: string) => api.delete(`/admin/pia/document-master/${id}`),
};

// ── PIA Master types ─────────────────────────────────────────────────────────

export interface PIAMineralOre {
  id: string;
  name: string;
  code: string | null;
  hsCode: string | null;
  isActive: boolean;
}

export interface PIAPort {
  id: string;
  name: string;
  code: string | null;
  state: string | null;
  isActive: boolean;
}

export interface PIAFeeConfig {
  id: string;
  feeType: 'APPLICATION_FEE' | 'ADDITIONAL_PORT_FEE' | 'INSPECTION_FEE' | 'ANNUAL_FEE';
  label: string;
  amount: number;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface PIADocumentChecklist {
  id: string;
  subType: 'NEW_RECOGNITION' | 'RENEWAL' | 'MODIFICATION';
  documentType: string;
  documentLabel: string;
  description: string | null;
  isMandatory: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface PIAStatusMaster {
  id: string;
  code: string;
  label: string;
  description: string | null;
  phase: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PIADocumentMaster {
  id: string;
  code: string;
  label: string;
  description: string | null;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
