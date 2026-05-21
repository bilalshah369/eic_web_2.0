import { api } from './api';

// ─── Enums / simple types ─────────────────────────────────────────────────────

export type PIASubType = 'NEW_RECOGNITION' | 'RENEWAL' | 'MODIFICATION';
export type PIAStatus =
  | 'DRAFT' | 'SUBMITTED' | 'APPLICATION_FEE_PENDING' | 'APPLICATION_FEE_PAID'
  | 'RECEIVED_BY_EIA' | 'FORWARDED_TO_EIC' | 'UNDER_DOCUMENT_SCRUTINY'
  | 'DISCREPANCY_RAISED' | 'RESUBMITTED_BY_APPLICANT' | 'SCRUTINY_COMPLETED'
  | 'UNDER_FINAL_REVIEW' | 'APPROVED_BY_EIC' | 'REJECTED' | 'ACTIVE'
  | 'RENEWAL_DUE' | 'RENEWED' | 'SUSPENDED' | 'EXPIRED' | 'WITHDRAWN';

export type QMSType = 'ISO_17020' | 'ISO_9001' | 'BOTH' | 'NONE';

// ─── Master data ──────────────────────────────────────────────────────────────

export interface PIAPortMaster    { id: string; name: string; code: string | null; state: string | null; isActive: boolean }
export interface PIAMineralMaster { id: string; name: string; code: string | null; hsCode: string | null; isActive: boolean }

// ─── Part I ───────────────────────────────────────────────────────────────────

export interface PIABranchPayload {
  branchName: string; address: string; state: string; district: string; city: string;
  pincode: string; phone: string; fax: string; email: string; headOfBranchName: string; headOfBranchDesignation: string;
}

export interface PIAPartIPayload {
  agencyName?: string; agencyNameHindi?: string;
  headOfficeAddress?: string; headOfficeState?: string; headOfficeDistrict?: string;
  headOfficeCity?: string; headOfficePincode?: string; headOfficeCountry?: string;
  headOfficePhone?: string; headOfficeFax?: string; headOfficeEmail?: string;
  headOfOrgName?: string; headOfOrgDesignation?: string; headOfOrgContact?: string;
  legalStatus?: string; legalStatusDetails?: string;
  inspectionDivHeadName?: string; inspectionDivHeadDesignation?: string; inspectionDivPhone?: string; inspectionDivFax?: string; inspectionDivEmail?: string;
  labDivHeadName?: string; labDivHeadDesignation?: string; labDivPhone?: string; labDivFax?: string; labDivEmail?: string;
  recognitionValidityDate?: string | null; recognitionPeriod?: number | null; existingRecognitionNo?: string | null;
  hasCriminalProceedings?: boolean; criminalProceedingsDetails?: string;
  mineralScopes?: MineralScopeRow[];
  branches?: PIABranchPayload[];
}

// ─── Part II ──────────────────────────────────────────────────────────────────

export interface ManpowerRow {
  isSeniorMgmt: boolean; name: string; designation: string;
  qualification: string; experienceYears: string; specialization: string;
}
export interface LabManpowerRow {
  isSeniorMgmt: boolean; name: string; designation: string;
  qualification: string; experienceYears: string;
}
export interface MineralScopeRow { mineralOreId: string; specifications: string }
export interface LabEquipmentRow {
  name: string; make: string; model: string;
  serialNo: string; rangeCapacity: string; calibrationDueDate: string;
}
export interface LabProductRow {
  productName: string; testParameters: string; testMethods: string;
}

export interface PIAPartIIPayload {
  seniorMgmtCount?: number | null;
  inspectingStaffCount?: number | null;
  qmsImplemented?: boolean;
  qmsType?: string;
  isAccredited?: boolean;
  accreditationScope?: string;
  accreditationBody?: string;
  consultancyDetails?: string;
  hasDomesticExperience?: boolean;
  hasExportExperience?: boolean;
  hasLaboratory?: boolean;
  hasLabAccreditation?: boolean;
  labAccreditationType?: string;
  labAccreditationScope?: string;
  labConsultancyDetails?: string;
  hasOtherActivities?: boolean;       otherActivitiesDetails?: string;
  hasLinkedOrganization?: boolean;    linkedOrgDetails?: string;
  hasRelatedActivities?: boolean;     relatedActivitiesDetails?: string;
  hasDisputesWithClients?: boolean;   disputesDetails?: string;
  hasCriminalProceedings?: boolean;   criminalProceedingsDetails?: string;
  portIds?: string[];
  mineralScopes?: MineralScopeRow[];
  manpower?: ManpowerRow[];
  labManpower?: LabManpowerRow[];
  labEquipment?: LabEquipmentRow[];
  labProducts?: LabProductRow[];
}

