import { useState, useEffect, useCallback, useRef } from 'react';
import {
  piaApi, PIABranchPayload, PIASubType, PIAApplicationFull,
  PIAPortMaster, PIAMineralMaster, PIAEIAOffice, PIADocChecklistItem, PIADocumentItem, PIAFeeConfigItem,
  ManpowerRow, LabManpowerRow, MineralScopeRow, LabEquipmentRow, LabProductRow,
} from '../../services/pia.service';

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'general',     label: 'General Information'      },
  { key: 'inspection',  label: 'Inspection Details'       },
  { key: 'laboratory',  label: 'Laboratory Capabilities'  },
  { key: 'manpower',    label: 'Manpower'                 },
  { key: 'additional',  label: 'Additional Information'   },
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
  submittingOfficeId: string;
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
  subType: 'NEW_RECOGNITION', submittingOfficeId: '', agencyName: '', agencyNameHindi: '',
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
    subType: p.subType, submittingOfficeId: app.officeId ?? '', agencyName: app.organisation,
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

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(
  stepIndex: number,
  form: CombinedFormState,
  declarantName: string,
  declarantDesignation: string,
  declarantDate: string,
  declarantPlace: string,
  declarationAccepted: boolean,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (stepIndex === 0) {
    if (!form.submittingOfficeId)            e.submittingOfficeId   = 'Please select an EIA office';
    if (!form.agencyName.trim())             e.agencyName           = 'Agency name is required';
    if (!form.headOfficeAddress.trim())      e.headOfficeAddress    = 'Address is required';
    if (!form.headOfficeState)               e.headOfficeState      = 'State is required';
    if (!form.headOfficeCity.trim())         e.headOfficeCity       = 'City is required';
    if (!form.headOfficePincode.trim())      e.headOfficePincode    = 'PIN code is required';
    if (!form.headOfficePhone.trim())        e.headOfficePhone      = 'Phone number is required';
    if (!form.headOfficeEmail.trim())        e.headOfficeEmail      = 'Email is required';
    if (!form.headOfOrgName.trim())          e.headOfOrgName        = 'Name is required';
    if (!form.headOfOrgDesignation.trim())   e.headOfOrgDesignation = 'Designation is required';
    if (!form.headOfOrgContact.trim())       e.headOfOrgContact     = 'Contact details are required';
    if (!form.legalStatus)                   e.legalStatus          = 'Legal status is required';
    if (form.legalStatus === 'OTHER' && !form.legalStatusDetails.trim())
                                             e.legalStatusDetails   = 'Please specify details';
  }
  if (stepIndex === 7) {
    if (!declarantName.trim())        e.declarantName        = 'Required';
    if (!declarantDesignation.trim()) e.declarantDesignation = 'Required';
    if (!declarantDate)               e.declarantDate        = 'Required';
    if (!declarantPlace.trim())       e.declarantPlace       = 'Required';
    if (!declarationAccepted)         e.declarationAccepted  = 'You must accept the declaration to proceed';
  }
  return e;
}

