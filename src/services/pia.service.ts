import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PIASubType = 'NEW_RECOGNITION' | 'RENEWAL' | 'MODIFICATION';
export type PIAStatus =
  | 'DRAFT' | 'SUBMITTED' | 'APPLICATION_FEE_PENDING' | 'APPLICATION_FEE_PAID'
  | 'RECEIVED_BY_EIA' | 'FORWARDED_TO_EIC' | 'UNDER_DOCUMENT_SCRUTINY'
  | 'DISCREPANCY_RAISED' | 'RESUBMITTED_BY_APPLICANT' | 'SCRUTINY_COMPLETED'
  | 'UNDER_FINAL_REVIEW' | 'APPROVED_BY_EIC' | 'REJECTED' | 'ACTIVE'
  | 'RENEWAL_DUE' | 'RENEWED' | 'SUSPENDED' | 'EXPIRED' | 'WITHDRAWN';

export interface PIABranchPayload {
  branchName: string;
  address: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  headOfBranchName: string;
  headOfBranchDesignation: string;
}

export interface PIAPartIPayload {
  agencyName?: string;
  agencyNameHindi?: string;
  headOfficeAddress?: string;
  headOfficeState?: string;
  headOfficeDistrict?: string;
  headOfficeCity?: string;
  headOfficePincode?: string;
  headOfficeCountry?: string;
  headOfficePhone?: string;
  headOfficeFax?: string;
  headOfficeEmail?: string;
  headOfOrgName?: string;
  headOfOrgDesignation?: string;
  headOfOrgContact?: string;
  legalStatus?: string;
  legalStatusDetails?: string;
  inspectionDivHeadName?: string;
  inspectionDivHeadDesignation?: string;
  inspectionDivPhone?: string;
  inspectionDivEmail?: string;
  labDivHeadName?: string;
  labDivHeadDesignation?: string;
  labDivPhone?: string;
  labDivEmail?: string;
  branches?: PIABranchPayload[];
}

export interface PIAApplicationSummary {
  id: string;
  appNo: string;
  status: string;
  organisation: string;
  updatedAt: string;
  createdAt: string;
  piaApplication: {
    id: string;
    subType: PIASubType;
    piaStatus: PIAStatus;
    updatedAt: string;
  } | null;
}

export interface PIAApplicationFull extends PIAApplicationSummary {
  piaApplication: {
    id: string;
    subType: PIASubType;
    piaStatus: PIAStatus;
    agencyNameHindi: string | null;
    headOfficeAddress: string | null;
    headOfficeState: string | null;
    headOfficeDistrict: string | null;
    headOfficeCity: string | null;
    headOfficePincode: string | null;
    headOfficeCountry: string | null;
    headOfficePhone: string | null;
    headOfficeFax: string | null;
    headOfficeEmail: string | null;
    headOfOrgName: string | null;
    headOfOrgDesignation: string | null;
    headOfOrgContact: string | null;
    legalStatus: string | null;
    legalStatusDetails: string | null;
    inspectionDivHeadName: string | null;
    inspectionDivHeadDesignation: string | null;
    inspectionDivPhone: string | null;
    inspectionDivEmail: string | null;
    labDivHeadName: string | null;
    labDivHeadDesignation: string | null;
    labDivPhone: string | null;
    labDivEmail: string | null;
    updatedAt: string;
    branches: Array<PIABranchPayload & { id: string }>;
  } | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const piaApi = {
  createDraft: async (agencyName: string, subType: PIASubType = 'NEW_RECOGNITION') => {
    const { data } = await api.post('/pia/applications', { agencyName, subType });
    return data.data as PIAApplicationFull;
  },

  list: async () => {
    const { data } = await api.get('/pia/applications');
    return data.data as PIAApplicationSummary[];
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/pia/applications/${id}`);
    return data.data as PIAApplicationFull;
  },

  savePartI: async (id: string, payload: PIAPartIPayload) => {
    const { data } = await api.put(`/pia/applications/${id}`, payload);
    return data.data as PIAApplicationFull;
  },
};
