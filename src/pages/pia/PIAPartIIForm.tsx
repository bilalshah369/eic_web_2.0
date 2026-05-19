import { useState, useEffect, useCallback, useRef } from 'react';
import {
  piaApi, PIAApplicationFull, PIAPortMaster, PIAMineralMaster,
  ManpowerRow, LabManpowerRow, MineralScopeRow, LabEquipmentRow, LabProductRow,
} from '../../services/pia.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const QMS_OPTIONS = [
  { value: 'ISO_17020', label: 'ISO/IEC 17020 (Inspection Bodies)' },
  { value: 'ISO_9001',  label: 'ISO 9001 (Quality Management)' },
  { value: 'BOTH',      label: 'Both ISO 17020 & ISO 9001' },
];

const EMPTY_MANPOWER:   ManpowerRow    = { isSeniorMgmt: false, name: '', designation: '', qualification: '', experienceYears: '', specialization: '' };
const EMPTY_LAB_MP:     LabManpowerRow = { isSeniorMgmt: false, name: '', designation: '', qualification: '', experienceYears: '' };
const EMPTY_EQUIPMENT:  LabEquipmentRow = { name: '', make: '', model: '', serialNo: '', rangeCapacity: '', calibrationDueDate: '' };
const EMPTY_LAB_PRODUCT: LabProductRow = { productName: '', testParameters: '', testMethods: '' };

const LAB_ACCREDITATION_OPTIONS = [
  { value: 'NABL_ISO17025', label: 'NABL — ISO/IEC 17025 (Testing & Calibration)' },
  { value: 'NABL_ISO17020', label: 'NABL — ISO/IEC 17020 (Inspection)' },
  { value: 'BIS',           label: 'BIS Certified Laboratory' },
  { value: 'OTHER',         label: 'Other Accreditation' },
];

interface PartIIState {
  seniorMgmtCount: string;
  inspectingStaffCount: string;
  qmsImplemented: boolean;
  qmsType: string;
  isAccredited: boolean;
  accreditationScope: string;
  accreditationBody: string;
  consultancyDetails: string;
  hasDomesticExperience: boolean;
  hasExportExperience: boolean;
  hasLaboratory: boolean;
  hasLabAccreditation: boolean;
  labAccreditationType: string;
  labAccreditationScope: string;
  labConsultancyDetails: string;
  hasOtherActivities: boolean;       otherActivitiesDetails: string;
  hasLinkedOrganization: boolean;    linkedOrgDetails: string;
  hasRelatedActivities: boolean;     relatedActivitiesDetails: string;
  hasDisputesWithClients: boolean;   disputesDetails: string;
  hasCriminalProceedings: boolean;   criminalProceedingsDetails: string;
  selectedPortIds: string[];
  mineralScopes: MineralScopeRow[];
  manpower: ManpowerRow[];
  labManpower: LabManpowerRow[];
  labEquipment: LabEquipmentRow[];
  labProducts: LabProductRow[];
}

const EMPTY_STATE: PartIIState = {
  seniorMgmtCount: '', inspectingStaffCount: '',
  qmsImplemented: false, qmsType: '',
  isAccredited: false, accreditationScope: '', accreditationBody: '', consultancyDetails: '',
  hasDomesticExperience: false, hasExportExperience: false,
  hasLaboratory: false, hasLabAccreditation: false, labAccreditationType: '', labAccreditationScope: '', labConsultancyDetails: '',
  hasOtherActivities: false,    otherActivitiesDetails: '',
  hasLinkedOrganization: false, linkedOrgDetails: '',
  hasRelatedActivities: false,  relatedActivitiesDetails: '',
  hasDisputesWithClients: false, disputesDetails: '',
  hasCriminalProceedings: false, criminalProceedingsDetails: '',
  selectedPortIds: [],
  mineralScopes: [],
  manpower: [],
  labManpower: [],
  labEquipment: [],
  labProducts: [],
};