function focusFirstError(errs: Record<string, string>) {
  const key = Object.keys(errs)[0];
  if (!key) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(`field-${key}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
  });
}

// ─── UI primitives ────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  padding: '8px 11px', borderRadius: '6px', border: '1.5px solid rgba(59,130,246,0.35)',
  backgroundColor: '#f0f9ff', color: 'var(--text-primary)', fontSize: '13px',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

const STEP_CARD: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.04)',
  boxShadow: '0 2px 16px rgba(59,130,246,0.07), 0 1px 4px rgba(0,0,0,0.04)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
};

function Field({ label, required, hint, children, error }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error
        ? <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </span>
        : hint && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hint}</span>
      }
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px' }}>{children}</div>;
}

const errInp: React.CSSProperties = { border: '1.5px solid #EF4444', backgroundColor: '#FFF5F5' };
function TI({ value, onChange, placeholder, type = 'text', disabled, readOnly, id, hasError }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; readOnly?: boolean; id?: string; hasError?: boolean }) {
  return <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} readOnly={readOnly} style={{ ...inp, ...(hasError ? errInp : {}), opacity: disabled ? 0.5 : 1, backgroundColor: hasError ? '#FFF5F5' : readOnly ? 'var(--bg-page)' : undefined, cursor: readOnly ? 'default' : undefined }} />;
}
function TA({ value, onChange, placeholder, rows = 3, id, hasError }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; id?: string; hasError?: boolean }) {
  return <textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inp, ...(hasError ? errInp : {}), resize: 'vertical', lineHeight: 1.5 }} />;
}
function Sel({ value, onChange, options, placeholder, id, hasError }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; id?: string; hasError?: boolean }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, ...(hasError ? errInp : {}), cursor: 'pointer' }}>
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
          border: `1px solid ${value === opt ? 'var(--grad-to)' : 'var(--border-subtle)'}`,
          backgroundColor: value === opt ? 'rgba(0,0,0,0.05)' : 'transparent',
          color: value === opt ? 'var(--grad-to)' : 'var(--text-muted)',
        }}>{opt ? 'Yes' : 'No'}</button>
      ))}
    </div>
  );
}
function SecHead({ title, subtitle }: { num?: string; title: string; subtitle?: string }) {
  return (
    <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
      {subtitle && <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</p>}
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
  applicationId: string | null;  // null = brand-new, not yet persisted
  newSubType?: PIASubType;       // used only when applicationId is null
  newAgencyName?: string;        // pre-fills agency name for new apps
  onBack: () => void;
  onSaved?: (app: PIAApplicationFull) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PIAApplicationForm({ applicationId, newSubType, newAgencyName, onBack, onSaved }: Props) {
  const [form, setForm]         = useState<CombinedFormState>(EMPTY);
  const [appNo, setAppNo]       = useState('');
  const [step, setStep]         = useState(0);
  const [ports, setPorts]           = useState<PIAPortMaster[]>([]);
  const [minerals, setMinerals]     = useState<PIAMineralMaster[]>([]);
  const [eiaOffices, setEiaOffices] = useState<PIAEIAOffice[]>([]);
  const [docChecklist, setDocChecklist] = useState<PIADocChecklistItem[]>([]);
  const [feeConfig, setFeeConfig] = useState<PIAFeeConfigItem[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<PIADocumentItem[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDocTypeRef = useRef<string>('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<PIAApplicationFull | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [isPayingRef, setIsPayingRef] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [declarantName, setDeclarantName] = useState('');
  const [declarantDesignation, setDeclarantDesignation] = useState('');
  const [declarantDate, setDeclarantDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [declarantPlace, setDeclarantPlace] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  // resolvedId is null for brand-new apps until the first save creates the DB record
  const [resolvedId, setResolvedId] = useState<string | null>(applicationId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isDirty, setIsDirty]     = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mastersFetch = Promise.all([
      piaApi.getMasterPorts(),
      piaApi.getMasterMinerals(),
      piaApi.getMasterEIAOffices(),
    ]);

    if (applicationId === null) {
      // New application: only load master data, show blank form
      mastersFetch.then(([pts, mins, offices]) => {
        setPorts(pts.filter(p => p.isActive));
        setMinerals(mins.filter(m => m.isActive));
        setEiaOffices(offices);
        const sub = newSubType ?? 'NEW_RECOGNITION';
        setForm(prev => ({ ...prev, subType: sub, agencyName: newAgencyName ?? '' }));
        setIsLoading(false);
        piaApi.getMasterDocumentChecklist(sub).then(setDocChecklist).catch(() => {});
        piaApi.getMasterFeeConfig().then(setFeeConfig).catch(() => {});
      }).catch(() => setIsLoading(false));
      return;
    }

    Promise.all([piaApi.getById(applicationId), mastersFetch])
      .then(([app, [pts, mins, offices]]) => {
        const f = formFromApp(app);
        setForm(f);
        setAppNo(app.appNo);
        setPorts(pts.filter(p => p.isActive));
        setMinerals(mins.filter(m => m.isActive));
        setEiaOffices(offices);
        setIsLoading(false);
        piaApi.getMasterDocumentChecklist(f.subType).then(setDocChecklist).catch(() => {});
        piaApi.listDocuments(applicationId).then(setUploadedDocs).catch(() => {});
        piaApi.getMasterFeeConfig().then(setFeeConfig).catch(() => {});
      }).catch(() => setIsLoading(false));
  }, [applicationId]);

  useEffect(() => {
    if (!isDirty || isLoading || !resolvedId) return;  // never auto-save a brand-new unsaved app
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave(false), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, isDirty, isLoading, resolvedId]);

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
    setErrors(prev => { const n = { ...prev }; delete n[key as string]; return n; });
  }, []);

  const uploadBaseUrl = (import.meta.env.VITE_API_URL as string).replace(/\/api\/v1\/?$/, '') + '/uploads';

  const handleUploadClick = (documentType: string) => {
    pendingDocTypeRef.current = documentType;
    if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocTypeRef.current || !resolvedId) return;
    const docType = pendingDocTypeRef.current;
    setUploadingType(docType);
    try {
      const doc = await piaApi.uploadDocument(resolvedId, docType, file);
      setUploadedDocs(prev => [...prev.filter(d => d.documentType !== docType), doc]);
    } catch { /* ignore */ }
    finally { setUploadingType(null); }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!resolvedId) return;
    setDeletingDocId(docId);
    try {
      await piaApi.deleteDocument(resolvedId, docId);
      setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    } catch { /* ignore */ }
    finally { setDeletingDocId(null); }
  };


  const fmtSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const partIPayload = () => ({
    officeId: form.submittingOfficeId || null,
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
  });

  const partIIPayload = () => ({
    seniorMgmtCount: form.seniorMgmtCount ? parseInt(form.seniorMgmtCount) : null,
    inspectingStaffCount: form.inspectingStaffCount ? parseInt(form.inspectingStaffCount) : null,
    qmsImplemented: form.qmsImplemented, qmsType: form.qmsType || undefined,
    isAccredited: form.isAccredited, accreditationScope: form.accreditationScope,
    accreditationBody: form.accreditationBody, consultancyDetails: form.consultancyDetails,
    hasDomesticExperience: form.hasDomesticExperience, hasExportExperience: form.hasExportExperience,
    hasLaboratory: form.hasLabAccreditation || !!form.labConsultancyDetails || form.labEquipment.length > 0 || form.labProducts.length > 0 || form.labManpower.length > 0,
    hasLabAccreditation: form.hasLabAccreditation,
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
  });

  const tryNavigate = useCallback((targetStep: number) => {
    if (targetStep <= step) { setErrors({}); setStep(targetStep); return; }
    const errs = validateStep(step, form, declarantName, declarantDesignation, declarantDate, declarantPlace, declarationAccepted);
    if (Object.keys(errs).length > 0) { setErrors(errs); focusFirstError(errs); return; }
    setErrors({}); setStep(targetStep);
  }, [step, form, declarantName, declarantDesignation, declarantDate, declarantPlace, declarationAccepted]);

  const doSave = useCallback(async (feedback = true) => {
    if (isSaving) return;
    setIsSaving(true); setSaveError('');
    try {
      let id = resolvedId;
      if (!id) {
        // First save for a brand-new application: create the draft record first
        if (!form.agencyName.trim()) {
          setSaveError('Agency name is required before saving.');
          setIsSaving(false);
          return;
        }
        const newApp = await piaApi.createDraft(form.agencyName.trim(), form.subType);
        id = newApp.id;
        setResolvedId(id);
        setAppNo(newApp.appNo);
      }
      await Promise.all([piaApi.savePartI(id, partIPayload()), piaApi.savePartII(id, partIIPayload())]);
      setIsDirty(false); setLastSaved(new Date());
      if (feedback) {
        const saved = await piaApi.getById(id);
        onSaved?.(saved as any);
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Save failed. Please try again.');
    } finally { setIsSaving(false); }
  }, [resolvedId, form, isSaving]);

  const doSubmit = useCallback(async () => {
    if (!resolvedId) { setSaveError('Please save your draft first before submitting.'); return; }
    // Dummy required-fields check
    const missing: string[] = [];
    if (!form.agencyName.trim())         missing.push('Agency Name');
    if (!form.submittingOfficeId)        missing.push('Concerned EIA Office');
    if (!form.headOfficeAddress.trim())  missing.push('Head Office Address');
    if (!form.headOfficeState.trim())    missing.push('Head Office State');
    if (!form.headOfOrgName.trim())      missing.push('Head of Organisation');
    if (!declarationAccepted)            missing.push('Declaration (must be accepted)');
    if (missing.length) {
      setSaveError(`Please complete required fields: ${missing.join(', ')}.`);
      setShowSubmitConfirm(false);
      return;
    }
    if (isSaving) return;
    setIsSaving(true); setSaveError('');
    try {
      await Promise.all([piaApi.savePartI(resolvedId, partIPayload()), piaApi.savePartII(resolvedId, partIIPayload())]);
      const result = await piaApi.submit(resolvedId);
      setSubmittedApp(result);
      setShowSubmitConfirm(false);
      if (onSaved) onSaved(result);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Submission failed. Please try again.');
    } finally { setIsSaving(false); }
  }, [resolvedId, form, isSaving, declarationAccepted, onSaved]);

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
      <div style={{ width: 20, height: 20, border: '2px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--grad-to)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading application…</span>
    </div>
  );

  const subTypeLabel = form.subType === 'NEW_RECOGNITION' ? 'New Recognition' : form.subType === 'RENEWAL' ? 'Renewal' : 'Modification / Extension of Scope';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, backgroundColor: '#f8fafc', borderRadius: '12px', overflow: 'clip' }}>
      {/* Hidden file input for document upload */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileSelected} />

      {/* ── Sticky top bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #fff 0%, #f0f9ff 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', padding: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{subTypeLabel}</span>
          {appNo
            ? <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--grad-to)' }}>{appNo}</span>
            : <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' }}>Not saved yet</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '11px', color: saveError ? '#EF4444' : 'var(--text-muted)' }}>
            {saveError || (isSaving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : isDirty ? 'Unsaved changes' : '')}
          </span>
          <button onClick={() => doSave(true)} disabled={isSaving} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '7px',
            backgroundColor: (isDirty || !resolvedId) ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: `1px solid ${(isDirty || !resolvedId) ? 'var(--grad-to)' : 'var(--border-subtle)'}`,
            color: (isDirty || !resolvedId) ? 'var(--grad-to)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600,
            cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.6 : 1,
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Save Draft
          </button>
        </div>
      </div>

      {/* ── Step indicator — 2 × 5 grid ── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '12px 20px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Progress</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  height: 4, borderRadius: 2,
                  width: i === step ? 20 : 8,
                  backgroundColor: i < step ? '#10B981' : i === step ? 'var(--grad-to)' : 'var(--border-subtle)',
                  transition: 'all 0.25s ease',
                }} />
              ))}
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--grad-to)' }}>
            {step + 1} / {STEPS.length} &nbsp;·&nbsp; <span style={{ fontWeight: 700 }}>{STEPS[step].label}</span>
          </span>
        </div>
        {/* Step grid on tinted tray */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px',
          backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '5px',
          border: '1px solid rgba(0,0,0,0.04)',
        }}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone   = i < step;
            return (
              <button
                key={s.key}
                onClick={() => tryNavigate(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 11px', borderRadius: '7px', cursor: 'pointer', border: 'none',
                  background: isActive ? 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' : isDone ? '#F0FDF4' : 'var(--bg-card)',
                  boxShadow: isActive
                    ? '0 3px 10px rgba(0,0,0,0.2)'
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
                  {isDone && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>

        {/* ═══ STEP 1: General Information ═══ */}
        {step === 0 && <div style={STEP_CARD}>
          <div>
            <SecHead num="0" title="Submission Office" subtitle="Select the EIA office to which this application will be submitted" />
            {eiaOffices.length === 0 ? (
              <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No EIA offices configured. Contact administrator.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Field label="Submit Application To" required error={errors.submittingOfficeId}>
                  <select
                    id="field-submittingOfficeId"
                    value={form.submittingOfficeId}
                    onChange={e => set('submittingOfficeId', e.target.value)}
                    style={{ ...inp, cursor: 'pointer', ...(errors.submittingOfficeId ? errInp : {}) }}
                  >
                    <option value="">— Select EIA Office —</option>
                    {eiaOffices.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name}{o.code ? ` (${o.code})` : ''}{o.state ? ` — ${o.state}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                {form.submittingOfficeId && (() => {
                  const office = eiaOffices.find(o => o.id === form.submittingOfficeId);
                  return office ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <svg width="14" height="14" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--grad-to)' }}>{office.name}</span>
                      {office.city && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{office.city}{office.state ? `, ${office.state}` : ''}</span>}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          <div>
            <SecHead num="1" title="Name of the Applicant / Inspection Agency" subtitle="As registered — English and Hindi" />
            <Grid>
              <Field label="Name (English)" required error={errors.agencyName}>
                <TI
                  id="field-agencyName" hasError={!!errors.agencyName}
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
              <Field label="Address of Head Office" required error={errors.headOfficeAddress}>
                <TA id="field-headOfficeAddress" hasError={!!errors.headOfficeAddress} value={form.headOfficeAddress} onChange={v => set('headOfficeAddress', v)} placeholder="Building no., street, locality…" rows={3} />
                <InfoBadge text="Address proof upload required" />
              </Field>
              <Grid cols={3}>
                <Field label="State / UT" required error={errors.headOfficeState}>
                  <Sel id="field-headOfficeState" hasError={!!errors.headOfficeState} value={form.headOfficeState} onChange={v => set('headOfficeState', v)} options={INDIAN_STATES.map(s => ({ value: s, label: s }))} placeholder="— Select State —" />
                </Field>
                <Field label="District"><TI value={form.headOfficeDistrict} onChange={v => set('headOfficeDistrict', v)} placeholder="District" /></Field>
                <Field label="City / Town" required error={errors.headOfficeCity}><TI id="field-headOfficeCity" hasError={!!errors.headOfficeCity} value={form.headOfficeCity} onChange={v => set('headOfficeCity', v)} placeholder="City" /></Field>
              </Grid>
              <Grid cols={3}>
                <Field label="PIN Code" required error={errors.headOfficePincode}><TI id="field-headOfficePincode" hasError={!!errors.headOfficePincode} value={form.headOfficePincode} onChange={v => set('headOfficePincode', v)} placeholder="6-digit PIN" /></Field>
                <Field label="Country"><TI value={form.headOfficeCountry} onChange={v => set('headOfficeCountry', v)} placeholder="India" /></Field>
              </Grid>
            </div>
          </div>
          <div>
            <SecHead num="1.2" title="Phone No. / Fax / E-mail" />
            <Grid cols={3}>
              <Field label="Phone No. / Mobile" required error={errors.headOfficePhone}><TI id="field-headOfficePhone" hasError={!!errors.headOfficePhone} value={form.headOfficePhone} onChange={v => set('headOfficePhone', v)} placeholder="+91 XXXXX XXXXX" /></Field>
              <Field label="Fax"><TI value={form.headOfficeFax} onChange={v => set('headOfficeFax', v)} placeholder="Fax number" /></Field>
              <Field label="E-mail" required error={errors.headOfficeEmail}><TI id="field-headOfficeEmail" hasError={!!errors.headOfficeEmail} value={form.headOfficeEmail} onChange={v => set('headOfficeEmail', v)} placeholder="office@agency.com" /></Field>
            </Grid>
            <InfoBadge text="Email / mobile validation required" />
          </div>
          <div>
            <SecHead num="1.3" title="Name of Head of Organization and Designation" />
            <Grid cols={3}>
              <Field label="Name" required error={errors.headOfOrgName}><TI id="field-headOfOrgName" hasError={!!errors.headOfOrgName} value={form.headOfOrgName} onChange={v => set('headOfOrgName', v)} placeholder="Full name" /></Field>
              <Field label="Designation" required error={errors.headOfOrgDesignation}><TI id="field-headOfOrgDesignation" hasError={!!errors.headOfOrgDesignation} value={form.headOfOrgDesignation} onChange={v => set('headOfOrgDesignation', v)} placeholder="e.g. Managing Director" /></Field>
              <Field label="Contact Details" required error={errors.headOfOrgContact}><TI id="field-headOfOrgContact" hasError={!!errors.headOfOrgContact} value={form.headOfOrgContact} onChange={v => set('headOfOrgContact', v)} placeholder="+91 XXXXX XXXXX" /></Field>
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
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)', display: 'block', marginBottom: '10px' }}>2.1 — Name of Head of Branch</span>
                    <Grid>
                      <Field label="Name"><TI value={b.headOfBranchName} onChange={v => updBranch(idx, 'headOfBranchName', v)} placeholder="Full name" /></Field>
                      <Field label="Designation"><TI value={b.headOfBranchDesignation} onChange={v => updBranch(idx, 'headOfBranchDesignation', v)} placeholder="Designation" /></Field>
                    </Grid>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)', display: 'block', marginBottom: '10px' }}>2.2 — Branch Phone No. / Fax / E-mail</span>
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
                border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)',
                color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
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
              <Field label="Legal Status / Constitution" required error={errors.legalStatus}>
                <Sel id="field-legalStatus" hasError={!!errors.legalStatus} value={form.legalStatus} onChange={v => set('legalStatus', v)} options={LEGAL_STATUS_OPTIONS} placeholder="— Select Legal Status —" />
              </Field>
              {form.legalStatus === 'OTHER' && (
                <Field label="Specify Details" required error={errors.legalStatusDetails}>
                  <TI id="field-legalStatusDetails" hasError={!!errors.legalStatusDetails} value={form.legalStatusDetails} onChange={v => set('legalStatusDetails', v)} placeholder="Describe legal constitution" />
                </Field>
              )}
            </Grid>
          </div>
          <div>
            <SecHead num="6" title="Scope for which Recognition is Sought" subtitle="Product / product group, minerals / ores, corresponding specifications / standards and Annexure-8 details" />
            {minerals.length === 0
              ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>No minerals configured. Contact admin.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {minerals.map(mineral => {
                    const scope = form.mineralScopes.find(s => s.mineralOreId === mineral.id);
                    const selected = !!scope;
                    return (
                      <div key={mineral.id} style={{ borderRadius: '8px', border: `1px solid ${selected ? 'var(--grad-to)' : 'var(--border-subtle)'}`, backgroundColor: selected ? 'rgba(0,0,0,0.03)' : 'transparent', overflow: 'hidden', transition: 'all 0.15s' }}>
                        <button type="button" onClick={() => toggleMineral(mineral.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0, border: `2px solid ${selected ? 'var(--grad-to)' : 'var(--border-subtle)'}`, backgroundColor: selected ? 'var(--grad-to)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selected && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? 'var(--grad-to)' : 'var(--text-primary)' }}>{mineral.name}</span>
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
        </div>}

        {/* ═══ STEP 2: Inspection Details ═══ */}
        {step === 1 && <div style={STEP_CARD}>
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
          {/* 10.1 — Professionally qualified inspection staff */}
          <div>
            <SecHead num="10.1" title="Professionally Qualified Inspection Staff" subtitle="Qualification and experience details — Annexure-4 format" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 10.1.1 — Senior Management */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>10.1.1 — Senior Management - Inspection Division</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {form.manpower.filter(m => m.isSeniorMgmt).length === 0 && (
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No senior management added.</div>
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
                  <button type="button" onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER, isSeniorMgmt: true }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Senior Management
                  </button>
                </div>
              </div>
              {/* 10.1.2 — Technical Inspecting Staff */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>10.1.2 — Inspecting Staff</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {form.manpower.filter(m => !m.isSeniorMgmt).length === 0 && (
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No inspecting staff added.</div>
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
                  <button type="button" onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER, isSeniorMgmt: false }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Inspecting Staff
                  </button>
                </div>
              </div>
            </div>
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
                        border: `1px solid ${form.qmsType === opt.value ? 'var(--grad-to)' : 'var(--border-subtle)'}`,
                        backgroundColor: form.qmsType === opt.value ? 'rgba(0,0,0,0.05)' : 'transparent',
                        color: form.qmsType === opt.value ? 'var(--grad-to)' : 'var(--text-secondary)',
                      }}>{opt.label}</button>
                    ))}
                  </div>
                </Field>
              )}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>11.1 — Accreditation Status (ISO/IEC 17020)</p>
                <Field label="Is the agency accredited (ISO/IEC 17020)?"><Toggle value={form.isAccredited} onChange={v => set('isAccredited', v)} /></Field>
                {form.isAccredited && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>11.2 — Scope of Accreditation</p>
                    <Grid>
                      <Field label="Accreditation Body"><TI value={form.accreditationBody} onChange={v => set('accreditationBody', v)} placeholder="e.g. NABL" /></Field>
                      <Field label="Scope of Accreditation"><TI value={form.accreditationScope} onChange={v => set('accreditationScope', v)} placeholder="Commodity scope" /></Field>
                    </Grid>
                  </div>
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>11.3 — Consultancy / Advisory Details</p>
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
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>12.1 — Domestic Inspection</p>
                <Field label="Has the agency carried out domestic inspections?"><Toggle value={form.hasDomesticExperience} onChange={v => set('hasDomesticExperience', v)} /></Field>
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: 'var(--grad-to)' }}>12.2 — Export Inspection</p>
                <Field label="Has the agency carried out export inspections?"><Toggle value={form.hasExportExperience} onChange={v => set('hasExportExperience', v)} /></Field>
              </div>
            </Grid>
          </div>
        </div>}

        {/* ═══ STEP 3: Laboratory Capabilities ═══ */}
        {step === 2 && <div style={STEP_CARD}>

          {/* 9.1 — Laboratory Accreditation / Recognition */}
          <div>
            <SecHead num="9.1" title="Laboratory Accreditation / Recognition" subtitle="Whether accredited as per ISO/IEC 17025 or recognized by EIC / other equivalent standard" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Is the laboratory accredited or recognized (ISO/IEC 17025 / EIC)?">
                <Toggle value={form.hasLabAccreditation} onChange={v => set('hasLabAccreditation', v)} />
              </Field>
              {form.hasLabAccreditation && (
                <Field label="Accreditation / Recognition Type">
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {LAB_ACCREDITATION_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => set('labAccreditationType', opt.value)} style={{
                        padding: '7px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${form.labAccreditationType === opt.value ? 'var(--grad-to)' : 'var(--border-subtle)'}`,
                        backgroundColor: form.labAccreditationType === opt.value ? 'rgba(0,0,0,0.05)' : 'transparent',
                        color: form.labAccreditationType === opt.value ? 'var(--grad-to)' : 'var(--text-secondary)',
                      }}>{opt.label}</button>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          </div>

          {/* 9.1.1 — Scope of Laboratory Accreditation / Recognition */}
          {form.hasLabAccreditation && (
            <div>
              <SecHead num="9.1.1" title="Scope of Laboratory Accreditation / Recognition" subtitle="Scope details and certificate attachment" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Field label="Scope of Accreditation / Recognition" required>
                  <TA value={form.labAccreditationScope} onChange={v => set('labAccreditationScope', v)} rows={3} placeholder="Describe parameters, commodities and test methods covered under the accreditation / recognition" />
                </Field>
              </div>
            </div>
          )}

          {/* 9.2 — Laboratory Consultancy Details */}
          <div>
            <SecHead num="9.2" title="Laboratory Consultancy Details" subtitle="Information regarding consultancy used for accreditation / recognition" />
            <Field label="Consultancy / Advisory involvement" hint="Leave blank if not applicable">
              <TA value={form.labConsultancyDetails} onChange={v => set('labConsultancyDetails', v)} rows={3} placeholder="Name of consultant, scope of consultancy, duration, etc." />
            </Field>
          </div>

          {/* 9.3 — List of Products Tested */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <SecHead num="9.3" title="List of Products Tested in Laboratory" subtitle="Products / product groups tested — Annexure-2 format" />
              <button type="button" onClick={() => set('labProducts', [...form.labProducts, { ...EMPTY_LAB_PRODUCT }])} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Product
              </button>
            </div>
            {form.labProducts.length === 0
              ? <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No products added yet.</div>
              : (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 36px', backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
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

          {/* 9.4 — List of Equipment */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <SecHead num="9.4" title="List of Equipment Available in Laboratory" subtitle="Equipment, model, date of purchase, calibration status — Annexure-3 format" />
              <button type="button" onClick={() => set('labEquipment', [...form.labEquipment, { ...EMPTY_EQUIPMENT }])} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Equipment
              </button>
            </div>
            {form.labEquipment.length === 0
              ? <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No equipment added yet.</div>
              : (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.4fr 36px', backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Equipment Name', 'Make', 'Model', 'Serial No.', 'Range / Capacity', 'Calib. Due Date', ''].map((h, i) => (
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

        </div>}

        {/* ═══ STEP 4: Manpower ═══ */}
        {step === 3 && <div style={STEP_CARD}>

          {/* 10.1.1 — Senior Management - Inspection Division */}
          <div>
            <SecHead num="10.1.1" title="Senior Management - Inspection Division" subtitle="Name, designation, qualification, experience, specialization, and document evidence" />
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
              <button type="button" onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER, isSeniorMgmt: true }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Senior Management
              </button>
            </div>
          </div>

          {/* 10.1.2 — Inspecting Staff */}
          <div>
            <SecHead num="10.1.2" title="Inspecting Staff" subtitle="Professionally qualified staff with qualification and experience" />
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
              <button type="button" onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER, isSeniorMgmt: false }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Inspecting Staff
              </button>
            </div>
          </div>

          {/* 10.2.1 — Senior Management - Testing Staff */}
          <div>
            <SecHead num="10.2.1" title="Senior Management - Testing Staff" subtitle="Laboratory senior management details" />
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
                <button type="button" onClick={() => set('labManpower', [...form.labManpower, { ...EMPTY_LAB_MP, isSeniorMgmt: true }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Senior Management
                </button>
              </div>
            </div>

          {/* 10.2.2 — Testing Staff */}
          <div>
            <SecHead num="10.2.2" title="Testing Staff" subtitle="Professionally qualified laboratory staff details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {form.labManpower.filter(m => !m.isSeniorMgmt).length === 0 && (
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No testing staff added.</div>
              )}
              {form.labManpower.map((row, idx) => row.isSeniorMgmt ? null : (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Testing Staff #{form.labManpower.slice(0, idx + 1).filter(m => !m.isSeniorMgmt).length}</span>
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
              <button type="button" onClick={() => set('labManpower', [...form.labManpower, { ...EMPTY_LAB_MP, isSeniorMgmt: false }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px dashed #3B82F6', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Testing Staff
              </button>
            </div>
          </div>

        </div>}

        {/* ═══ STEP 5: Additional Information ═══ */}
        {step === 4 && <div style={STEP_CARD}>
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
        </div>}

        {/* ═══ STEP 6: Ports / Crushing Sheds ═══ */}
        {step === 5 && <div style={STEP_CARD}>
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
                      border: `1px solid ${selected ? 'var(--grad-to)' : 'var(--border-subtle)'}`,
                      backgroundColor: selected ? 'rgba(0,0,0,0.03)' : 'transparent', transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0, border: `2px solid ${selected ? 'var(--grad-to)' : 'var(--border-subtle)'}`, backgroundColor: selected ? 'var(--grad-to)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: selected ? 'var(--grad-to)' : 'var(--text-primary)' }}>{port.name}</div>
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
        </div>}

        {/* ═══ STEP 7: Documents ═══ */}
        {step === 6 && <div style={STEP_CARD}>
          <SecHead num="Encl." title="Upload Checklist — Required Enclosures" subtitle="All documents must be self-attested. Upload PDF, JPG or PNG." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {docChecklist.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading document checklist…</div>
              : docChecklist.map((doc, i) => {
                const uploaded = uploadedDocs.find(d => d.documentType === doc.documentType);
                const isUploading = uploadingType === doc.documentType;
                const isDeleting = uploaded ? deletingDocId === uploaded.id : false;
                return (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                    borderRadius: '8px', border: `1px solid ${uploaded ? 'rgba(34,197,94,0.35)' : 'var(--border-subtle)'}`,
                    backgroundColor: uploaded ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: '7px', flexShrink: 0, backgroundColor: uploaded ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: uploaded ? '#16A34A' : 'var(--grad-to)' }}>
                      {uploaded ? <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.documentLabel}</span>
                        {doc.isMandatory
                          ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Required</span>
                          : <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', backgroundColor: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)' }}>If applicable</span>
                        }
                      </div>
                      {uploaded
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#16A34A', flexShrink: 0 }}><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                            <a href={`${uploadBaseUrl}/${uploaded.filePath}`} target="_blank" rel="noreferrer"
                              style={{ fontSize: '11px', color: 'var(--grad-to)', textDecoration: 'none', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                              {uploaded.documentName}
                            </a>
                            {uploaded.fileSize && <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{fmtSize(uploaded.fileSize)}</span>}
                          </div>
                        : doc.description && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{doc.description}</p>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {uploaded && (
                        <button type="button" onClick={() => handleDeleteDoc(uploaded.id)} disabled={isDeleting}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)', color: '#EF4444', fontSize: '11px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1 }}>
                          {isDeleting
                            ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(239,68,68,0.3)', borderTopColor: '#EF4444', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            : <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          }
                          Remove
                        </button>
                      )}
                      <button type="button" onClick={() => handleUploadClick(doc.documentType)} disabled={isUploading}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: `1px ${uploaded ? 'solid' : 'dashed'} #3B82F6`, backgroundColor: uploaded ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.03)', color: 'var(--grad-to)', fontSize: '11px', fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}>
                        {isUploading
                          ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--grad-to)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          : <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        }
                        {uploaded ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
          <InfoBadge text="Upload PDF, JPG or PNG — max 10 MB per file. Uploaded documents are saved immediately." color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
        </div>}

        {/* ═══ STEP 8: Declaration ═══ */}
        {step === 7 && <div style={STEP_CARD}>
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
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.04)', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>Declaration</p>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(29,78,216,0.55)' }}>Read all clauses carefully. Fields below must be filled by the Authorized Signatory.</p>
            </div>
            {/* Official declaration document */}
            <div style={{ borderRadius: '10px', border: '1.5px solid rgba(59,130,246,0.25)', backgroundColor: '#fff', overflow: 'hidden' }}>
              {/* Document header */}
              <div style={{ textAlign: 'center', padding: '18px 24px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'rgba(59,130,246,0.03)' }}>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Annex 7</p>
                <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>DECLARATION</p>
              </div>
              {/* Body */}
              <div style={{ padding: '20px 24px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
                {/* Opening line with pre-filled agency name */}
                <p style={{ margin: '0 0 14px' }}>
                  I/We on behalf of{' '}
                  <span style={{ borderBottom: '1.5px solid #1D4ED8', paddingBottom: '1px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '180px', display: 'inline-block' }}>
                    {form.agencyName || '____________________________'}
                  </span>
                  {' '}apply for Recognition under EIC Inspection Agency Recognition Scheme, 2012 for the scope specified in item 6 of the Application and declare that:
                </p>
                <ol style={{ margin: '0 0 16px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>The information given in the application is true.</li>
                  <li>The recognition procedure has been read and understood.</li>
                  <li>The applicant body has adequate resources to conduct inspection in accordance with the recognition criteria and other guidance documents.</li>
                  <li>The applicant body shall pay fees as per the applicable schedule of fee.</li>
                  <li>If any information given by the applicant body is wrong or the applicant body is found to be not complying with the criteria of recognition or other specified rules and regulations, the recognition may be suspended or withdrawn at the discretion of the EIC.</li>
                  <li>The applicant body agrees to provide access to all the information relevant to the inspection system (including details of complaints, disputes and appeals for which recognition is sought).</li>
                  <li style={{ listStyle: 'none', marginLeft: '-4px' }}>
                    vii) The applicant body, will from the date of signing of this application;
                    <ol style={{ marginTop: '6px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'lower-alpha' }}>
                      <li>Comply with the recognition criteria and the rules of the EIC.</li>
                      <li>Shall ensure that none of the acts of omission or commission of the applicant body will bring the recognition system to disrepute.</li>
                      <li>Shall ensure that it will not overstate its capabilities with respect to the scope for which it has applied for recognition.</li>
                      <li>Shall take appropriate corrective &amp; preventive actions on its conduct and issues that are identified by the EIC as contrary to the conditions of vii) a to vii) c.</li>
                    </ol>
                  </li>
                </ol>

                {/* Signature block */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '18px', paddingTop: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Name of Authorized Signatory <span style={{ color: '#EF4444' }}>*</span></label>
                      <input id="field-declarantName" value={declarantName} onChange={e => { setDeclarantName(e.target.value); setErrors(p => { const n = { ...p }; delete n.declarantName; return n; }); }} placeholder="Full name"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: errors.declarantName ? '1.5px solid #EF4444' : '1.5px solid rgba(59,130,246,0.35)', backgroundColor: errors.declarantName ? '#FFF5F5' : '#f0f9ff', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                      {errors.declarantName && <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.declarantName}</span>}
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Designation <span style={{ color: '#EF4444' }}>*</span></label>
                      <input id="field-declarantDesignation" value={declarantDesignation} onChange={e => { setDeclarantDesignation(e.target.value); setErrors(p => { const n = { ...p }; delete n.declarantDesignation; return n; }); }} placeholder="e.g. Managing Director"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: errors.declarantDesignation ? '1.5px solid #EF4444' : '1.5px solid rgba(59,130,246,0.35)', backgroundColor: errors.declarantDesignation ? '#FFF5F5' : '#f0f9ff', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                      {errors.declarantDesignation && <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.declarantDesignation}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Date <span style={{ color: '#EF4444' }}>*</span></label>
                      <input id="field-declarantDate" type="date" value={declarantDate} onChange={e => { setDeclarantDate(e.target.value); setErrors(p => { const n = { ...p }; delete n.declarantDate; return n; }); }}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: errors.declarantDate ? '1.5px solid #EF4444' : '1.5px solid rgba(59,130,246,0.35)', backgroundColor: errors.declarantDate ? '#FFF5F5' : '#f0f9ff', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                      {errors.declarantDate && <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.declarantDate}</span>}
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Place <span style={{ color: '#EF4444' }}>*</span></label>
                      <input id="field-declarantPlace" value={declarantPlace} onChange={e => { setDeclarantPlace(e.target.value); setErrors(p => { const n = { ...p }; delete n.declarantPlace; return n; }); }} placeholder="City / Location"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: errors.declarantPlace ? '1.5px solid #EF4444' : '1.5px solid rgba(59,130,246,0.35)', backgroundColor: errors.declarantPlace ? '#FFF5F5' : '#f0f9ff', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                      {errors.declarantPlace && <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.declarantPlace}</span>}
                    </div>
                  </div>
                  {/* Signature placeholder */}
                  <div style={{ gridColumn: '2', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <div style={{ width: '180px', height: '56px', borderBottom: '1.5px solid #1D4ED8', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                      {declarantName && <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)' }}>{declarantName}</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Signature of Authorized Signatory</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Designation and seal</span>
                  </div>
                </div>
              </div>

              {/* Acceptance checkbox */}
              <div style={{ padding: '14px 24px 18px', borderTop: `1px solid ${errors.declarationAccepted ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.05)'}`, backgroundColor: declarationAccepted ? 'rgba(34,197,94,0.05)' : errors.declarationAccepted ? 'rgba(239,68,68,0.04)' : 'rgba(59,130,246,0.03)' }}>
                <label id="field-declarationAccepted" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={declarationAccepted} onChange={e => { setDeclarationAccepted(e.target.checked); setErrors(p => { const n = { ...p }; delete n.declarationAccepted; return n; }); }}
                    style={{ accentColor: '#16A34A', width: 16, height: 16, marginTop: '1px', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: declarationAccepted ? '#16A34A' : errors.declarationAccepted ? '#EF4444' : 'var(--text-primary)', lineHeight: 1.5 }}>
                    I/We have read, understood and accept the above declaration. I/We confirm that all information furnished in this application and documents enclosed is true, complete and correct to the best of my/our knowledge.
                  </span>
                </label>
                {errors.declarationAccepted && <p style={{ margin: '8px 0 0 26px', fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.declarationAccepted}</p>}
              </div>
            </div>
          </div>
        </div>}

        {/* ═══ STEP 9: Fee Summary & Payment ═══ */}
        {step === 8 && (() => {
          const fee = (type: PIAFeeConfigItem['feeType']) => {
            const c = feeConfig.find(f => f.feeType === type);
            return { amount: c ? Number(c.amount) : 0, label: c?.label ?? type, configured: !!c && Number(c.amount) > 0 };
          };
          const appFee   = fee('APPLICATION_FEE');
          const portFee   = fee('ADDITIONAL_PORT_FEE');
          const extraPorts = Math.max(0, form.selectedPortIds.length - 1);

          const isNew = form.subType === 'NEW_RECOGNITION';
          const isRenewal = form.subType === 'RENEWAL';
          const dueNow = [
            { label: appFee.label, amount: appFee.amount, note: 'Non-refundable', configured: appFee.configured },
            ...(extraPorts > 0 ? [{ label: portFee.label, amount: portFee.amount * extraPorts, note: `${extraPorts} extra port${extraPorts > 1 ? 's' : ''} × Rs. ${portFee.amount.toLocaleString('en-IN')}`, configured: portFee.configured }] : []),
          ];
          const total = dueNow.reduce((s, r) => s + r.amount, 0);
          const anyUnconfigured = dueNow.some(r => !r.configured);
          const fmtStr = (n: number) => n > 0 ? `Rs. ${n.toLocaleString('en-IN')}.00` : '—';

          return <div style={STEP_CARD}>
            <SecHead num="Fee" title="Fee Summary & Payment" subtitle="Official EIC fee schedule — amounts are configured by admin" />

            {/* ── Full fee schedule from admin config ── */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complete Fee Schedule</p>
              <div style={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(59,130,246,0.07)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1e3a8a', borderBottom: '1px solid rgba(59,130,246,0.15)', width: '36px' }}>S.No.</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1e3a8a', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>Fee Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1e3a8a', borderBottom: '1px solid rgba(59,130,246,0.15)', whiteSpace: 'nowrap' }}>Amount</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1e3a8a', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { sno: 1, feeType: 'APPLICATION_FEE'    as const, remarks: 'Non-refundable' },
                      { sno: 2, feeType: 'INSPECTION_FEE'     as const, remarks: 'Plus travel and stay expenses of auditors at actual cost' },
                      { sno: 3, feeType: 'ANNUAL_FEE'         as const, remarks: 'To be paid in advance' },
                      { sno: 4, feeType: 'ADDITIONAL_PORT_FEE' as const, remarks: 'Per extra port beyond the default port (BR-002)' },
                    ] as { sno: number; feeType: PIAFeeConfigItem['feeType']; remarks: string }[]).map((row, i) => {
                      const c = feeConfig.find(f => f.feeType === row.feeType);
                      const configured = c && Number(c.amount) > 0;
                      return (
                        <tr key={row.sno} style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'rgba(59,130,246,0.02)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{row.sno}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text-primary)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{c?.label ?? row.feeType.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: configured ? '#1D4ED8' : '#F59E0B', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            {configured ? fmtStr(Number(c!.amount)) : 'Not configured'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{row.remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {anyUnconfigured && (
                <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '11px', color: '#92400E' }}>
                  ⚠ Some fees are not yet configured by the administrator. The total shown below may be incomplete. Please check with EIC before making payment.
                </div>
              )}
            </div>

            {/* ── Payable now ── */}
            <div style={{ borderRadius: '10px', border: `1.5px solid ${anyUnconfigured ? 'rgba(245,158,11,0.4)' : 'rgba(59,130,246,0.3)'}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', backgroundColor: anyUnconfigured ? 'rgba(245,158,11,0.07)' : 'rgba(59,130,246,0.07)', borderBottom: `1px solid ${anyUnconfigured ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)'}` }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Payable Now — {isNew ? 'New Recognition' : isRenewal ? 'Renewal' : 'Addition of Scope'}
                </p>
              </div>
              {dueNow.map((row, i) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < dueNow.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none', backgroundColor: '#fff' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{row.note}</p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: row.configured ? '#1D4ED8' : '#F59E0B' }}>
                    {row.configured ? fmtStr(row.amount) : 'Not configured'}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: anyUnconfigured ? 'rgba(245,158,11,0.07)' : 'rgba(29,78,216,0.07)', borderTop: `2px solid ${anyUnconfigured ? 'rgba(245,158,11,0.3)' : 'rgba(29,78,216,0.2)'}` }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>Total Amount Due</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: anyUnconfigured ? '#D97706' : '#1D4ED8' }}>
                  {total > 0 ? `Rs. ${total.toLocaleString('en-IN')}.00` : <span style={{ fontSize: '13px', color: '#F59E0B' }}>Pending configuration</span>}
                </span>
              </div>
            </div>

          </div>;
        })()}

        {/* ── Step navigation ── */}
        <div style={{ position: 'sticky', bottom: 0, zIndex: 20, backgroundColor: '#fff', borderTop: '1px solid rgba(0,0,0,0.05)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 16px rgba(0,0,0,0.03)' }}>
          <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : onBack()} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '7px',
            border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', margin: 0,
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {step === 0 ? 'Cancel' : 'Previous'}
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => doSave(true)} disabled={isSaving} style={{
              padding: '9px 20px', borderRadius: '7px', border: '1px solid #3B82F6',
              backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--grad-to)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>{isSaving ? 'Saving…' : 'Save Draft'}</button>
            {step < STEPS.length - 1
              ? (
                <button type="button" onClick={async () => {
                  const errs = validateStep(step, form, declarantName, declarantDesignation, declarantDate, declarantPlace, declarationAccepted);
                  if (Object.keys(errs).length > 0) { setErrors(errs); focusFirstError(errs); return; }
                  setErrors({}); await doSave(false); setStep(s => s + 1);
                }} disabled={isSaving} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '7px',
                  background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                  Save &amp; Next
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              )
              : (
                <button type="button" onClick={() => setShowSubmitConfirm(true)} disabled={isSaving} style={{
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

      {/* ══ Submission Confirmation Modal ══ */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: 420, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.20)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>Submit Application?</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>{appNo || 'New Application'}</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: '22px 24px' }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#92400E' }}>You will not be able to edit this application after submission.</p>
                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#B45309', lineHeight: 1.5 }}>Please review all information carefully before proceeding. After submission, you will be directed to complete the application fee payment.</p>
              </div>
              {saveError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{saveError}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowSubmitConfirm(false); setSaveError(''); }} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={doSubmit} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving
                    ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Submitting…</>
                    : <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Yes, Submit</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Post-Submit: Payment Required ══ */}
      {submittedApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.60)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 520, maxWidth: '95vw', maxHeight: '92vh', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 28px 80px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #1E40AF 60%, #2563EB 100%)', padding: '24px 28px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Application Submitted Successfully</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Complete payment to proceed with your application</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px' }}>
                  <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Application No.</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#fff', fontWeight: 800, fontFamily: 'monospace' }}>{submittedApp.appNo}</p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px' }}>
                  <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#86EFAC', fontWeight: 700 }}>Submitted</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>

              {!paymentDone ? (
                <>
                  {/* Info notice */}
                  <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Application Fee Payment Required</p>
                    <p style={{ margin: '5px 0 0', fontSize: 12, color: '#3B82F6', lineHeight: 1.5 }}>Your application has been submitted. Please complete the application fee payment to enable EIA review. Choose your preferred payment method below.</p>
                  </div>

                  {/* Fee summary */}
                  {feeConfig.length > 0 && (() => {
                    const appFeeConf  = feeConfig.find(f => f.feeType === 'APPLICATION_FEE');
                    const portFeeConf = feeConfig.find(f => f.feeType === 'ADDITIONAL_PORT_FEE');
                    const appAmt  = appFeeConf  ? Number(appFeeConf.amount)  : 0;
                    const portAmt = portFeeConf ? Number(portFeeConf.amount) : 0;
                    const extraPorts = Math.max(0, form.selectedPortIds.length - 1);
                    const portTotal  = portAmt * extraPorts;
                    const total      = appAmt + portTotal;
                    const subTypeNote = form.subType === 'NEW_RECOGNITION' ? 'New Recognition' : form.subType === 'RENEWAL' ? 'Renewal' : 'Modification';
                    const fmtAmt = (n: number) => `Rs. ${n.toLocaleString('en-IN')}.00`;
                    return total > 0 ? (
                      <div style={{ borderRadius: 10, border: '1px solid #E0E8FF', overflow: 'hidden' }}>
                        {/* Application fee row */}
                        <div style={{ padding: '12px 18px', backgroundColor: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1B2A6B' }}>{appFeeConf?.label ?? 'Application Processing Fee'}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>Non-refundable · {subTypeNote}</p>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>{fmtAmt(appAmt)}</span>
                        </div>
                        {/* Additional port fee row (only if applicable) */}
                        {extraPorts > 0 && portAmt > 0 && (
                          <div style={{ padding: '10px 18px', backgroundColor: '#fff', borderTop: '1px solid #E0E8FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>{portFeeConf?.label ?? 'Additional Port Fee'}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>{extraPorts} extra port{extraPorts > 1 ? 's' : ''} × {fmtAmt(portAmt)}</p>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>{fmtAmt(portTotal)}</span>
                          </div>
                        )}
                        {/* Total row */}
                        <div style={{ padding: '12px 18px', backgroundColor: 'rgba(29,78,216,0.06)', borderTop: '2px solid rgba(29,78,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>Total Amount Due</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#1D4ED8' }}>{fmtAmt(total)}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Option 1 — UTR / Bank Reference */}
                  <div style={{ borderRadius: 12, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', backgroundColor: '#F8FAFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1B2A6B' }}>Pay via Bank Transfer / DD / NEFT</p>
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#6B7280' }}>Enter your UTR / Transaction / DD reference number after payment</p>
                      </div>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 12, fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>
                        <strong>Bank Details:</strong> Pay to EIC A/c No. 1234567890 · IFSC: SBIN0012345 · State Bank of India, Kolkata
                      </div>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={e => { setPaymentRef(e.target.value); setPaymentError(''); }}
                        placeholder="e.g. UTR123456789012 or DD No. / NEFT Ref."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: `1.5px solid ${paymentRef ? '#3B82F6' : '#D1D5DB'}`, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                      />
                      {paymentError && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{paymentError}</p>}
                      <button
                        type="button"
                        disabled={isPayingRef || !paymentRef.trim()}
                        onClick={async () => {
                          if (!paymentRef.trim()) { setPaymentError('Please enter the transaction reference number.'); return; }
                          setIsPayingRef(true); setPaymentError('');
                          try {
                            await piaApi.recordPayment(submittedApp.id, paymentRef.trim());
                            setPaymentDone(true);
                          } catch (err: any) {
                            setPaymentError(err?.response?.data?.message ?? 'Failed to record payment. Please try again.');
                          } finally { setIsPayingRef(false); }
                        }}
                        style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: (!paymentRef.trim() || isPayingRef) ? '#E5E7EB' : 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', color: (!paymentRef.trim() || isPayingRef) ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: (!paymentRef.trim() || isPayingRef) ? 'not-allowed' : 'pointer' }}
                      >
                        {isPayingRef ? 'Recording Payment…' : 'Confirm Payment'}
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                  </div>

                  {/* Option 2 — Online Payment */}
                  <div style={{ borderRadius: 12, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', backgroundColor: '#F0FDF4', borderBottom: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#065F46' }}>Pay Online</p>
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#6B7280' }}>Secure payment gateway — UPI, Net Banking, Debit/Credit Card</p>
                      </div>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`https://pay.eic.gov.in/?ref=${submittedApp.appNo}`, '_blank')}
                        style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Proceed to Payment Gateway
                      </button>
                      <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>After completing payment at the gateway, return here and enter your transaction reference above to confirm.</p>
                    </div>
                  </div>

                  {/* Skip for now */}
                  <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textAlign: 'center', padding: '4px 0' }}>
                    Complete payment later — Go to Dashboard
                  </button>
                </>
              ) : (
                /* ── Payment Confirmed State ── */
                <>
                  <div style={{ padding: '18px 20px', borderRadius: 12, backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#D1FAE5', border: '2px solid #6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <svg width="20" height="20" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#065F46' }}>Payment Recorded Successfully</p>
                      <p style={{ margin: '5px 0 0', fontSize: 12, color: '#059669', lineHeight: 1.5 }}>Your payment reference has been recorded. Your application is now under review by the concerned EIA office.</p>
                    </div>
                  </div>

                  {/* Payment Receipt */}
                  <div style={{ borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', backgroundColor: '#F8FAFF', borderBottom: '1px solid #E5E7EB' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#1B2A6B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Receipt</p>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                      {[
                        { label: 'Application No.',  value: submittedApp.appNo, mono: true },
                        { label: 'Organisation',      value: submittedApp.organisation },
                        { label: 'Payment Type',      value: 'Application Processing Fee' },
                        { label: 'Payment Method',    value: 'Bank Transfer / UTR' },
                        { label: 'Reference No.',     value: paymentRef, mono: true },
                        { label: 'Date',              value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: f.mono ? 'monospace' : undefined }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8', lineHeight: 1.5 }}>
                    <strong>Next Steps:</strong> The EIA office will review your application and payment. You will be notified about the status. You can track your application from the Dashboard.
                  </div>

                  <button
                    type="button"
                    onClick={onBack}
                    style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Go to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
