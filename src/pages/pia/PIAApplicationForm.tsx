import { useState, useEffect, useCallback, useRef } from 'react';
import {
  piaApi, PIABranchPayload, PIASubType, PIAApplicationFull,
  PIAPortMaster, PIAMineralMaster,
  ManpowerRow, LabManpowerRow, MineralScopeRow, LabEquipmentRow, LabProductRow,
} from '../../services/pia.service';

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'general',     label: 'General Information'      },
  { key: 'inspection',  label: 'Inspection Details'       },
  { key: 'laboratory',  label: 'Laboratory Capabilities'  },
  { key: 'manpower',    label: 'Manpower'                 },
  { key: 'additional',  label: 'Additional Information'   },
  { key: 'scope',       label: 'Scope'                    },
  { key: 'ports',       label: 'Ports / Crushing Sheds'   },
  { key: 'documents',   label: 'Documents'                },
  { key: 'declaration', label: 'Declaration'              },
  { key: 'fees',        label: 'Fee Summary'              },
] as const;

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const LEGAL_STATUS_OPTIONS = [
  { value: 'PROPRIETORSHIP',  label: 'Proprietorship' },
  { value: 'PARTNERSHIP',     label: 'Partnership Firm' },
  { value: 'LLP',             label: 'Limited Liability Partnership (LLP)' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited Company' },
  { value: 'PUBLIC_LIMITED',  label: 'Public Limited Company' },
  { value: 'TRUST',           label: 'Trust' },
  { value: 'SOCIETY',         label: 'Society / Association' },
  { value: 'OTHER',           label: 'Other' },
];

const QMS_OPTIONS = [
  { value: 'ISO_17020', label: 'ISO/IEC 17020 (Inspection Bodies)' },
  { value: 'ISO_9001',  label: 'ISO 9001 (Quality Management)' },
  { value: 'BOTH',      label: 'Both ISO 17020 & ISO 9001' },
];

const LAB_ACCREDITATION_OPTIONS = [
  { value: 'NABL_ISO17025', label: 'NABL — ISO/IEC 17025' },
  { value: 'NABL_ISO17020', label: 'NABL — ISO/IEC 17020' },
  { value: 'BIS',           label: 'BIS Certified' },
  { value: 'OTHER',         label: 'Other' },
];

const EMPTY_BRANCH: PIABranchPayload = {
  branchName: '', address: '', state: '', district: '', city: '',
  pincode: '', phone: '', fax: '', email: '', headOfBranchName: '', headOfBranchDesignation: '',
};
const EMPTY_MANPOWER:    ManpowerRow     = { isSeniorMgmt: false, name: '', designation: '', qualification: '', experienceYears: '', specialization: '' };
const EMPTY_LAB_MP:      LabManpowerRow  = { isSeniorMgmt: false, name: '', designation: '', qualification: '', experienceYears: '' };
const EMPTY_EQUIPMENT:   LabEquipmentRow = { name: '', make: '', model: '', serialNo: '', rangeCapacity: '', calibrationDueDate: '' };
const EMPTY_LAB_PRODUCT: LabProductRow   = { productName: '', testParameters: '', testMethods: '' };

// ─── Combined form state ──────────────────────────────────────────────────────

interface CombinedFormState {
  subType: PIASubType;
  agencyName: string;
  // Part I
  agencyNameHindi: string;
  headOfficeAddress: string; headOfficeState: string; headOfficeDistrict: string;
  headOfficeCity: string; headOfficePincode: string; headOfficeCountry: string;
  headOfficePhone: string; headOfficeFax: string; headOfficeEmail: string;
  headOfOrgName: string; headOfOrgDesignation: string; headOfOrgContact: string;
  legalStatus: string; legalStatusDetails: string;
  inspectionDivHeadName: string; inspectionDivHeadDesignation: string;
  inspectionDivPhone: string; inspectionDivFax: string; inspectionDivEmail: string;
  labDivHeadName: string; labDivHeadDesignation: string;
  labDivPhone: string; labDivFax: string; labDivEmail: string;
  recognitionValidityDate: string | null; recognitionPeriod: number | null; existingRecognitionNo: string;
  hasCriminalProceedings: boolean; criminalProceedingsDetails: string;
  mineralScopes: MineralScopeRow[];
  branches: PIABranchPayload[];
  // Part II
  seniorMgmtCount: string; inspectingStaffCount: string;
  qmsImplemented: boolean; qmsType: string;
  isAccredited: boolean; accreditationScope: string; accreditationBody: string; consultancyDetails: string;
  hasDomesticExperience: boolean; hasExportExperience: boolean;
  hasLaboratory: boolean; hasLabAccreditation: boolean;
  labAccreditationType: string; labAccreditationScope: string; labConsultancyDetails: string;
  hasOtherActivities: boolean;    otherActivitiesDetails: string;
  hasLinkedOrganization: boolean; linkedOrgDetails: string;
  hasRelatedActivities: boolean;  relatedActivitiesDetails: string;
  hasDisputesWithClients: boolean; disputesDetails: string;
  selectedPortIds: string[];
  manpower: ManpowerRow[];
  labManpower: LabManpowerRow[];
  labEquipment: LabEquipmentRow[];
  labProducts: LabProductRow[];
}

const EMPTY: CombinedFormState = {
  subType: 'NEW_RECOGNITION', agencyName: '', agencyNameHindi: '',
  headOfficeAddress: '', headOfficeState: '', headOfficeDistrict: '',
  headOfficeCity: '', headOfficePincode: '', headOfficeCountry: 'India',
  headOfficePhone: '', headOfficeFax: '', headOfficeEmail: '',
  headOfOrgName: '', headOfOrgDesignation: '', headOfOrgContact: '',
  legalStatus: '', legalStatusDetails: '',
  inspectionDivHeadName: '', inspectionDivHeadDesignation: '',
  inspectionDivPhone: '', inspectionDivFax: '', inspectionDivEmail: '',
  labDivHeadName: '', labDivHeadDesignation: '',
  labDivPhone: '', labDivFax: '', labDivEmail: '',
  recognitionValidityDate: null, recognitionPeriod: null, existingRecognitionNo: '',
  hasCriminalProceedings: false, criminalProceedingsDetails: '',
  mineralScopes: [], branches: [],
  seniorMgmtCount: '', inspectingStaffCount: '',
  qmsImplemented: false, qmsType: '',
  isAccredited: false, accreditationScope: '', accreditationBody: '', consultancyDetails: '',
  hasDomesticExperience: false, hasExportExperience: false,
  hasLaboratory: false, hasLabAccreditation: false,
  labAccreditationType: '', labAccreditationScope: '', labConsultancyDetails: '',
  hasOtherActivities: false,    otherActivitiesDetails: '',
  hasLinkedOrganization: false, linkedOrgDetails: '',
  hasRelatedActivities: false,  relatedActivitiesDetails: '',
  hasDisputesWithClients: false, disputesDetails: '',
  selectedPortIds: [], manpower: [], labManpower: [], labEquipment: [], labProducts: [],
};

function formFromApp(app: PIAApplicationFull): CombinedFormState {
  const p = app.piaApplication!;
  return {
    subType: p.subType, agencyName: app.organisation,
    agencyNameHindi: p.agencyNameHindi ?? '',
    headOfficeAddress: p.headOfficeAddress ?? '', headOfficeState: p.headOfficeState ?? '',
    headOfficeDistrict: p.headOfficeDistrict ?? '', headOfficeCity: p.headOfficeCity ?? '',
    headOfficePincode: p.headOfficePincode ?? '', headOfficeCountry: p.headOfficeCountry ?? 'India',
    headOfficePhone: p.headOfficePhone ?? '', headOfficeFax: p.headOfficeFax ?? '',
    headOfficeEmail: p.headOfficeEmail ?? '',
    headOfOrgName: p.headOfOrgName ?? '', headOfOrgDesignation: p.headOfOrgDesignation ?? '',
    headOfOrgContact: p.headOfOrgContact ?? '',
    legalStatus: p.legalStatus ?? '', legalStatusDetails: p.legalStatusDetails ?? '',
    inspectionDivHeadName: p.inspectionDivHeadName ?? '',
    inspectionDivHeadDesignation: p.inspectionDivHeadDesignation ?? '',
    inspectionDivPhone: p.inspectionDivPhone ?? '', inspectionDivFax: p.inspectionDivFax ?? '',
    inspectionDivEmail: p.inspectionDivEmail ?? '',
    labDivHeadName: p.labDivHeadName ?? '', labDivHeadDesignation: p.labDivHeadDesignation ?? '',
    labDivPhone: p.labDivPhone ?? '', labDivFax: p.labDivFax ?? '', labDivEmail: p.labDivEmail ?? '',
    recognitionValidityDate: p.recognitionValidityDate ? p.recognitionValidityDate.split('T')[0] : null,
    recognitionPeriod: p.recognitionPeriod ?? null,
    existingRecognitionNo: p.existingRecognitionNo ?? '',
    hasCriminalProceedings: p.hasCriminalProceedings ?? false,
    criminalProceedingsDetails: p.criminalProceedingsDetails ?? '',
    mineralScopes: p.scopes?.map(s => ({ mineralOreId: s.mineralOre.id, specifications: s.specifications ?? '' })) ?? [],
    branches: p.branches?.map(b => ({
      branchName: b.branchName, address: b.address ?? '', state: b.state ?? '',
      district: b.district ?? '', city: b.city ?? '', pincode: b.pincode ?? '',
      phone: b.phone ?? '', fax: b.fax ?? '', email: b.email ?? '',
      headOfBranchName: b.headOfBranchName ?? '', headOfBranchDesignation: b.headOfBranchDesignation ?? '',
    })) ?? [],
    seniorMgmtCount: p.seniorMgmtCount != null ? String(p.seniorMgmtCount) : '',
    inspectingStaffCount: p.inspectingStaffCount != null ? String(p.inspectingStaffCount) : '',
    qmsImplemented: p.qmsImplemented, qmsType: p.qmsType ?? '',
    isAccredited: p.isAccredited, accreditationScope: p.accreditationScope ?? '',
    accreditationBody: p.accreditationBody ?? '', consultancyDetails: p.consultancyDetails ?? '',
    hasDomesticExperience: p.hasDomesticExperience, hasExportExperience: p.hasExportExperience,
    hasLaboratory: p.hasLaboratory, hasLabAccreditation: p.hasLabAccreditation,
    labAccreditationType: p.labAccreditationType ?? '', labAccreditationScope: p.labAccreditationScope ?? '',
    labConsultancyDetails: p.labConsultancyDetails ?? '',
    hasOtherActivities: p.hasOtherActivities, otherActivitiesDetails: p.otherActivitiesDetails ?? '',
    hasLinkedOrganization: p.hasLinkedOrganization, linkedOrgDetails: p.linkedOrgDetails ?? '',
    hasRelatedActivities: p.hasRelatedActivities, relatedActivitiesDetails: p.relatedActivitiesDetails ?? '',
    hasDisputesWithClients: p.hasDisputesWithClients, disputesDetails: p.disputesDetails ?? '',
    selectedPortIds: p.ports?.map(pp => pp.port.id) ?? [],
    manpower: p.inspectionManpower?.map(m => ({
      isSeniorMgmt: m.isSeniorMgmt, name: m.name, designation: m.designation,
      qualification: m.qualification ?? '',
      experienceYears: m.experienceYears != null ? String(m.experienceYears) : '',
      specialization: m.specialization ?? '',
    })) ?? [],
    labManpower: p.labManpower?.map(m => ({
      isSeniorMgmt: m.isSeniorMgmt, name: m.name, designation: m.designation,
      qualification: m.qualification ?? '',
      experienceYears: m.experienceYears != null ? String(m.experienceYears) : '',
    })) ?? [],
    labEquipment: p.labEquipment?.map(e => ({
      name: e.name, make: e.make ?? '', model: e.model ?? '',
      serialNo: e.serialNo ?? '', rangeCapacity: e.rangeCapacity ?? '',
      calibrationDueDate: e.calibrationDueDate ?? '',
    })) ?? [],
    labProducts: p.labProducts?.map(lp => ({
      productName: lp.productName, testParameters: lp.testParameters ?? '',
      testMethods: lp.testMethods ?? '',
    })) ?? [],
  };
}

// ─── UI primitives ────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  padding: '8px 11px', borderRadius: '6px', border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px' }}>{children}</div>;
}

