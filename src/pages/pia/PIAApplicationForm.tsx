import { useState, useEffect, useCallback, useRef } from 'react';
import { piaApi, PIABranchPayload, PIAPartIPayload, PIASubType, PIAApplicationFull } from '../../services/pia.service';

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
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
  { value: 'PARTNERSHIP',    label: 'Partnership Firm' },
  { value: 'LLP',            label: 'Limited Liability Partnership (LLP)' },
  { value: 'PRIVATE_LIMITED',label: 'Private Limited Company' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited Company' },
  { value: 'TRUST',          label: 'Trust' },
  { value: 'SOCIETY',        label: 'Society / Association' },
  { value: 'OTHER',          label: 'Other' },
];

const EMPTY_BRANCH: PIABranchPayload = {
  branchName: '', address: '', state: '', district: '', city: '',
  pincode: '', phone: '', email: '', headOfBranchName: '', headOfBranchDesignation: '',
};

interface FormState extends PIAPartIPayload {
  agencyName: string;
  subType: PIASubType;
}

const EMPTY_FORM: FormState = {
  subType: 'NEW_RECOGNITION',
  agencyName: '',
  agencyNameHindi: '',
  headOfficeAddress: '',
  headOfficeState: '',
  headOfficeDistrict: '',
  headOfficeCity: '',
  headOfficePincode: '',
  headOfficeCountry: 'India',
  headOfficePhone: '',
  headOfficeFax: '',
  headOfficeEmail: '',
  headOfOrgName: '',
  headOfOrgDesignation: '',
  headOfOrgContact: '',
  legalStatus: '',
  legalStatusDetails: '',
  inspectionDivHeadName: '',
  inspectionDivHeadDesignation: '',
  inspectionDivPhone: '',
  inspectionDivEmail: '',
  labDivHeadName: '',
  labDivHeadDesignation: '',
  labDivPhone: '',
  labDivEmail: '',
  branches: [],
};

function formFromApp(app: PIAApplicationFull): FormState {
  const p = app.piaApplication!;
  return {
    subType: p.subType,
    agencyName: app.organisation,
    agencyNameHindi: p.agencyNameHindi ?? '',
    headOfficeAddress: p.headOfficeAddress ?? '',
    headOfficeState: p.headOfficeState ?? '',
    headOfficeDistrict: p.headOfficeDistrict ?? '',
    headOfficeCity: p.headOfficeCity ?? '',
    headOfficePincode: p.headOfficePincode ?? '',
    headOfficeCountry: p.headOfficeCountry ?? 'India',
    headOfficePhone: p.headOfficePhone ?? '',
    headOfficeFax: p.headOfficeFax ?? '',
    headOfficeEmail: p.headOfficeEmail ?? '',
    headOfOrgName: p.headOfOrgName ?? '',
    headOfOrgDesignation: p.headOfOrgDesignation ?? '',
    headOfOrgContact: p.headOfOrgContact ?? '',
    legalStatus: p.legalStatus ?? '',
    legalStatusDetails: p.legalStatusDetails ?? '',
    inspectionDivHeadName: p.inspectionDivHeadName ?? '',
    inspectionDivHeadDesignation: p.inspectionDivHeadDesignation ?? '',
    inspectionDivPhone: p.inspectionDivPhone ?? '',
    inspectionDivEmail: p.inspectionDivEmail ?? '',
    labDivHeadName: p.labDivHeadName ?? '',
    labDivHeadDesignation: p.labDivHeadDesignation ?? '',
    labDivPhone: p.labDivPhone ?? '',
    labDivEmail: p.labDivEmail ?? '',
    branches: p.branches?.map(b => ({
      branchName: b.branchName,
      address: b.address ?? '',
      state: b.state ?? '',
      district: b.district ?? '',
      city: b.city ?? '',
      pincode: b.pincode ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      headOfBranchName: b.headOfBranchName ?? '',
      headOfBranchDesignation: b.headOfBranchDesignation ?? '',
    })) ?? [],
  };
}

// ─── Completion calculator ────────────────────────────────────────────────────