function stateFromApp(app: PIAApplicationFull): PartIIState {
  const p = app.piaApplication!;
  return {
    seniorMgmtCount:      p.seniorMgmtCount      != null ? String(p.seniorMgmtCount)      : '',
    inspectingStaffCount: p.inspectingStaffCount  != null ? String(p.inspectingStaffCount)  : '',
    qmsImplemented:    p.qmsImplemented,
    qmsType:           p.qmsType ?? '',
    isAccredited:      p.isAccredited,
    accreditationScope: p.accreditationScope ?? '',
    accreditationBody:  p.accreditationBody  ?? '',
    consultancyDetails: p.consultancyDetails  ?? '',
    hasDomesticExperience: p.hasDomesticExperience,
    hasExportExperience:   p.hasExportExperience,
    hasLaboratory:         p.hasLaboratory,
    hasLabAccreditation:   p.hasLabAccreditation,
    labAccreditationType:  p.labAccreditationType  ?? '',
    labAccreditationScope: p.labAccreditationScope ?? '',
    labConsultancyDetails: p.labConsultancyDetails  ?? '',
    hasOtherActivities:       p.hasOtherActivities,       otherActivitiesDetails:   p.otherActivitiesDetails   ?? '',
    hasLinkedOrganization:    p.hasLinkedOrganization,    linkedOrgDetails:         p.linkedOrgDetails         ?? '',
    hasRelatedActivities:     p.hasRelatedActivities,     relatedActivitiesDetails: p.relatedActivitiesDetails ?? '',
    hasDisputesWithClients:   p.hasDisputesWithClients,   disputesDetails:          p.disputesDetails          ?? '',
    hasCriminalProceedings:   p.hasCriminalProceedings,   criminalProceedingsDetails: p.criminalProceedingsDetails ?? '',
    selectedPortIds: p.ports?.map(pp => pp.port.id) ?? [],
    mineralScopes:   p.scopes?.map(s => ({ mineralOreId: s.mineralOre.id, specifications: s.specifications ?? '' })) ?? [],
    manpower:   p.inspectionManpower?.map(m => ({
      isSeniorMgmt: m.isSeniorMgmt, name: m.name, designation: m.designation,
      qualification: m.qualification ?? '', experienceYears: m.experienceYears != null ? String(m.experienceYears) : '', specialization: m.specialization ?? '',
    })) ?? [],
    labManpower: p.labManpower?.map(m => ({
      isSeniorMgmt: m.isSeniorMgmt, name: m.name, designation: m.designation,
      qualification: m.qualification ?? '', experienceYears: m.experienceYears != null ? String(m.experienceYears) : '',
    })) ?? [],
    labEquipment: p.labEquipment?.map(e => ({
      name: e.name, make: e.make ?? '', model: e.model ?? '',
      serialNo: e.serialNo ?? '', rangeCapacity: e.rangeCapacity ?? '', calibrationDueDate: e.calibrationDueDate ?? '',
    })) ?? [],
    labProducts: p.labProducts?.map(p => ({
      productName: p.productName, testParameters: p.testParameters ?? '', testMethods: p.testMethods ?? '',
    })) ?? [],
  };
}

function calcCompletion(s: PartIIState): number {
  let done = 0; const total = 5;
  if (s.selectedPortIds.length > 0) done++;
  if (s.mineralScopes.length > 0) done++;
  if (s.manpower.length > 0) done++;
  if (s.seniorMgmtCount && s.inspectingStaffCount) done++;
  if (s.qmsImplemented || s.qmsType === '') done++; // answered QMS
  return Math.round((done / total) * 100);
}

// ─── UI primitives ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '8px 11px', borderRadius: '6px', border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

function Field({ label, required, hint, span, children }: { label: string; required?: boolean; hint?: string; span?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: span ? `span ${span}` : undefined }}>
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

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />;
}

function Toggle({ value, onChange, labelOn = 'Yes', labelOff = 'No' }: { value: boolean; onChange: (v: boolean) => void; labelOn?: string; labelOff?: string }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[true, false].map(opt => (
        <button key={String(opt)} onClick={() => onChange(opt)} style={{
          padding: '6px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${value === opt ? '#8B5CF6' : 'var(--border-subtle)'}`,
          backgroundColor: value === opt ? 'rgba(139,92,246,0.12)' : 'transparent',
          color: value === opt ? '#8B5CF6' : 'var(--text-muted)',
          transition: 'all 0.15s',
        }}>{opt ? labelOn : labelOff}</button>
      ))}
    </div>
  );
}