// ─── Full application shape from API ─────────────────────────────────────────

export interface PIAApplicationSummary {
  id: string; appNo: string; status: string; organisation: string;
  updatedAt: string; createdAt: string;
  piaApplication: { id: string; subType: PIASubType; piaStatus: PIAStatus; updatedAt: string } | null;
}

export interface PIAApplicationFull extends PIAApplicationSummary {
  piaApplication: {
    id: string; subType: PIASubType; piaStatus: PIAStatus;
    // Part I
    agencyNameHindi: string | null;
    headOfficeAddress: string | null; headOfficeState: string | null; headOfficeDistrict: string | null;
    headOfficeCity: string | null; headOfficePincode: string | null; headOfficeCountry: string | null;
    headOfficePhone: string | null; headOfficeFax: string | null; headOfficeEmail: string | null;
    headOfOrgName: string | null; headOfOrgDesignation: string | null; headOfOrgContact: string | null;
    legalStatus: string | null; legalStatusDetails: string | null;
    inspectionDivHeadName: string | null; inspectionDivHeadDesignation: string | null;
    inspectionDivPhone: string | null; inspectionDivFax: string | null; inspectionDivEmail: string | null;
    labDivHeadName: string | null; labDivHeadDesignation: string | null;
    labDivPhone: string | null; labDivFax: string | null; labDivEmail: string | null;
    recognitionValidityDate: string | null; recognitionPeriod: number | null; existingRecognitionNo: string | null;
    hasCriminalProceedings: boolean; criminalProceedingsDetails: string | null;
    branches: Array<PIABranchPayload & { id: string }>;
    // Part II
    seniorMgmtCount: number | null; inspectingStaffCount: number | null;
    qmsImplemented: boolean; qmsType: string | null;
    isAccredited: boolean; accreditationScope: string | null; accreditationBody: string | null; consultancyDetails: string | null;
    hasDomesticExperience: boolean; hasExportExperience: boolean;
    hasLaboratory: boolean; hasLabAccreditation: boolean;
    labAccreditationType: string | null; labAccreditationScope: string | null; labConsultancyDetails: string | null;
    hasOtherActivities: boolean;    otherActivitiesDetails: string | null;
    hasLinkedOrganization: boolean; linkedOrgDetails: string | null;
    hasRelatedActivities: boolean;  relatedActivitiesDetails: string | null;
    hasDisputesWithClients: boolean; disputesDetails: string | null;
    hasCriminalProceedings: boolean; criminalProceedingsDetails: string | null;
    ports: Array<{ id: string; isDefault: boolean; port: PIAPortMaster }>;
    scopes: Array<{ id: string; specifications: string | null; mineralOre: PIAMineralMaster }>;
    inspectionManpower: Array<{ id: string; isSeniorMgmt: boolean; name: string; designation: string; qualification: string | null; experienceYears: number | null; specialization: string | null }>;
    labManpower: Array<{ id: string; isSeniorMgmt: boolean; name: string; designation: string; qualification: string | null; experienceYears: number | null }>;
    labEquipment: Array<{ id: string; name: string; make: string | null; model: string | null; serialNo: string | null; rangeCapacity: string | null; calibrationDueDate: string | null }>;
    labProducts: Array<{ id: string; productName: string; testParameters: string | null; testMethods: string | null }>;
    updatedAt: string;
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
  savePartII: async (id: string, payload: PIAPartIIPayload) => {
    const { data } = await api.put(`/pia/applications/${id}/part-ii`, payload);
    return data.data as PIAApplicationFull;
  },
  getMasterPorts: async () => {
    const { data } = await api.get('/pia/masters/ports');
    return data.data as PIAPortMaster[];
  },
  getMasterMinerals: async () => {
    const { data } = await api.get('/pia/masters/minerals');
    return data.data as PIAMineralMaster[];
  },
};