function calcCompletion(f: FormState): number {
  const requiredFields: (keyof FormState)[] = [
    'agencyName', 'headOfficeAddress', 'headOfficeState', 'headOfficeCity',
    'headOfficePincode', 'headOfficePhone', 'headOfficeEmail',
    'headOfOrgName', 'headOfOrgDesignation', 'headOfOrgContact', 'legalStatus',
  ];
  const filled = requiredFields.filter(k => String(f[k] ?? '').trim().length > 0).length;
  return Math.round((filled / requiredFields.length) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 11px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function TextInput({
  value, onChange, placeholder, disabled,
}: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
    />
  );
}

function EmailInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="email" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} style={inputStyle} />
  );
}

function PhoneInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="tel" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} style={inputStyle} />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
  );
}

function Select({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: 'pointer' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionHeader({ num, title, subtitle }: { num: string; title: string; subtitle?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
        backgroundColor: 'rgba(139,92,246,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, color: '#8B5CF6',
      }}>{num}</div>
      <div>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px' }}>
      {children}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

interface Props {
  applicationId: string;
  onBack: () => void;
  onSaved?: (app: PIAApplicationFull) => void;
  onProceedToPartII?: () => void;
}

export default function PIAApplicationForm({ applicationId, onBack, onSaved, onProceedToPartII }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [appNo, setAppNo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load application data
  useEffect(() => {
    piaApi.getById(applicationId).then(app => {
      setForm(formFromApp(app));
      setAppNo(app.appNo);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [applicationId]);

  // Auto-save after 3s of inactivity
  useEffect(() => {
    if (!isDirty || isLoading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => handleSave(false), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, isDirty, isLoading]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveError('');
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, [errors]);

  const handleSave = useCallback(async (showFeedback = true) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const saved = await piaApi.savePartI(applicationId, form);
      setIsDirty(false);
      setLastSaved(new Date());
      if (showFeedback) onSaved?.(saved);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, form, isSaving]);

  const handleProceedToPartII = useCallback(async () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.agencyName?.trim())          errs.agencyName = 'Required';
    if (!form.headOfficeAddress?.trim())   errs.headOfficeAddress = 'Required';
    if (!form.headOfficeState)             errs.headOfficeState = 'Required';
    if (!form.headOfficeCity?.trim())      errs.headOfficeCity = 'Required';
    if (!form.headOfficePincode?.trim())   errs.headOfficePincode = 'Required';
    if (!form.headOfficePhone?.trim())     errs.headOfficePhone = 'Required';
    if (!form.headOfficeEmail?.trim())     errs.headOfficeEmail = 'Required';
    if (!form.headOfOrgName?.trim())       errs.headOfOrgName = 'Required';
    if (!form.headOfOrgDesignation?.trim())errs.headOfOrgDesignation = 'Required';
    if (!form.headOfOrgContact?.trim())    errs.headOfOrgContact = 'Required';
    if (!form.legalStatus)                 errs.legalStatus = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (isSaving) return;
    setIsSaving(true); setSaveError('');
    try {
      const saved = await piaApi.savePartI(applicationId, form);
      setIsDirty(false); setLastSaved(new Date());
      onSaved?.(saved);
      onProceedToPartII?.();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Save failed. Please try again.');
    } finally { setIsSaving(false); }
  }, [applicationId, form, isSaving, onProceedToPartII]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.agencyName?.trim())          errs.agencyName = 'Required';
    if (!form.headOfficeAddress?.trim())   errs.headOfficeAddress = 'Required';
    if (!form.headOfficeState)             errs.headOfficeState = 'Required';
    if (!form.headOfficeCity?.trim())      errs.headOfficeCity = 'Required';
    if (!form.headOfficePincode?.trim())   errs.headOfficePincode = 'Required';
    if (!form.headOfficePhone?.trim())     errs.headOfficePhone = 'Required';
    if (!form.headOfficeEmail?.trim())     errs.headOfficeEmail = 'Required';
    if (!form.headOfOrgName?.trim())       errs.headOfOrgName = 'Required';
    if (!form.headOfOrgDesignation?.trim())errs.headOfOrgDesignation = 'Required';
    if (!form.headOfOrgContact?.trim())    errs.headOfOrgContact = 'Required';
    if (!form.legalStatus)                 errs.legalStatus = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const completion = calcCompletion(form);

  const updateBranch = (idx: number, key: keyof PIABranchPayload, val: string) => {
    const updated = (form.branches ?? []).map((b, i) => i === idx ? { ...b, [key]: val } : b);
    setField('branches', updated);
  };
  const addBranch = () => setField('branches', [...(form.branches ?? []), { ...EMPTY_BRANCH }]);
  const removeBranch = (idx: number) => setField('branches', (form.branches ?? []).filter((_, i) => i !== idx));

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '12px' }}>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading application…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: '8px 8px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '12px', padding: 0,
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span style={{ color: 'var(--border-subtle)', fontSize: '14px' }}>|</span>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              PIA Recognition Application
            </span>
            <span style={{
              marginLeft: '10px', fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '4px',
              backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6',
            }}>{appNo}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Completion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 80, height: 5, borderRadius: '4px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completion}%`, backgroundColor: completion === 100 ? '#10B981' : '#8B5CF6', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{completion}% complete</span>
          </div>

          {/* Save status */}
          <span style={{ fontSize: '11px', color: saveError ? '#EF4444' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {saveError ? saveError : isSaving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : isDirty ? 'Unsaved changes' : ''}
          </span>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || (!isDirty && !saveError)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '7px',
              backgroundColor: isDirty ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: `1px solid ${isDirty ? '#8B5CF6' : 'var(--border-subtle)'}`,
              color: isDirty ? '#8B5CF6' : 'var(--text-muted)',
              fontSize: '12px', fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer',
              opacity: (!isDirty && !saveError) ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Draft
          </button>

          <button
            onClick={handleProceedToPartII}
            disabled={isSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '7px',
              backgroundColor: '#8B5CF6', border: 'none',
              color: '#fff', fontSize: '12px', fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer',
            }}
          >
            Proceed to Part II
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Form body ── */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── S1: Application Type ── */}
        <div id="section-type">
          <SectionHeader num="1" title="Application Type" subtitle="Select the type of PIA recognition you are applying for" />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { value: 'NEW_RECOGNITION', label: 'New Recognition', desc: 'Applying for the first time' },
              { value: 'RENEWAL', label: 'Renewal', desc: 'Renew existing recognition' },
              { value: 'MODIFICATION', label: 'Modification', desc: 'Modify scope / details' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setField('subType', opt.value as PIASubType)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left',
                  padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                  border: `2px solid ${form.subType === opt.value ? '#8B5CF6' : 'var(--border-subtle)'}`,
                  backgroundColor: form.subType === opt.value ? 'rgba(139,92,246,0.08)' : 'transparent',
                  transition: 'all 0.15s', minWidth: '180px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: form.subType === opt.value ? '#8B5CF6' : 'var(--text-primary)' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── S2: Agency Details ── */}
        <div id="section-agency">
          <SectionHeader num="2" title="Agency Details" subtitle="Name of the Private Inspection Agency as registered" />
          <Grid>
            <Field label="Agency Name (English)" required>
              <TextInput value={form.agencyName} onChange={v => setField('agencyName', v)} placeholder="Full registered name" />
              {errors.agencyName && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.agencyName}</span>}
            </Field>
            <Field label="Agency Name (Hindi)" hint="Optional — as it appears on registration documents">
              <TextInput value={form.agencyNameHindi ?? ''} onChange={v => setField('agencyNameHindi', v)} placeholder="हिंदी में नाम" />
            </Field>
          </Grid>
        </div>

        {/* ── S3: Head Office Address ── */}
        <div id="section-address">
          <SectionHeader num="3" title="Head Office Address" subtitle="Registered address of the Head Office" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Street Address" required>
              <TextArea value={form.headOfficeAddress ?? ''} onChange={v => setField('headOfficeAddress', v)} placeholder="Building, street, locality…" rows={2} />
              {errors.headOfficeAddress && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfficeAddress}</span>}
            </Field>
            <Grid cols={3}>
              <Field label="State / UT" required>
                <Select
                  value={form.headOfficeState ?? ''}
                  onChange={v => setField('headOfficeState', v)}
                  options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                  placeholder="— Select State —"
                />
                {errors.headOfficeState && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfficeState}</span>}
              </Field>
              <Field label="District" required={false}>
                <TextInput value={form.headOfficeDistrict ?? ''} onChange={v => setField('headOfficeDistrict', v)} placeholder="District" />
              </Field>
              <Field label="City / Town" required>
                <TextInput value={form.headOfficeCity ?? ''} onChange={v => setField('headOfficeCity', v)} placeholder="City" />
                {errors.headOfficeCity && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfficeCity}</span>}
              </Field>
            </Grid>
            <Grid cols={3}>
              <Field label="PIN Code" required>
                <TextInput value={form.headOfficePincode ?? ''} onChange={v => setField('headOfficePincode', v)} placeholder="6-digit PIN" />
                {errors.headOfficePincode && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfficePincode}</span>}
              </Field>
              <Field label="Country">
                <TextInput value={form.headOfficeCountry ?? 'India'} onChange={v => setField('headOfficeCountry', v)} placeholder="India" />
              </Field>
            </Grid>
          </div>
        </div>

        {/* ── S4: Contact Information ── */}
        <div id="section-contact">
          <SectionHeader num="4" title="Contact Information" subtitle="Head Office contact details" />
          <Grid cols={3}>
            <Field label="Telephone / Phone" required>
              <PhoneInput value={form.headOfficePhone ?? ''} onChange={v => setField('headOfficePhone', v)} placeholder="+91 XXXXX XXXXX" />
              {errors.headOfficePhone && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfficePhone}</span>}
            </Field>
            <Field label="Fax" hint="Optional">
              <TextInput value={form.headOfficeFax ?? ''} onChange={v => setField('headOfficeFax', v)} placeholder="Fax number" />
            </Field>
            <Field label="Email Address" required>
              <EmailInput value={form.headOfficeEmail ?? ''} onChange={v => setField('headOfficeEmail', v)} placeholder="office@agency.com" />
              {errors.headOfficeEmail && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfficeEmail}</span>}
            </Field>
          </Grid>
        </div>

        {/* ── S5: Head of Organisation ── */}
        <div id="section-head-org">
          <SectionHeader num="5" title="Head of Organisation" subtitle="Details of the person heading the organisation" />
          <Grid cols={3}>
            <Field label="Full Name" required>
              <TextInput value={form.headOfOrgName ?? ''} onChange={v => setField('headOfOrgName', v)} placeholder="Name" />
              {errors.headOfOrgName && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfOrgName}</span>}
            </Field>
            <Field label="Designation" required>
              <TextInput value={form.headOfOrgDesignation ?? ''} onChange={v => setField('headOfOrgDesignation', v)} placeholder="e.g. Managing Director" />
              {errors.headOfOrgDesignation && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfOrgDesignation}</span>}
            </Field>
            <Field label="Contact Number" required>
              <PhoneInput value={form.headOfOrgContact ?? ''} onChange={v => setField('headOfOrgContact', v)} placeholder="+91 XXXXX XXXXX" />
              {errors.headOfOrgContact && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.headOfOrgContact}</span>}
            </Field>
          </Grid>
        </div>

        {/* ── S6: Legal Status ── */}
        <div id="section-legal">
          <SectionHeader num="6" title="Legal Status" subtitle="Registered legal constitution of the organisation" />
          <Grid>
            <Field label="Legal Status / Constitution" required>
              <Select
                value={form.legalStatus ?? ''}
                onChange={v => setField('legalStatus', v)}
                options={LEGAL_STATUS_OPTIONS}
                placeholder="— Select Legal Status —"
              />
              {errors.legalStatus && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.legalStatus}</span>}
            </Field>
            {form.legalStatus === 'OTHER' && (
              <Field label="Specify Details" required>
                <TextInput value={form.legalStatusDetails ?? ''} onChange={v => setField('legalStatusDetails', v)} placeholder="Describe legal constitution" />
              </Field>
            )}
          </Grid>
        </div>

        {/* ── S7: Branch Offices ── */}
        <div id="section-branches">
          <SectionHeader num="7" title="Branch Offices / Other Locations" subtitle="Add all branch offices of the agency (if any)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(form.branches ?? []).length === 0 && (
              <div style={{
                padding: '20px', borderRadius: '8px',
                border: '1px dashed var(--border-subtle)',
                textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '12px',
              }}>
                No branch offices added. Click "Add Branch" if you have branch offices.
              </div>
            )}
            {(form.branches ?? []).map((branch, idx) => (
              <div key={idx} style={{
                padding: '16px', borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                display: 'flex', flexDirection: 'column', gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Branch {idx + 1}
                  </span>
                  <button onClick={() => removeBranch(idx)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#EF4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
                <Grid cols={2}>
                  <Field label="Branch Name" required>
                    <TextInput value={branch.branchName} onChange={v => updateBranch(idx, 'branchName', v)} placeholder="Branch office name" />
                  </Field>
                  <Field label="Head of Branch">
                    <TextInput value={branch.headOfBranchName} onChange={v => updateBranch(idx, 'headOfBranchName', v)} placeholder="Name" />
                  </Field>
                </Grid>
                <Field label="Address">
                  <TextArea value={branch.address} onChange={v => updateBranch(idx, 'address', v)} placeholder="Branch address" rows={2} />
                </Field>
                <Grid cols={4}>
                  <Field label="State">
                    <Select
                      value={branch.state}
                      onChange={v => updateBranch(idx, 'state', v)}
                      options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                      placeholder="— State —"
                    />
                  </Field>
                  <Field label="City">
                    <TextInput value={branch.city} onChange={v => updateBranch(idx, 'city', v)} placeholder="City" />
                  </Field>
                  <Field label="PIN Code">
                    <TextInput value={branch.pincode} onChange={v => updateBranch(idx, 'pincode', v)} placeholder="PIN" />
                  </Field>
                  <Field label="Phone">
                    <PhoneInput value={branch.phone} onChange={v => updateBranch(idx, 'phone', v)} placeholder="Phone" />
                  </Field>
                </Grid>
              </div>
            ))}
            <button onClick={addBranch} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '7px',
              border: '1px dashed #8B5CF6',
              backgroundColor: 'rgba(139,92,246,0.05)',
              color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              alignSelf: 'flex-start',
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Branch Office
            </button>
          </div>
        </div>

        {/* ── S8: Division Contacts ── */}
        <div id="section-divisions">
          <SectionHeader num="8" title="Division Contacts" subtitle="Heads of Inspection and Laboratory divisions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Inspection Division */}
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Inspection Division
              </p>
              <Grid cols={2}>
                <Field label="Head Name">
                  <TextInput value={form.inspectionDivHeadName ?? ''} onChange={v => setField('inspectionDivHeadName', v)} placeholder="Full name" />
                </Field>
                <Field label="Designation">
                  <TextInput value={form.inspectionDivHeadDesignation ?? ''} onChange={v => setField('inspectionDivHeadDesignation', v)} placeholder="Designation" />
                </Field>
                <Field label="Phone">
                  <PhoneInput value={form.inspectionDivPhone ?? ''} onChange={v => setField('inspectionDivPhone', v)} placeholder="+91 XXXXX XXXXX" />
                </Field>
                <Field label="Email">
                  <EmailInput value={form.inspectionDivEmail ?? ''} onChange={v => setField('inspectionDivEmail', v)} placeholder="inspection@agency.com" />
                </Field>
              </Grid>
            </div>

            {/* Lab Division */}
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Laboratory Division
              </p>
              <Grid cols={2}>
                <Field label="Head Name">
                  <TextInput value={form.labDivHeadName ?? ''} onChange={v => setField('labDivHeadName', v)} placeholder="Full name" />
                </Field>
                <Field label="Designation">
                  <TextInput value={form.labDivHeadDesignation ?? ''} onChange={v => setField('labDivHeadDesignation', v)} placeholder="Designation" />
                </Field>
                <Field label="Phone">
                  <PhoneInput value={form.labDivPhone ?? ''} onChange={v => setField('labDivPhone', v)} placeholder="+91 XXXXX XXXXX" />
                </Field>
                <Field label="Email">
                  <EmailInput value={form.labDivEmail ?? ''} onChange={v => setField('labDivEmail', v)} placeholder="lab@agency.com" />
                </Field>
              </Grid>
            </div>
          </div>
        </div>

        {/* ── Bottom action bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '20px', borderTop: '1px solid var(--border-subtle)',
        }}>
          <button onClick={onBack} style={{
            padding: '9px 18px', borderRadius: '7px',
            border: '1px solid var(--border-subtle)',
            background: 'none', color: 'var(--text-secondary)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleSave(true)} disabled={isSaving} style={{
              padding: '9px 20px', borderRadius: '7px',
              border: '1px solid #8B5CF6',
              backgroundColor: 'rgba(139,92,246,0.1)',
              color: '#8B5CF6', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              {isSaving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={handleProceedToPartII}
              disabled={isSaving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px', borderRadius: '7px',
                backgroundColor: '#8B5CF6', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer',
              }}
            >
              Save &amp; Proceed to Part II
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