function TI({ value, onChange, placeholder, type = 'text', disabled, readOnly }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; readOnly?: boolean }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} readOnly={readOnly} style={{ ...inp, opacity: disabled ? 0.5 : 1, backgroundColor: readOnly ? 'var(--bg-page)' : undefined, cursor: readOnly ? 'default' : undefined }} />;
}
function TA({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />;
}
function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {([true, false] as const).map(opt => (
        <button key={String(opt)} type="button" onClick={() => onChange(opt)} style={{
          padding: '6px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${value === opt ? '#8B5CF6' : 'var(--border-subtle)'}`,
          backgroundColor: value === opt ? 'rgba(139,92,246,0.12)' : 'transparent',
          color: value === opt ? '#8B5CF6' : 'var(--text-muted)',
        }}>{opt ? 'Yes' : 'No'}</button>
      ))}
    </div>
  );
}
function SecHead({ num, title, subtitle }: { num: string; title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
      <div style={{ width: 28, height: 28, borderRadius: '7px', flexShrink: 0, backgroundColor: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>{num}</div>
      <div>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
function InfoBadge({ text, color = '#EA580C', bg = '#FFF7ED', border = '#FED7AA' }: { text: string; color?: string; bg?: string; border?: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '5px 10px', borderRadius: '6px', backgroundColor: bg, border: `1px solid ${border}` }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span style={{ fontSize: '11px', fontWeight: 600, color }}>{text}</span>
    </div>
  );
}
function DecRow({ label, value, onChange, children }: { label: string; value: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
        <Toggle value={value} onChange={onChange} />
      </div>
      {value && children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  applicationId: string;
  onBack: () => void;
  onSaved?: (app: PIAApplicationFull) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PIAApplicationForm({ applicationId, onBack, onSaved }: Props) {
  const [form, setForm]         = useState<CombinedFormState>(EMPTY);
  const [appNo, setAppNo]       = useState('');
  const [step, setStep]         = useState(0);
  const [ports, setPorts]       = useState<PIAPortMaster[]>([]);
  const [minerals, setMinerals] = useState<PIAMineralMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isDirty, setIsDirty]     = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      piaApi.getById(applicationId),
      piaApi.getMasterPorts(),
      piaApi.getMasterMinerals(),
    ]).then(([app, pts, mins]) => {
      setForm(formFromApp(app));
      setAppNo(app.appNo);
      setPorts(pts.filter(p => p.isActive));
      setMinerals(mins.filter(m => m.isActive));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [applicationId]);

  useEffect(() => {
    if (!isDirty || isLoading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave(false), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, isDirty, isLoading]);

  // Auto-transliterate English agency name → Hindi using Google Input Tools
  useEffect(() => {
    const name = form.agencyName.trim();
    if (!name) { setForm(prev => ({ ...prev, agencyNameHindi: '' })); return; }
    const timer = setTimeout(async () => {
      try {
        const words = name.split(/\s+/);
        const results = await Promise.all(words.map(async word => {
          const res = await fetch(
            `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`
          );
          const json = await res.json();
          return (json[0] === 'SUCCESS' && json[1]?.[0]?.[1]?.[0]) ? json[1][0][1][0] : word;
        }));
        setForm(prev => ({ ...prev, agencyNameHindi: results.join(' ') }));
      } catch { /* network unavailable — leave field as-is */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.agencyName]);

  const set = useCallback(<K extends keyof CombinedFormState>(key: K, value: CombinedFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true); setSaveError('');
  }, []);

  const doSave = useCallback(async (feedback = true) => {
    if (isSaving) return;
    setIsSaving(true); setSaveError('');
    try {
      await Promise.all([
        piaApi.savePartI(applicationId, {
          agencyName: form.agencyName, agencyNameHindi: form.agencyNameHindi,
          headOfficeAddress: form.headOfficeAddress, headOfficeState: form.headOfficeState,
          headOfficeDistrict: form.headOfficeDistrict, headOfficeCity: form.headOfficeCity,
          headOfficePincode: form.headOfficePincode, headOfficeCountry: form.headOfficeCountry,
          headOfficePhone: form.headOfficePhone, headOfficeFax: form.headOfficeFax,
          headOfficeEmail: form.headOfficeEmail,
          headOfOrgName: form.headOfOrgName, headOfOrgDesignation: form.headOfOrgDesignation,
          headOfOrgContact: form.headOfOrgContact,
          legalStatus: form.legalStatus, legalStatusDetails: form.legalStatusDetails,
          inspectionDivHeadName: form.inspectionDivHeadName,
          inspectionDivHeadDesignation: form.inspectionDivHeadDesignation,
          inspectionDivPhone: form.inspectionDivPhone, inspectionDivFax: form.inspectionDivFax,
          inspectionDivEmail: form.inspectionDivEmail,
          labDivHeadName: form.labDivHeadName, labDivHeadDesignation: form.labDivHeadDesignation,
          labDivPhone: form.labDivPhone, labDivFax: form.labDivFax, labDivEmail: form.labDivEmail,
          recognitionValidityDate: form.recognitionValidityDate,
          recognitionPeriod: form.recognitionPeriod,
          existingRecognitionNo: form.existingRecognitionNo,
          hasCriminalProceedings: form.hasCriminalProceedings,
          criminalProceedingsDetails: form.criminalProceedingsDetails,
          mineralScopes: form.mineralScopes, branches: form.branches,
        }),
        piaApi.savePartII(applicationId, {
          seniorMgmtCount: form.seniorMgmtCount ? parseInt(form.seniorMgmtCount) : null,
          inspectingStaffCount: form.inspectingStaffCount ? parseInt(form.inspectingStaffCount) : null,
          qmsImplemented: form.qmsImplemented, qmsType: form.qmsType || undefined,
          isAccredited: form.isAccredited, accreditationScope: form.accreditationScope,
          accreditationBody: form.accreditationBody, consultancyDetails: form.consultancyDetails,
          hasDomesticExperience: form.hasDomesticExperience, hasExportExperience: form.hasExportExperience,
          hasLaboratory: form.hasLaboratory, hasLabAccreditation: form.hasLabAccreditation,
          labAccreditationType: form.labAccreditationType, labAccreditationScope: form.labAccreditationScope,
          labConsultancyDetails: form.labConsultancyDetails,
          hasOtherActivities: form.hasOtherActivities, otherActivitiesDetails: form.otherActivitiesDetails,
          hasLinkedOrganization: form.hasLinkedOrganization, linkedOrgDetails: form.linkedOrgDetails,
          hasRelatedActivities: form.hasRelatedActivities, relatedActivitiesDetails: form.relatedActivitiesDetails,
          hasDisputesWithClients: form.hasDisputesWithClients, disputesDetails: form.disputesDetails,
          hasCriminalProceedings: form.hasCriminalProceedings,
          criminalProceedingsDetails: form.criminalProceedingsDetails,
          portIds: form.selectedPortIds, mineralScopes: form.mineralScopes,
          manpower: form.manpower, labManpower: form.labManpower,
          labEquipment: form.labEquipment, labProducts: form.labProducts,
        }),
      ]);
      setIsDirty(false); setLastSaved(new Date());
      if (feedback) {
        const saved = await piaApi.getById(applicationId);
        onSaved?.(saved as any);
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Save failed. Please try again.');
    } finally { setIsSaving(false); }
  }, [applicationId, form, isSaving]);

  // ── Branch helpers ──
  const updBranch = (idx: number, key: keyof PIABranchPayload, val: string) =>
    set('branches', (form.branches ?? []).map((b, i) => i === idx ? { ...b, [key]: val } : b));

  // ── Mineral helpers ──
  const toggleMineral = useCallback((id: string) => {
    set('mineralScopes', form.mineralScopes.some(s => s.mineralOreId === id)
      ? form.mineralScopes.filter(s => s.mineralOreId !== id)
      : [...form.mineralScopes, { mineralOreId: id, specifications: '' }]);
  }, [form.mineralScopes, set]);
  const updMineralSpec = useCallback((id: string, spec: string) => {
    set('mineralScopes', form.mineralScopes.map(s => s.mineralOreId === id ? { ...s, specifications: spec } : s));
  }, [form.mineralScopes, set]);

  // ── Port helpers ──
  const togglePort = (id: string) =>
    set('selectedPortIds', form.selectedPortIds.includes(id)
      ? form.selectedPortIds.filter(p => p !== id)
      : [...form.selectedPortIds, id]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading application…</span>
    </div>
  );

  const subTypeLabel = form.subType === 'NEW_RECOGNITION' ? 'New Recognition' : form.subType === 'RENEWAL' ? 'Renewal' : 'Modification / Extension of Scope';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: '8px 8px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', padding: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{subTypeLabel}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>{appNo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '11px', color: saveError ? '#EF4444' : 'var(--text-muted)' }}>
            {saveError || (isSaving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : isDirty ? 'Unsaved changes' : '')}
          </span>
          <button onClick={() => doSave(true)} disabled={isSaving || (!isDirty && !saveError)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '7px',
            backgroundColor: isDirty ? 'rgba(139,92,246,0.15)' : 'transparent',
            border: `1px solid ${isDirty ? '#8B5CF6' : 'var(--border-subtle)'}`,
            color: isDirty ? '#8B5CF6' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600,
            cursor: isSaving ? 'wait' : 'pointer', opacity: (!isDirty && !saveError) ? 0.5 : 1,
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Save Draft
          </button>
        </div>
      </div>

      {/* ── Step indicator — 2 × 5 grid ── */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 20px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Progress</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  height: 4, borderRadius: 2,
                  width: i === step ? 20 : 8,
                  backgroundColor: i < step ? '#10B981' : i === step ? '#8B5CF6' : 'var(--border-subtle)',
                  transition: 'all 0.25s ease',
                }} />
              ))}
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8B5CF6' }}>
            {step + 1} / {STEPS.length} &nbsp;·&nbsp; <span style={{ fontWeight: 700 }}>{STEPS[step].label}</span>
          </span>
        </div>
        {/* Step grid on tinted tray */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px',
          backgroundColor: 'var(--bg-page)', borderRadius: '10px', padding: '6px',
        }}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone   = i < step;
            return (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 11px', borderRadius: '7px', cursor: 'pointer', border: 'none',
                  backgroundColor: isActive ? '#8B5CF6' : isDone ? '#F0FDF4' : 'var(--bg-card)',
                  boxShadow: isActive
                    ? '0 3px 10px rgba(139,92,246,0.4)'
                    : isDone ? 'none'
                    : '0 1px 3px rgba(0,0,0,0.07), inset 0 0 0 1px var(--border-subtle)',
                  transition: 'all 0.15s',
                  textAlign: 'left', overflow: 'hidden',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '6px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 800,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : isDone ? '#10B981' : '#f1f5f9',
                  color: isActive ? '#fff' : isDone ? '#fff' : '#64748b',
                }}>
                  {isDone
                    ? <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    : i + 1}
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : isDone ? 600 : 500,
                  color: isActive ? '#fff' : isDone ? '#15803D' : '#475569',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
                }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step content ── */}
      <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ═══ STEP 1: General Information ═══ */}
        {step === 0 && <>
          <div>
            <SecHead num="1" title="Name of the Applicant / Inspection Agency" subtitle="As registered — English and Hindi" />
            <Grid>
              <Field label="Name (English)" required>
                <TI
                  value={form.agencyName}
                  onChange={v => set('agencyName', v)}
                  placeholder="Full registered name"
                />
              </Field>
              <Field label="Name (Hindi)" hint="Auto-transliterated from English">
                <TI
                  value={form.agencyNameHindi}
                  onChange={() => {}}
                  placeholder="एजेंसी का नाम हिंदी में"
                  readOnly
                />
              </Field>
            </Grid>
          </div>
          <div>
            <SecHead num="1.1" title="Head Office Address" subtitle="Full address with state, district, city, PIN, country" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Address of Head Office" required>
                <TA value={form.headOfficeAddress} onChange={v => set('headOfficeAddress', v)} placeholder="Building no., street, locality…" rows={3} />
                <InfoBadge text="Address proof upload required" />
              </Field>
              <Grid cols={3}>
                <Field label="State / UT" required>
                  <Sel value={form.headOfficeState} onChange={v => set('headOfficeState', v)} options={INDIAN_STATES.map(s => ({ value: s, label: s }))} placeholder="— Select State —" />
                </Field>
                <Field label="District"><TI value={form.headOfficeDistrict} onChange={v => set('headOfficeDistrict', v)} placeholder="District" /></Field>
                <Field label="City / Town" required><TI value={form.headOfficeCity} onChange={v => set('headOfficeCity', v)} placeholder="City" /></Field>
              </Grid>
              <Grid cols={3}>
                <Field label="PIN Code" required><TI value={form.headOfficePincode} onChange={v => set('headOfficePincode', v)} placeholder="6-digit PIN" /></Field>
                <Field label="Country"><TI value={form.headOfficeCountry} onChange={v => set('headOfficeCountry', v)} placeholder="India" /></Field>
              </Grid>
            </div>
          </div>
          <div>
            <SecHead num="1.2" title="Phone No. / Fax / E-mail" />
            <Grid cols={3}>
              <Field label="Phone No. / Mobile" required><TI value={form.headOfficePhone} onChange={v => set('headOfficePhone', v)} placeholder="+91 XXXXX XXXXX" /></Field>
              <Field label="Fax"><TI value={form.headOfficeFax} onChange={v => set('headOfficeFax', v)} placeholder="Fax number" /></Field>
              <Field label="E-mail" required><TI value={form.headOfficeEmail} onChange={v => set('headOfficeEmail', v)} placeholder="office@agency.com" /></Field>
            </Grid>
            <InfoBadge text="Email / mobile validation required" />
          </div>
          <div>
            <SecHead num="1.3" title="Name of Head of Organization and Designation" />
            <Grid cols={3}>
              <Field label="Name" required><TI value={form.headOfOrgName} onChange={v => set('headOfOrgName', v)} placeholder="Full name" /></Field>
              <Field label="Designation" required><TI value={form.headOfOrgDesignation} onChange={v => set('headOfOrgDesignation', v)} placeholder="e.g. Managing Director" /></Field>
              <Field label="Contact Details" required><TI value={form.headOfOrgContact} onChange={v => set('headOfOrgContact', v)} placeholder="+91 XXXXX XXXXX" /></Field>
            </Grid>
          </div>
          <div>
            <SecHead num="2" title="Address and Location for which Recognition is Sought" subtitle="Multiple branch / recognition locations supported" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(form.branches ?? []).length === 0 && (
                <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No branch offices added. Click "Add Branch Office" below if applicable.
                </div>
              )}
              {(form.branches ?? []).map((b, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Branch {idx + 1}</span>
                    <button type="button" onClick={() => set('branches', form.branches.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove
                    </button>
                  </div>
                  <Field label="Address"><TA value={b.address} onChange={v => updBranch(idx, 'address', v)} rows={2} /></Field>
                  <Grid cols={4}>
                    <Field label="State / UT"><Sel value={b.state} onChange={v => updBranch(idx, 'state', v)} options={INDIAN_STATES.map(s => ({ value: s, label: s }))} placeholder="— State —" /></Field>
                    <Field label="District"><TI value={b.district} onChange={v => updBranch(idx, 'district', v)} placeholder="District" /></Field>
                    <Field label="City"><TI value={b.city} onChange={v => updBranch(idx, 'city', v)} placeholder="City" /></Field>
                    <Field label="PIN"><TI value={b.pincode} onChange={v => updBranch(idx, 'pincode', v)} placeholder="PIN" /></Field>
                  </Grid>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6', display: 'block', marginBottom: '10px' }}>2.1 — Name of Head of Branch</span>
                    <Grid>
                      <Field label="Name"><TI value={b.headOfBranchName} onChange={v => updBranch(idx, 'headOfBranchName', v)} placeholder="Full name" /></Field>
                      <Field label="Designation"><TI value={b.headOfBranchDesignation} onChange={v => updBranch(idx, 'headOfBranchDesignation', v)} placeholder="Designation" /></Field>
                    </Grid>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6', display: 'block', marginBottom: '10px' }}>2.2 — Branch Phone No. / Fax / E-mail</span>
                    <Grid cols={3}>
                      <Field label="Phone"><TI value={b.phone} onChange={v => updBranch(idx, 'phone', v)} placeholder="+91 XXXXX XXXXX" /></Field>
                      <Field label="Fax"><TI value={b.fax} onChange={v => updBranch(idx, 'fax', v)} placeholder="Fax" /></Field>
                      <Field label="E-mail"><TI value={b.email} onChange={v => updBranch(idx, 'email', v)} placeholder="branch@agency.com" /></Field>
                    </Grid>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => set('branches', [...(form.branches ?? []), { ...EMPTY_BRANCH }])} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '7px',
                border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)',
                color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Branch Office
              </button>
            </div>
          </div>
          <div>
            <SecHead num="3" title="Name of Head of Inspection Division and Designation" />
            <Grid>
              <Field label="Name"><TI value={form.inspectionDivHeadName} onChange={v => set('inspectionDivHeadName', v)} placeholder="Full name" /></Field>
              <Field label="Designation"><TI value={form.inspectionDivHeadDesignation} onChange={v => set('inspectionDivHeadDesignation', v)} placeholder="Designation" /></Field>
            </Grid>
          </div>
          <div>
            <SecHead num="3.1" title="Inspection Division Phone No. / Fax / E-mail" />
            <Grid cols={3}>
              <Field label="Phone No. / Mobile"><TI value={form.inspectionDivPhone} onChange={v => set('inspectionDivPhone', v)} placeholder="+91 XXXXX XXXXX" /></Field>
              <Field label="Fax"><TI value={form.inspectionDivFax} onChange={v => set('inspectionDivFax', v)} placeholder="Fax number" /></Field>
              <Field label="E-mail"><TI value={form.inspectionDivEmail} onChange={v => set('inspectionDivEmail', v)} placeholder="inspection@agency.com" /></Field>
            </Grid>
          </div>
          <div>
            <SecHead num="4" title="Name of Head of Laboratory Division and Designation" />
            <Grid>
              <Field label="Name"><TI value={form.labDivHeadName} onChange={v => set('labDivHeadName', v)} placeholder="Full name" /></Field>
              <Field label="Designation"><TI value={form.labDivHeadDesignation} onChange={v => set('labDivHeadDesignation', v)} placeholder="Designation" /></Field>
            </Grid>
          </div>
          <div>
            <SecHead num="4.1" title="Laboratory Division Phone No. / Fax / E-mail" />
            <Grid cols={3}>
              <Field label="Phone No. / Mobile"><TI value={form.labDivPhone} onChange={v => set('labDivPhone', v)} placeholder="+91 XXXXX XXXXX" /></Field>
              <Field label="Fax"><TI value={form.labDivFax} onChange={v => set('labDivFax', v)} placeholder="Fax number" /></Field>
              <Field label="E-mail"><TI value={form.labDivEmail} onChange={v => set('labDivEmail', v)} placeholder="lab@agency.com" /></Field>
            </Grid>
          </div>
          <div>
            <SecHead num="5" title="Legal Status" subtitle="Documentary evidence required — CoI, MOA, etc." />
            <Grid>
              <Field label="Legal Status / Constitution" required>
                <Sel value={form.legalStatus} onChange={v => set('legalStatus', v)} options={LEGAL_STATUS_OPTIONS} placeholder="— Select Legal Status —" />
              </Field>
              {form.legalStatus === 'OTHER' && (
                <Field label="Specify Details" required>
                  <TI value={form.legalStatusDetails} onChange={v => set('legalStatusDetails', v)} placeholder="Describe legal constitution" />
                </Field>
              )}
            </Grid>
          </div>
          <div>
            <SecHead num="7 / 8" title="Recognition Details" subtitle="Validity date and period for which recognition is sought" />
            <Grid cols={2}>
              {(form.subType === 'RENEWAL' || form.subType === 'MODIFICATION') && <>
                <Field label="Date of Validity of Recognition">
                  <input type="date" value={form.recognitionValidityDate ?? ''} onChange={e => set('recognitionValidityDate', e.target.value || null)} style={inp} />
                </Field>
                <Field label="Existing Recognition No.">
                  <TI value={form.existingRecognitionNo} onChange={v => set('existingRecognitionNo', v)} placeholder="e.g. EIC/PIA/2020/001" />
                </Field>
              </>}
              <Field label="Period for which Recognition is Sought" hint="Maximum 3 years">
                <Sel value={form.recognitionPeriod != null ? String(form.recognitionPeriod) : ''} onChange={v => set('recognitionPeriod', v ? Number(v) : null)}
                  options={[{ value: '1', label: '1 Year' }, { value: '2', label: '2 Years' }, { value: '3', label: '3 Years (Maximum)' }]}
                  placeholder="— Select Period —" />
              </Field>
            </Grid>
          </div>
        </>}

        {/* ═══ STEP 2: Inspection Details ═══ */}
        {step === 1 && <>
          <div>
            <SecHead num="10" title="Number of Personnel in Inspection Division" />
            <Grid>
              <Field label="Senior Management Count" hint="Number of senior management personnel">
                <TI value={form.seniorMgmtCount} onChange={v => set('seniorMgmtCount', v)} type="number" placeholder="e.g. 2" />
              </Field>
              <Field label="Total Inspecting Staff Count" hint="All inspection personnel">
                <TI value={form.inspectingStaffCount} onChange={v => set('inspectingStaffCount', v)} type="number" placeholder="e.g. 10" />
              </Field>
            </Grid>
          </div>
          <div>
            <SecHead num="11" title="Implemented Quality Management System (QMS)" subtitle="ISO/IEC 17020 and quality certifications" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Has the agency implemented a QMS?"><Toggle value={form.qmsImplemented} onChange={v => set('qmsImplemented', v)} /></Field>
              {form.qmsImplemented && (
                <Field label="Type of QMS Certification">
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {QMS_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => set('qmsType', opt.value)} style={{
                        padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${form.qmsType === opt.value ? '#8B5CF6' : 'var(--border-subtle)'}`,
                        backgroundColor: form.qmsType === opt.value ? 'rgba(139,92,246,0.12)' : 'transparent',
                        color: form.qmsType === opt.value ? '#8B5CF6' : 'var(--text-secondary)',
                      }}>{opt.label}</button>
                    ))}
                  </div>
                </Field>
              )}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>11.1 — Accreditation Status (ISO/IEC 17020)</p>
                <Field label="Is the agency accredited (ISO/IEC 17020)?"><Toggle value={form.isAccredited} onChange={v => set('isAccredited', v)} /></Field>
                {form.isAccredited && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>11.2 — Scope of Accreditation</p>
                    <Grid>
                      <Field label="Accreditation Body"><TI value={form.accreditationBody} onChange={v => set('accreditationBody', v)} placeholder="e.g. NABL" /></Field>
                      <Field label="Scope of Accreditation"><TI value={form.accreditationScope} onChange={v => set('accreditationScope', v)} placeholder="Commodity scope" /></Field>
                    </Grid>
                  </div>
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>11.3 — Consultancy / Advisory Details</p>
                <Field label="Consultancy / Advisory involvement" hint="Leave blank if none">
                  <TA value={form.consultancyDetails} onChange={v => set('consultancyDetails', v)} placeholder="Describe any consultancy involvement" rows={2} />
                </Field>
              </div>
            </div>
          </div>
          <div>
            <SecHead num="12" title="Previous Experience in Inspection" />
            <Grid>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>12.1 — Domestic Inspection</p>
                <Field label="Has the agency carried out domestic inspections?"><Toggle value={form.hasDomesticExperience} onChange={v => set('hasDomesticExperience', v)} /></Field>
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>12.2 — Export Inspection</p>
                <Field label="Has the agency carried out export inspections?"><Toggle value={form.hasExportExperience} onChange={v => set('hasExportExperience', v)} /></Field>
              </div>
            </Grid>
          </div>
        </>}

        {/* ═══ STEP 3: Laboratory Capabilities ═══ */}
        {step === 2 && <>
          <div>
            <SecHead num="9.1" title="In-House Laboratory" subtitle="Testing facilities, accreditation, equipment list (Annexure-3) and products tested" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Field label="Does the agency have an in-house laboratory?"><Toggle value={form.hasLaboratory} onChange={v => set('hasLaboratory', v)} /></Field>
              {form.hasLaboratory && <>
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#8B5CF6' }}>9.1.1 — Lab Accreditation (NABL / ISO 17025)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Field label="Is the laboratory accredited (NABL / ISO 17025)?"><Toggle value={form.hasLabAccreditation} onChange={v => set('hasLabAccreditation', v)} /></Field>
                    {form.hasLabAccreditation && <>
                      <Field label="Accreditation Type">
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {LAB_ACCREDITATION_OPTIONS.map(opt => (
                            <button key={opt.value} type="button" onClick={() => set('labAccreditationType', opt.value)} style={{
                              padding: '7px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${form.labAccreditationType === opt.value ? '#8B5CF6' : 'var(--border-subtle)'}`,
                              backgroundColor: form.labAccreditationType === opt.value ? 'rgba(139,92,246,0.12)' : 'transparent',
                              color: form.labAccreditationType === opt.value ? '#8B5CF6' : 'var(--text-secondary)',
                            }}>{opt.label}</button>
                          ))}
                        </div>
                      </Field>
                      <Field label="Scope of Lab Accreditation">
                        <TI value={form.labAccreditationScope} onChange={v => set('labAccreditationScope', v)} placeholder="Parameters / commodities covered" />
                      </Field>
                    </>}
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#8B5CF6' }}>9.2 — Lab Consultancy / Advisory Details</p>
                  <Field label="Lab Consultancy / Advisory involvement" hint="Leave blank if none">
                    <TA value={form.labConsultancyDetails} onChange={v => set('labConsultancyDetails', v)} rows={2} placeholder="Describe or leave blank" />
                  </Field>
                </div>
                {/* 9.3 Products */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6', margin: 0 }}>9.3 — Products / Commodities Tested</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Products tested with parameters and test methods</p>
                    </div>
                    <button type="button" onClick={() => set('labProducts', [...form.labProducts, { ...EMPTY_LAB_PRODUCT }])} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Product
                    </button>
                  </div>
                  {form.labProducts.length === 0
                    ? <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No products added.</div>
                    : (
                      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 36px', backgroundColor: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {['Product / Commodity', 'Test Parameters', 'Test Methods / Standards', ''].map((h, i) => (
                            <div key={i} style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</div>
                          ))}
                        </div>
                        {form.labProducts.map((row, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 36px', borderBottom: idx < form.labProducts.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                            {(['productName','testParameters','testMethods'] as const).map(k => (
                              <div key={k} style={{ padding: '5px 8px' }}>
                                <input type="text" value={row[k]} onChange={e => set('labProducts', form.labProducts.map((r, i) => i === idx ? { ...r, [k]: e.target.value } : r))} style={{ ...inp, fontSize: '12px' }} />
                              </div>
                            ))}
                            <div style={{ padding: '5px 4px', display: 'flex', justifyContent: 'center' }}>
                              <button type="button" onClick={() => set('labProducts', form.labProducts.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                {/* 9.4 Equipment */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6', margin: 0 }}>9.4 — Equipment List (Annexure-3)</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>List all laboratory instruments and equipment</p>
                    </div>
                    <button type="button" onClick={() => set('labEquipment', [...form.labEquipment, { ...EMPTY_EQUIPMENT }])} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Equipment
                    </button>
                  </div>
                  {form.labEquipment.length === 0
                    ? <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No equipment added.</div>
                    : (
                      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.4fr 36px', backgroundColor: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {['Equipment', 'Make', 'Model', 'Serial No.', 'Range', 'Calib. Due', ''].map((h, i) => (
                            <div key={i} style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</div>
                          ))}
                        </div>
                        {form.labEquipment.map((row, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.4fr 36px', borderBottom: idx < form.labEquipment.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                            {(['name','make','model','serialNo','rangeCapacity','calibrationDueDate'] as const).map(k => (
                              <div key={k} style={{ padding: '5px 8px' }}>
                                <input type="text" value={row[k]} onChange={e => set('labEquipment', form.labEquipment.map((r, i) => i === idx ? { ...r, [k]: e.target.value } : r))} style={{ ...inp, fontSize: '12px' }} />
                              </div>
                            ))}
                            <div style={{ padding: '5px 4px', display: 'flex', justifyContent: 'center' }}>
                              <button type="button" onClick={() => set('labEquipment', form.labEquipment.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </>}
            </div>
          </div>
        </>}

        {/* ═══ STEP 4: Manpower ═══ */}
        {step === 3 && <>
          {/* 10.1.1 — Senior Management, Inspection Division */}
          <div>
            <SecHead num="10.1.1" title="Senior Management — Inspection Division" subtitle="Senior management personnel involved in inspection activities — Annexure-4" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {form.manpower.filter(m => m.isSeniorMgmt).length === 0 && (
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No senior management added.</div>
              )}
              {form.manpower.map((row, idx) => !row.isSeniorMgmt ? null : (
                <div key={idx} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Sr. Mgmt #{form.manpower.slice(0, idx + 1).filter(m => m.isSeniorMgmt).length}</span>
                    <button type="button" onClick={() => set('manpower', form.manpower.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px' }}>Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <Field label="Full Name" required><TI value={row.name} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, name: v } : r))} placeholder="Name" /></Field>
                    <Field label="Designation"><TI value={row.designation} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, designation: v } : r))} placeholder="e.g. General Manager" /></Field>
                    <Field label="Qualification"><TI value={row.qualification} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, qualification: v } : r))} placeholder="e.g. B.Sc." /></Field>
                    <Field label="Experience (years)"><TI value={row.experienceYears} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, experienceYears: v } : r))} type="number" placeholder="Years" /></Field>
                    <Field label="Specialization"><TI value={row.specialization} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, specialization: v } : r))} placeholder="Area of specialization" /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER, isSeniorMgmt: true }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Senior Management
              </button>
            </div>
          </div>
          {/* 10.1.2 — Technical Inspecting Staff */}
          <div>
            <SecHead num="10.1.2" title="Technical Inspecting Staff" subtitle="All inspection personnel — Annexure-4" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {form.manpower.filter(m => !m.isSeniorMgmt).length === 0 && (
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No inspecting staff added.</div>
              )}
              {form.manpower.map((row, idx) => row.isSeniorMgmt ? null : (
                <div key={idx} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Staff #{form.manpower.slice(0, idx + 1).filter(m => !m.isSeniorMgmt).length}</span>
                    <button type="button" onClick={() => set('manpower', form.manpower.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px' }}>Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <Field label="Full Name" required><TI value={row.name} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, name: v } : r))} placeholder="Name" /></Field>
                    <Field label="Designation"><TI value={row.designation} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, designation: v } : r))} placeholder="e.g. Inspector" /></Field>
                    <Field label="Qualification"><TI value={row.qualification} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, qualification: v } : r))} placeholder="e.g. B.Sc." /></Field>
                    <Field label="Experience (years)"><TI value={row.experienceYears} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, experienceYears: v } : r))} type="number" placeholder="Years" /></Field>
                    <Field label="Specialization"><TI value={row.specialization} onChange={v => set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, specialization: v } : r))} placeholder="Area of specialization" /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER, isSeniorMgmt: false }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Inspecting Staff
              </button>
            </div>
          </div>
          {form.hasLaboratory && (<>
            {/* 10.2.1 — Senior Management, Lab Division */}
            <div>
              <SecHead num="10.2.1" title="Senior Management — Testing / Laboratory Division" subtitle="Senior management personnel in the laboratory division" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.labManpower.filter(m => m.isSeniorMgmt).length === 0 && (
                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No senior management added.</div>
                )}
                {form.labManpower.map((row, idx) => !row.isSeniorMgmt ? null : (
                  <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Sr. Mgmt #{form.labManpower.slice(0, idx + 1).filter(m => m.isSeniorMgmt).length}</span>
                      <button type="button" onClick={() => set('labManpower', form.labManpower.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px' }}>Remove</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <Field label="Name"><TI value={row.name} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, name: v } : r))} placeholder="Name" /></Field>
                      <Field label="Designation"><TI value={row.designation} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, designation: v } : r))} placeholder="Designation" /></Field>
                      <Field label="Qualification"><TI value={row.qualification} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, qualification: v } : r))} placeholder="e.g. M.Sc." /></Field>
                      <Field label="Experience (yrs)"><TI value={row.experienceYears} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, experienceYears: v } : r))} type="number" placeholder="Years" /></Field>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('labManpower', [...form.labManpower, { ...EMPTY_LAB_MP, isSeniorMgmt: true }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Senior Management
                </button>
              </div>
            </div>
            {/* 10.2.2 — Technical Testing Staff */}
            <div>
              <SecHead num="10.2.2" title="Technical Testing / Laboratory Staff" subtitle="All testing and laboratory personnel" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.labManpower.filter(m => !m.isSeniorMgmt).length === 0 && (
                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No lab staff added.</div>
                )}
                {form.labManpower.map((row, idx) => row.isSeniorMgmt ? null : (
                  <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Lab Staff #{form.labManpower.slice(0, idx + 1).filter(m => !m.isSeniorMgmt).length}</span>
                      <button type="button" onClick={() => set('labManpower', form.labManpower.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px' }}>Remove</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <Field label="Name"><TI value={row.name} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, name: v } : r))} placeholder="Name" /></Field>
                      <Field label="Designation"><TI value={row.designation} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, designation: v } : r))} placeholder="Designation" /></Field>
                      <Field label="Qualification"><TI value={row.qualification} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, qualification: v } : r))} placeholder="e.g. M.Sc." /></Field>
                      <Field label="Experience (yrs)"><TI value={row.experienceYears} onChange={v => set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, experienceYears: v } : r))} type="number" placeholder="Years" /></Field>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('labManpower', [...form.labManpower, { ...EMPTY_LAB_MP, isSeniorMgmt: false }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Lab Staff
                </button>
              </div>
            </div>
          </>)}
        </>}

        {/* ═══ STEP 5: Additional Information ═══ */}
        {step === 4 && <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <SecHead num="11.1" title="Other Activities" subtitle="Does the agency carry out activities other than inspection (e.g. trading, manufacturing)?" />
              <DecRow label="Does the agency carry out activities other than inspection (e.g. trading, manufacturing)?" value={form.hasOtherActivities} onChange={v => set('hasOtherActivities', v)}>
                <TA value={form.otherActivitiesDetails} onChange={v => set('otherActivitiesDetails', v)} placeholder="Describe other activities…" rows={2} />
              </DecRow>
            </div>
            <div>
              <SecHead num="11.2" title="Linked Organization" subtitle="Is the agency linked to any other organization (financial, managerial or otherwise)?" />
              <DecRow label="Is the agency linked to any other organization (financial, managerial or otherwise)?" value={form.hasLinkedOrganization} onChange={v => set('hasLinkedOrganization', v)}>
                <TA value={form.linkedOrgDetails} onChange={v => set('linkedOrgDetails', v)} placeholder="Name and nature of linked organization…" rows={2} />
              </DecRow>
            </div>
            <div>
              <SecHead num="11.3" title="Related Activities / Conflict of Interest" subtitle="Activities that may affect impartiality in inspection" />
              <DecRow label="Does the agency have any related activities that may conflict with impartiality?" value={form.hasRelatedActivities} onChange={v => set('hasRelatedActivities', v)}>
                <TA value={form.relatedActivitiesDetails} onChange={v => set('relatedActivitiesDetails', v)} placeholder="Describe related activities…" rows={2} />
              </DecRow>
            </div>
            <div>
              <SecHead num="11.4" title="Disputes / Problems with Clients" subtitle="Disputes regarding inspection services in the last 10 years" />
              <DecRow label="Has the agency had any disputes with clients regarding inspection services?" value={form.hasDisputesWithClients} onChange={v => set('hasDisputesWithClients', v)}>
                <TA value={form.disputesDetails} onChange={v => set('disputesDetails', v)} placeholder="Nature and outcome of disputes…" rows={2} />
              </DecRow>
            </div>
          </div>
        </>}

        {/* ═══ STEP 6: Scope ═══ */}
        {step === 5 && <>
          <SecHead num="6" title="Scope for which Recognition is Sought" subtitle="Product / product group, minerals / ores, corresponding specifications / standards and Annexure-8 details" />
          {minerals.length === 0
            ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>No minerals configured. Contact admin.</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {minerals.map(mineral => {
                  const scope = form.mineralScopes.find(s => s.mineralOreId === mineral.id);
                  const selected = !!scope;
                  return (
                    <div key={mineral.id} style={{ borderRadius: '8px', border: `1px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`, backgroundColor: selected ? 'rgba(139,92,246,0.05)' : 'transparent', overflow: 'hidden', transition: 'all 0.15s' }}>
                      <button type="button" onClick={() => toggleMineral(mineral.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0, border: `2px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`, backgroundColor: selected ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selected && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? '#8B5CF6' : 'var(--text-primary)' }}>{mineral.name}</span>
                          {mineral.code && <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--border-subtle)', padding: '1px 6px', borderRadius: '4px' }}>Code: {mineral.code}</span>}
                          {mineral.hsCode && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--border-subtle)', padding: '1px 6px', borderRadius: '4px' }}>HS: {mineral.hsCode}</span>}
                        </div>
                      </button>
                      {selected && (
                        <div style={{ padding: '0 14px 12px' }}>
                          <input type="text" value={scope!.specifications} onChange={e => updMineralSpec(mineral.id, e.target.value)} placeholder="Specifications / grade / standards (e.g. IS 1493, BIS, ASTM) — Annexure-8 details" style={{ ...inp, fontSize: '12px' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          {form.mineralScopes.length > 0 && (
            <InfoBadge text={`${form.mineralScopes.length} mineral/ore${form.mineralScopes.length > 1 ? 's' : ''} selected — Annexure-8 details shall be attached with documents`} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
          )}
        </>}

        {/* ═══ STEP 7: Ports / Crushing Sheds ═══ */}
        {step === 6 && <>
          <SecHead num="13" title="Port(s) of Operation / Crushing Sheds" subtitle="Select ports where the agency intends to conduct inspections" />
          <div style={{ padding: '10px 0 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ color: '#F59E0B', fontWeight: 600 }}>Note:</span> First selected port is included in the base fee (BR-001). Each additional port attracts an extra fee (BR-002).
          </div>
          {ports.length === 0
            ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>No ports configured. Contact admin.</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {ports.map(port => {
                  const selected = form.selectedPortIds.includes(port.id);
                  const isDefault = selected && form.selectedPortIds[0] === port.id;
                  return (
                    <button key={port.id} type="button" onClick={() => togglePort(port.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`,
                      backgroundColor: selected ? 'rgba(139,92,246,0.08)' : 'transparent', transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0, border: `2px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`, backgroundColor: selected ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: selected ? '#8B5CF6' : 'var(--text-primary)' }}>{port.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {port.state ?? ''}{port.code ? ` · ${port.code}` : ''}
                          {isDefault && <span style={{ marginLeft: '6px', color: '#10B981', fontWeight: 600 }}>Primary</span>}
                          {selected && !isDefault && <span style={{ marginLeft: '6px', color: '#F59E0B', fontWeight: 600 }}>+Fee</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          {form.selectedPortIds.length > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {form.selectedPortIds.length} port{form.selectedPortIds.length > 1 ? 's' : ''} selected
              {form.selectedPortIds.length > 1 && ` · ${form.selectedPortIds.length - 1} additional port fee(s) applicable`}
            </p>
          )}
        </>}

        {/* ═══ STEP 8: Documents ═══ */}
        {step === 7 && <>
          <SecHead num="Encl." title="Upload Checklist — Required Enclosures" subtitle="All documents must be self-attested. Upload PDF, JPG or PNG." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {([
              { num: '1',  label: 'Proof of Address — Head Office',           hint: 'Utility bill / lease deed / property tax receipt',                                required: true  },
              { num: '2',  label: 'Legal Status / Constitution Documents',    hint: 'Certificate of Incorporation / Partnership Deed / MOA / Trust Deed',             required: true  },
              { num: '3',  label: 'Affidavit — No Criminal / Civil Proceedings', hint: 'Duly notarised affidavit covering last 10 years',                             required: true  },
              { num: '4',  label: 'QMS Certification',                        hint: 'ISO/IEC 17020 or ISO 9001 certificate — if implemented',                         required: false },
              { num: '5',  label: 'NABL / Lab Accreditation Certificate',     hint: 'ISO/IEC 17025 accreditation certificate — if laboratory is accredited',          required: false },
              { num: '6',  label: 'Inspection Manpower Details — Annexure-4', hint: 'Individual staff qualifications, experience and area of specialization',         required: true  },
              { num: '7',  label: 'Laboratory Manpower Details',              hint: 'Laboratory staff details — required if in-house laboratory exists',              required: false },
              { num: '8',  label: 'Lab Equipment List — Annexure-3',          hint: 'Complete list of instruments with make, model, serial no. and calibration status', required: false },
              { num: '9',  label: 'Scope of Inspection — Annexure-8',         hint: 'Mineral / ore-wise specifications, grades and applicable standards',             required: true  },
              { num: '10', label: 'Previous Experience Certificates',         hint: 'Work orders / completion certificates from prior inspection engagements',        required: false },
              { num: '11', label: 'Audited Financial Statements',             hint: 'Last 3 financial years — balance sheet and P&L',                                 required: true  },
              { num: '12', label: 'Undertaking / Self-Declaration',           hint: 'Signed by authorised signatory on company letterhead',                           required: true  },
            ] as { num: string; label: string; hint: string; required: boolean }[]).map(doc => (
              <div key={doc.num} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '7px', flexShrink: 0, backgroundColor: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>{doc.num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</span>
                    {doc.required
                      ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Required</span>
                      : <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', backgroundColor: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)' }}>If applicable</span>
                    }
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{doc.hint}</p>
                </div>
                <button type="button" disabled style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px',
                  border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)',
                  color: '#8B5CF6', fontSize: '11px', fontWeight: 600, cursor: 'not-allowed', opacity: 0.5, flexShrink: 0,
                }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload
                </button>
              </div>
            ))}
          </div>
          <InfoBadge text="Document upload coming soon — complete other sections and save your draft." color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
        </>}

        {/* ═══ STEP 9: Declaration ═══ */}
        {step === 8 && <>
          <div>
            <SecHead num="9" title="Details of Criminal / Civil Proceedings Initiated" subtitle="Details during at least last 10 years — Affidavit or equivalent document shall be uploaded" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button type="button" onClick={() => { set('hasCriminalProceedings', !form.hasCriminalProceedings); if (form.hasCriminalProceedings) set('criminalProceedingsDetails', ''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${form.hasCriminalProceedings ? '#EF4444' : 'var(--border-subtle)'}`,
                  backgroundColor: form.hasCriminalProceedings ? 'rgba(239,68,68,0.05)' : 'transparent', background: 'none', width: '100%',
                }}>
                <div style={{ width: 40, height: 22, borderRadius: '11px', flexShrink: 0, transition: 'background 0.2s', backgroundColor: form.hasCriminalProceedings ? '#EF4444' : 'var(--border-subtle)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 3, transition: 'left 0.2s', left: form.hasCriminalProceedings ? 21 : 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: form.hasCriminalProceedings ? '#EF4444' : 'var(--text-primary)' }}>
                    {form.hasCriminalProceedings ? 'Yes — Proceedings exist' : 'No proceedings initiated'}
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Any criminal or civil proceedings initiated against the agency or its key personnel in the last 10 years?
                  </p>
                </div>
              </button>
              {form.hasCriminalProceedings && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Field label="Details of Proceedings" required hint="Case details, court / authority, current status — last 10 years">
                    <TA value={form.criminalProceedingsDetails} onChange={v => set('criminalProceedingsDetails', v)} placeholder="Case number, court / authority, nature and current status of each proceeding…" rows={4} />
                  </Field>
                  <InfoBadge text="Affidavit or equivalent document upload required" />
                </div>
              )}
            </div>
          </div>
          <div>
            <SecHead num="Dec." title="Declaration" subtitle="Read carefully before submitting" />
            <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: 'rgba(139,92,246,0.03)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                I/We hereby declare that the information furnished in this application and the documents enclosed are true, complete and correct to the best of my/our knowledge and belief.
                I/We undertake to comply with the requirements prescribed by EIC for recognition as a Private Inspection Agency.
                I/We understand that any false or misleading information may result in rejection of the application or cancellation of recognition if already granted.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                <input type="checkbox" id="dec-check" style={{ accentColor: '#8B5CF6', width: 16, height: 16 }} />
                <label htmlFor="dec-check" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  I/We accept the above declaration and confirm all information is correct
                </label>
              </div>
            </div>
          </div>
        </>}

        {/* ═══ STEP 10: Fee Summary ═══ */}
        {step === 9 && <>
          <SecHead num="Fee" title="Fee Summary" subtitle="Applicable fees based on selected application type, ports and scope" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Application Fee (BR-001)', amount: form.subType === 'NEW_RECOGNITION' ? '₹10,000' : form.subType === 'RENEWAL' ? '₹5,000' : '₹7,500', note: 'Base application processing fee' },
              { label: 'Additional Port Fee', amount: form.selectedPortIds.length > 1 ? `₹${(form.selectedPortIds.length - 1) * 2000} (${form.selectedPortIds.length - 1} port${form.selectedPortIds.length > 2 ? 's' : ''} × ₹2,000)` : 'Nil', note: 'BR-002 — per additional port beyond the first' },
              { label: 'Inspection Fee', amount: '₹25,000', note: 'On-site inspection fee (if applicable)' },
              { label: 'Annual Fee (post approval)', amount: '₹15,000 / year', note: 'Payable after recognition is granted' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{row.note}</p>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#8B5CF6' }}>{row.amount}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 18px', borderRadius: '8px', backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 700, color: '#8B5CF6' }}>Note:</span> Fees are indicative and subject to EIC rules. Actual payment will be generated after application submission and review.
            </p>
          </div>
        </>}

        {/* ── Step navigation ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: '8px' }}>
          <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : onBack()} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '7px',
            border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {step === 0 ? 'Cancel' : 'Previous'}
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => doSave(true)} disabled={isSaving} style={{
              padding: '9px 20px', borderRadius: '7px', border: '1px solid #8B5CF6',
              backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>{isSaving ? 'Saving…' : 'Save Draft'}</button>
            {step < STEPS.length - 1
              ? (
                <button type="button" onClick={async () => { await doSave(false); setStep(s => s + 1); }} disabled={isSaving} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '7px',
                  backgroundColor: '#8B5CF6', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                  Save &amp; Next
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              )
              : (
                <button type="button" onClick={() => doSave(true)} disabled={isSaving} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '7px',
                  backgroundColor: '#10B981', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Submit Application
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