function SectionHeader({ num, title, subtitle }: { num: string; title: string; subtitle?: string }) {
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

function DeclarationRow({ label, value, onChange, children }: { label: string; value: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
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
  appNo: string;
  onBack: () => void;
  onBackToPartI: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PIAPartIIForm({ applicationId, appNo, onBack, onBackToPartI }: Props) {
  const [form, setForm]         = useState<PartIIState>(EMPTY_STATE);
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
    ]).then(([app, p, m]) => {
      setForm(stateFromApp(app));
      setPorts(p);
      setMinerals(m);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [applicationId]);

  useEffect(() => {
    if (!isDirty || isLoading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => handleSave(false), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, isDirty, isLoading]);

  const set = useCallback(<K extends keyof PartIIState>(key: K, value: PartIIState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true); setSaveError('');
  }, []);

  const buildPayload = () => ({
    seniorMgmtCount:      form.seniorMgmtCount      ? parseInt(form.seniorMgmtCount)      : null,
    inspectingStaffCount: form.inspectingStaffCount  ? parseInt(form.inspectingStaffCount)  : null,
    qmsImplemented: form.qmsImplemented, qmsType: form.qmsType || null,
    isAccredited: form.isAccredited, accreditationScope: form.accreditationScope, accreditationBody: form.accreditationBody,
    consultancyDetails: form.consultancyDetails,
    hasDomesticExperience: form.hasDomesticExperience, hasExportExperience: form.hasExportExperience,
    hasLaboratory: form.hasLaboratory, hasLabAccreditation: form.hasLabAccreditation,
    labAccreditationType: form.labAccreditationType, labAccreditationScope: form.labAccreditationScope, labConsultancyDetails: form.labConsultancyDetails,
    hasOtherActivities: form.hasOtherActivities,       otherActivitiesDetails: form.otherActivitiesDetails,
    hasLinkedOrganization: form.hasLinkedOrganization, linkedOrgDetails: form.linkedOrgDetails,
    hasRelatedActivities: form.hasRelatedActivities,   relatedActivitiesDetails: form.relatedActivitiesDetails,
    hasDisputesWithClients: form.hasDisputesWithClients, disputesDetails: form.disputesDetails,
    hasCriminalProceedings: form.hasCriminalProceedings, criminalProceedingsDetails: form.criminalProceedingsDetails,
    portIds: form.selectedPortIds,
    mineralScopes: form.mineralScopes,
    manpower: form.manpower,
    labManpower: form.labManpower,
    labEquipment: form.labEquipment,
    labProducts: form.labProducts,
  });

  const handleSave = useCallback(async (showFeedback = true) => {
    if (isSaving) return;
    setIsSaving(true); setSaveError('');
    try {
      await piaApi.savePartII(applicationId, buildPayload());
      setIsDirty(false); setLastSaved(new Date());
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Save failed. Please try again.');
    } finally { setIsSaving(false); }
  }, [applicationId, form, isSaving]);

  const togglePort = (id: string) => {
    set('selectedPortIds', form.selectedPortIds.includes(id)
      ? form.selectedPortIds.filter(p => p !== id)
      : [...form.selectedPortIds, id]);
  };

  const toggleMineral = (id: string) => {
    if (form.mineralScopes.some(s => s.mineralOreId === id)) {
      set('mineralScopes', form.mineralScopes.filter(s => s.mineralOreId !== id));
    } else {
      set('mineralScopes', [...form.mineralScopes, { mineralOreId: id, specifications: '' }]);
    }
  };

  const updateMineralSpec = (id: string, spec: string) => {
    set('mineralScopes', form.mineralScopes.map(s => s.mineralOreId === id ? { ...s, specifications: spec } : s));
  };

  const updateManpower = (idx: number, key: keyof ManpowerRow, val: string | boolean) => {
    set('manpower', form.manpower.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const updateLabManpower = (idx: number, key: keyof LabManpowerRow, val: string | boolean) => {
    set('labManpower', form.labManpower.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const updateEquipment = (idx: number, key: keyof LabEquipmentRow, val: string) => {
    set('labEquipment', form.labEquipment.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const updateLabProduct = (idx: number, key: keyof LabProductRow, val: string) => {
    set('labProducts', form.labProducts.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const completion = calcCompletion(form);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px' }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6', borderRadius: '50%' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>PIA Recognition Application</span>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>{appNo}</span>
          </div>
          {/* Part tabs */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            <button onClick={onBackToPartI} style={{ padding: '4px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Part I</button>
            <button style={{ padding: '4px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, border: '1px solid #8B5CF6', backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6', cursor: 'default' }}>Part II</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 80, height: 5, borderRadius: '4px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completion}%`, backgroundColor: completion === 100 ? '#10B981' : '#8B5CF6', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{completion}% complete</span>
          </div>
          <span style={{ fontSize: '11px', color: saveError ? '#EF4444' : 'var(--text-muted)' }}>
            {saveError || (isSaving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : isDirty ? 'Unsaved changes' : '')}
          </span>
          <button onClick={() => handleSave(true)} disabled={isSaving || !isDirty} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '7px',
            backgroundColor: isDirty ? 'rgba(139,92,246,0.15)' : 'transparent',
            border: `1px solid ${isDirty ? '#8B5CF6' : 'var(--border-subtle)'}`,
            color: isDirty ? '#8B5CF6' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600,
            cursor: isSaving ? 'wait' : 'pointer', opacity: !isDirty ? 0.5 : 1,
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Save Draft
          </button>
        </div>
      </div>

      {/* ── Form body ── */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── S1: Inspection Manpower ── */}
        <div>
          <SectionHeader num="1" title="Inspection Division — Manpower" subtitle="Staff count and individual details (Annexure-4 of SRS)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Grid cols={2}>
              <Field label="Senior Management Count" required hint="Number of senior management personnel">
                <TextInput value={form.seniorMgmtCount} onChange={v => set('seniorMgmtCount', v)} placeholder="e.g. 2" type="number" />
              </Field>
              <Field label="Inspecting Staff Count" required hint="Total number of inspection personnel">
                <TextInput value={form.inspectingStaffCount} onChange={v => set('inspectingStaffCount', v)} placeholder="e.g. 10" type="number" />
              </Field>
            </Grid>

            {/* Manpower table */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 10px' }}>Individual Staff Details</p>
              {form.manpower.length === 0 && (
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No staff added. Click "Add Staff" to enter individual details.
                </div>
              )}
              {form.manpower.map((row, idx) => (
                <div key={idx} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Staff #{idx + 1}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <input type="checkbox" checked={row.isSeniorMgmt} onChange={e => updateManpower(idx, 'isSeniorMgmt', e.target.checked)} style={{ accentColor: '#8B5CF6' }} />
                        Senior Management
                      </label>
                    </div>
                    <button onClick={() => set('manpower', form.manpower.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <Field label="Full Name" required><TextInput value={row.name} onChange={v => updateManpower(idx, 'name', v)} placeholder="Name" /></Field>
                    <Field label="Designation" required><TextInput value={row.designation} onChange={v => updateManpower(idx, 'designation', v)} placeholder="e.g. Inspector" /></Field>
                    <Field label="Qualification"><TextInput value={row.qualification} onChange={v => updateManpower(idx, 'qualification', v)} placeholder="e.g. B.Sc." /></Field>
                    <Field label="Experience (years)"><TextInput value={row.experienceYears} onChange={v => updateManpower(idx, 'experienceYears', v)} placeholder="Years" type="number" /></Field>
                    <Field label="Specialization" span={2}><TextInput value={row.specialization} onChange={v => updateManpower(idx, 'specialization', v)} placeholder="Area of specialization" /></Field>
                  </div>
                </div>
              ))}
              <button onClick={() => set('manpower', [...form.manpower, { ...EMPTY_MANPOWER }])} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px',
                border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
              }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Staff Member
              </button>
            </div>
          </div>
        </div>

        {/* ── S2: QMS ── */}
        <div>
          <SectionHeader num="2" title="Quality Management System (QMS)" subtitle="ISO/IEC 17020 accreditation and quality certifications" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Has the agency implemented a QMS?" required>
              <Toggle value={form.qmsImplemented} onChange={v => set('qmsImplemented', v)} />
            </Field>
            {form.qmsImplemented && (
              <Field label="Type of QMS Certification" required hint="Select the applicable certification standard">
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {QMS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => set('qmsType', opt.value)} style={{
                      padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${form.qmsType === opt.value ? '#8B5CF6' : 'var(--border-subtle)'}`,
                      backgroundColor: form.qmsType === opt.value ? 'rgba(139,92,246,0.12)' : 'transparent',
                      color: form.qmsType === opt.value ? '#8B5CF6' : 'var(--text-secondary)',
                    }}>{opt.label}</button>
                  ))}
                </div>
              </Field>
            )}
            <Field label="Is the agency accredited to ISO/IEC 17020?" required hint="Accreditation by NABL or other recognized body">
              <Toggle value={form.isAccredited} onChange={v => set('isAccredited', v)} />
            </Field>
            {form.isAccredited && (
              <Grid cols={2}>
                <Field label="Accreditation Body" required><TextInput value={form.accreditationBody} onChange={v => set('accreditationBody', v)} placeholder="e.g. NABL, DAkkS" /></Field>
                <Field label="Scope of Accreditation"><TextInput value={form.accreditationScope} onChange={v => set('accreditationScope', v)} placeholder="Commodity scope" /></Field>
              </Grid>
            )}
            <Field label="Consultancy / Advisory involvement" hint="Any consultancy services provided — details if applicable">
              <TextArea value={form.consultancyDetails} onChange={v => set('consultancyDetails', v)} placeholder="Describe any consultancy involvement or leave blank" rows={2} />
            </Field>
          </div>
        </div>

        {/* ── S3: Experience ── */}
        <div>
          <SectionHeader num="3" title="Previous Experience" subtitle="Inspection experience in domestic and export sectors" />
          <Grid cols={2}>
            <Field label="Experience in domestic inspection?" required>
              <Toggle value={form.hasDomesticExperience} onChange={v => set('hasDomesticExperience', v)} />
            </Field>
            <Field label="Experience in export inspection?" required>
              <Toggle value={form.hasExportExperience} onChange={v => set('hasExportExperience', v)} />
            </Field>
          </Grid>
        </div>

        {/* ── S4: Port Selection (BR-001, BR-002) ── */}
        <div>
          <SectionHeader num="4" title="Port(s) of Operation" subtitle="Select ports where the agency intends to conduct inspections" />
          <div style={{ padding: '10px 0 8px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ color: '#F59E0B', fontWeight: 600 }}>Note:</span> First selected port is included in the base application fee (BR-001). Each additional port attracts an additional fee as per BR-002.
          </div>
          {ports.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
              No ports configured. Contact admin.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
              {ports.map((port, idx) => {
                const selected = form.selectedPortIds.includes(port.id);
                const isDefault = selected && form.selectedPortIds[0] === port.id;
                return (
                  <button key={port.id} onClick={() => togglePort(port.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`,
                    backgroundColor: selected ? 'rgba(139,92,246,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`,
                      backgroundColor: selected ? '#8B5CF6' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
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
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {form.selectedPortIds.length} port{form.selectedPortIds.length > 1 ? 's' : ''} selected
              {form.selectedPortIds.length > 1 && ` · ${form.selectedPortIds.length - 1} additional port fee(s) applicable`}
            </p>
          )}
        </div>

        {/* ── S5: Commodity Scope ── */}
        <div>
          <SectionHeader num="5" title="Commodity Scope (Minerals / Ores)" subtitle="Select the minerals and ores for which recognition is sought" />
          {minerals.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>No minerals configured. Contact admin.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {minerals.map(mineral => {
                const scope = form.mineralScopes.find(s => s.mineralOreId === mineral.id);
                const selected = !!scope;
                return (
                  <div key={mineral.id} style={{ borderRadius: '8px', border: `1px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`, backgroundColor: selected ? 'rgba(139,92,246,0.05)' : 'transparent', overflow: 'hidden', transition: 'all 0.15s' }}>
                    <button onClick={() => toggleMineral(mineral.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '4px', flexShrink: 0, border: `2px solid ${selected ? '#8B5CF6' : 'var(--border-subtle)'}`, backgroundColor: selected ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? '#8B5CF6' : 'var(--text-primary)' }}>{mineral.name}</span>
                        {mineral.code && <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>Code: {mineral.code}</span>}
                        {mineral.hsCode && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>HS: {mineral.hsCode}</span>}
                      </div>
                    </button>
                    {selected && (
                      <div style={{ padding: '0 14px 12px' }}>
                        <input
                          type="text"
                          value={scope!.specifications}
                          onChange={e => updateMineralSpec(mineral.id, e.target.value)}
                          placeholder="Specifications / grade / parameters (optional)"
                          style={{ ...inputStyle, fontSize: '12px' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── S6: Laboratory Capability ── */}
        <div>
          <SectionHeader num="6" title="Laboratory Capability" subtitle="In-house laboratory testing facilities, ISO/IEC 17025 accreditation, equipment list (Annexure-3) and products tested" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field label="Does the agency have an in-house laboratory?" required>
              <Toggle value={form.hasLaboratory} onChange={v => set('hasLaboratory', v)} />
            </Field>

            {form.hasLaboratory && (
              <>
                {/* ── 6a: Accreditation ── */}
                <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'rgba(139,92,246,0.03)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Accreditation</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Field label="Is the laboratory accredited?" required hint="e.g. NABL accreditation against ISO/IEC 17025">
                      <Toggle value={form.hasLabAccreditation} onChange={v => set('hasLabAccreditation', v)} />
                    </Field>
                    {form.hasLabAccreditation && (
                      <>
                        <Field label="Accreditation Type" required hint="Select the applicable accreditation standard">
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {LAB_ACCREDITATION_OPTIONS.map(opt => (
                              <button key={opt.value} onClick={() => set('labAccreditationType', opt.value)} style={{
                                padding: '7px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                border: `1px solid ${form.labAccreditationType === opt.value ? '#8B5CF6' : 'var(--border-subtle)'}`,
                                backgroundColor: form.labAccreditationType === opt.value ? 'rgba(139,92,246,0.12)' : 'transparent',
                                color: form.labAccreditationType === opt.value ? '#8B5CF6' : 'var(--text-secondary)',
                              }}>{opt.label}</button>
                            ))}
                          </div>
                        </Field>
                        <Field label="Scope of Lab Accreditation" hint="Parameters, commodities or test methods covered">
                          <TextInput value={form.labAccreditationScope} onChange={v => set('labAccreditationScope', v)} placeholder="e.g. Chemical analysis of iron ore, moisture content…" />
                        </Field>
                      </>
                    )}
                    <Field label="Lab Consultancy / Advisory" hint="Any consultancy services provided through the laboratory">
                      <TextArea value={form.labConsultancyDetails} onChange={v => set('labConsultancyDetails', v)} placeholder="Describe or leave blank" rows={2} />
                    </Field>
                  </div>
                </div>

                {/* ── 6b: Equipment List (Annexure-3) ── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Equipment List</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Annexure-3 — List all instruments and equipment available in the laboratory</p>
                    </div>
                    <button onClick={() => set('labEquipment', [...form.labEquipment, { ...EMPTY_EQUIPMENT }])} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Equipment
                    </button>
                  </div>
                  {form.labEquipment.length === 0 ? (
                    <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No equipment added. Click "Add Equipment" to list your laboratory instruments (Annexure-3).
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1.2fr 1.5fr 40px', gap: 0, backgroundColor: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--border-subtle)' }}>
                        {['Equipment / Instrument', 'Make', 'Model / Type', 'Serial No.', 'Range / Capacity', 'Calibration Due', ''].map((h, i) => (
                          <div key={i} style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</div>
                        ))}
                      </div>
                      {form.labEquipment.map((row, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1.2fr 1.5fr 40px', gap: 0, borderBottom: idx < form.labEquipment.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.name} onChange={e => updateEquipment(idx, 'name', e.target.value)} placeholder="e.g. Analytical Balance" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.make} onChange={e => updateEquipment(idx, 'make', e.target.value)} placeholder="Manufacturer" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.model} onChange={e => updateEquipment(idx, 'model', e.target.value)} placeholder="Model" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.serialNo} onChange={e => updateEquipment(idx, 'serialNo', e.target.value)} placeholder="Serial / ID" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.rangeCapacity} onChange={e => updateEquipment(idx, 'rangeCapacity', e.target.value)} placeholder="e.g. 0–220g" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.calibrationDueDate} onChange={e => updateEquipment(idx, 'calibrationDueDate', e.target.value)} placeholder="e.g. Mar 2026" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button onClick={() => set('labEquipment', form.labEquipment.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }} title="Remove">
                              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── 6c: Products Tested ── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Products / Commodities Tested</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>List products the laboratory tests along with parameters and test methods / standards</p>
                    </div>
                    <button onClick={() => set('labProducts', [...form.labProducts, { ...EMPTY_LAB_PRODUCT }])} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Product
                    </button>
                  </div>
                  {form.labProducts.length === 0 ? (
                    <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No products added. Click "Add Product" to list commodities your lab tests.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 40px', gap: 0, backgroundColor: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--border-subtle)' }}>
                        {['Product / Commodity', 'Test Parameters', 'Test Methods / Standards', ''].map((h, i) => (
                          <div key={i} style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</div>
                        ))}
                      </div>
                      {form.labProducts.map((row, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 40px', gap: 0, borderBottom: idx < form.labProducts.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.productName} onChange={e => updateLabProduct(idx, 'productName', e.target.value)} placeholder="e.g. Iron Ore" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.testParameters} onChange={e => updateLabProduct(idx, 'testParameters', e.target.value)} placeholder="e.g. Fe content, moisture" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 8px' }}><input type="text" value={row.testMethods} onChange={e => updateLabProduct(idx, 'testMethods', e.target.value)} placeholder="e.g. IS 1179, ASTM E246" style={{ ...inputStyle, fontSize: '12px' }} /></div>
                          <div style={{ padding: '6px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button onClick={() => set('labProducts', form.labProducts.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }} title="Remove">
                              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── 6d: Lab Staff ── */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px' }}>Lab Staff Details</p>
                  {form.labManpower.length === 0 && (
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>
                      No lab staff added.
                    </div>
                  )}
                  {form.labManpower.map((row, idx) => (
                    <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Lab Staff #{idx + 1}</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <input type="checkbox" checked={row.isSeniorMgmt} onChange={e => updateLabManpower(idx, 'isSeniorMgmt', e.target.checked)} style={{ accentColor: '#8B5CF6' }} />
                            Senior
                          </label>
                        </div>
                        <button onClick={() => set('labManpower', form.labManpower.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px' }}>Remove</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        <Field label="Name" required><TextInput value={row.name} onChange={v => updateLabManpower(idx, 'name', v)} placeholder="Name" /></Field>
                        <Field label="Designation"><TextInput value={row.designation} onChange={v => updateLabManpower(idx, 'designation', v)} placeholder="Designation" /></Field>
                        <Field label="Qualification"><TextInput value={row.qualification} onChange={v => updateLabManpower(idx, 'qualification', v)} placeholder="e.g. M.Sc." /></Field>
                        <Field label="Experience (yrs)"><TextInput value={row.experienceYears} onChange={v => updateLabManpower(idx, 'experienceYears', v)} type="number" placeholder="Years" /></Field>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => set('labManpower', [...form.labManpower, { ...EMPTY_LAB_MP }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px', border: '1px dashed #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Lab Staff
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── S7: Declarations ── */}
        <div>
          <SectionHeader num="7" title="Declarations" subtitle="Answer all questions honestly. False declarations may lead to rejection." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DeclarationRow label="Does the agency carry out activities other than inspection (e.g. trading, manufacturing)?" value={form.hasOtherActivities} onChange={v => set('hasOtherActivities', v)}>
              <TextArea value={form.otherActivitiesDetails} onChange={v => set('otherActivitiesDetails', v)} placeholder="Describe other activities…" rows={2} />
            </DeclarationRow>
            <DeclarationRow label="Is the agency linked to any other organization (financial, managerial or otherwise)?" value={form.hasLinkedOrganization} onChange={v => set('hasLinkedOrganization', v)}>
              <TextArea value={form.linkedOrgDetails} onChange={v => set('linkedOrgDetails', v)} placeholder="Name and nature of linked organization…" rows={2} />
            </DeclarationRow>
            <DeclarationRow label="Does the agency have any related activities that may conflict with impartiality?" value={form.hasRelatedActivities} onChange={v => set('hasRelatedActivities', v)}>
              <TextArea value={form.relatedActivitiesDetails} onChange={v => set('relatedActivitiesDetails', v)} placeholder="Describe related activities…" rows={2} />
            </DeclarationRow>
            <DeclarationRow label="Has the agency had any disputes with clients regarding inspection services?" value={form.hasDisputesWithClients} onChange={v => set('hasDisputesWithClients', v)}>
              <TextArea value={form.disputesDetails} onChange={v => set('disputesDetails', v)} placeholder="Nature and outcome of disputes…" rows={2} />
            </DeclarationRow>
            <DeclarationRow label="Are there any criminal proceedings pending against the agency or its directors?" value={form.hasCriminalProceedings} onChange={v => set('hasCriminalProceedings', v)}>
              <TextArea value={form.criminalProceedingsDetails} onChange={v => set('criminalProceedingsDetails', v)} placeholder="Details of proceedings…" rows={2} />
            </DeclarationRow>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onBackToPartI} style={{ padding: '9px 18px', borderRadius: '7px', border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
            ← Back to Part I
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleSave(true)} disabled={isSaving} style={{ padding: '9px 20px', borderRadius: '7px', border: '1px solid #8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {isSaving ? 'Saving…' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '7px', backgroundColor: '#8B5CF6', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Save &amp; Proceed to Part III
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
