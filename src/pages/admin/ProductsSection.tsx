import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, CertificateProduct } from '../../services/admin.service';

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ib(extra?: React.CSSProperties): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0,
    color: 'var(--text-muted)', padding: 0, ...extra,
  };
}

// â”€â”€ Confirm dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Confirm({ msg, onOk, onCancel }: { msg: string; onOk: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px 28px', maxWidth: 360, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <p style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: 14 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '7px 18px', borderRadius: 7, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button onClick={onOk} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', backgroundColor: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Product form modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductForm({
  initial,
  categories,
  onSave,
  onCancel,
  saving,
}: {
  initial?: CertificateProduct;
  categories: string[];
  onSave: (data: { name: string; category: string; hsCode: string; sortOrder: number }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [newCat, setNewCat] = useState('');
  const [useNew, setUseNew] = useState(false);
  const [hsCode, setHsCode] = useState(initial?.hsCode ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [nameErr, setNameErr] = useState('');

  const effectiveCat = useNew ? newCat.trim() : category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr('Name is required'); return; }
    onSave({ name: name.trim(), category: effectiveCat, hsCode: hsCode.trim(), sortOrder });
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 7, fontSize: 13,
    border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px 28px', width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <h3 style={{ margin: '0 0 18px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>
          {initial ? 'Edit Product' : 'Add Product'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Product Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); setNameErr(''); }} style={{ ...inp, borderColor: nameErr ? '#DC2626' : undefined }} placeholder="e.g. Alphonso Mangoes" />
            {nameErr && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{nameErr}</p>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Category</label>
            {!useNew ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ ...inp, flex: 1 }}>
                  <option value="">— No category —</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => setUseNew(true)}
                  style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                  + New
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name"
                  style={{ ...inp, flex: 1 }} autoFocus />
                <button type="button" onClick={() => setUseNew(false)}
                  style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12 }}>
                  â† Pick
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>HS Code</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} style={inp} placeholder="e.g. 0804.50" />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Sort Order</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))}
              style={{ ...inp, width: 120 }} min={0} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>Lower = appears first within category</span>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel}
              style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#94A3B8' : 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, boxShadow: saving ? 'none' : '0 4px 14px rgba(27,42,107,0.25)' }}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRODUCTS SECTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function ProductsSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [hsFilter, setHsFilter] = useState('');
  const [editTarget, setEditTarget] = useState<CertificateProduct | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CertificateProduct | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const { data: rawProducts, isLoading } = useQuery({
    queryKey: ['admin-certificate-products'],
    queryFn: () => adminApi.getCertificateProducts(),
    select: r => r.data?.data,
    staleTime: 60_000,
  });

  const products: CertificateProduct[] = Array.isArray(rawProducts) ? rawProducts : [];

  const createMut = useMutation({
    mutationFn: (d: { name: string; category: string; hsCode: string; sortOrder: number }) =>
      adminApi.createCertificateProduct({ name: d.name, category: d.category || undefined, hsCode: d.hsCode || undefined, sortOrder: d.sortOrder }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-certificate-products'] }); setShowCreate(false); },
  });

  const updateMut = useMutation({
    mutationFn: (d: { id: string; name: string; category: string; hsCode: string; sortOrder: number }) =>
      adminApi.updateCertificateProduct(d.id, { name: d.name, category: d.category || undefined, hsCode: d.hsCode || undefined, sortOrder: d.sortOrder }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-certificate-products'] }); setEditTarget(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCertificateProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-certificate-products'] }); setDeleteTarget(null); },
  });

  // Filter
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category ?? '').toLowerCase().includes(search.toLowerCase()) || (p.hsCode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    const matchHs = !hsFilter || (p.hsCode ?? '').toLowerCase().includes(hsFilter.toLowerCase());
    return matchSearch && matchCat && matchHs;
  });

  // Group by category
  const catNull = '__none__';
  const grouped = filtered.reduce<Record<string, CertificateProduct[]>>((acc, p) => {
    const key = p.category ?? catNull;
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  // Sort categories: named ones alphabetically, then null last
  const catKeys = Object.keys(grouped).sort((a, b) => {
    if (a === catNull) return 1;
    if (b === catNull) return -1;
    return a.localeCompare(b);
  });

  // All unique categories for selects
  const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])).sort();

  const toggleCat = (k: string) => setExpandedCats(prev => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });

  const isExpanded = (k: string) => expandedCats.has(k);

  const totalVisible = filtered.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Product Management</h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Manage certificate products assigned to officers ({products.length} total)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: 200 }}
            />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 140 }}>
            <option value="">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value={catNull}>— Uncategorised —</option>
          </select>
          <input
            value={hsFilter}
            onChange={e => setHsFilter(e.target.value)}
            placeholder="Filter by HS Code…"
            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: 160 }}
          />
          {(search || catFilter || hsFilter) && (
            <button onClick={() => { setSearch(''); setCatFilter(''); setHsFilter(''); }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
              Clear
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--bg-nav)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Products', value: products.length },
          { label: 'Categories', value: allCategories.length },
          { label: 'Uncategorised', value: products.filter(p => !p.category).length },
          { label: 'Showing', value: totalVisible },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 80 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading products…
        </div>
      ) : catKeys.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            {search || catFilter ? 'No products match your filters.' : 'No products yet. Click "Add Product" to create one.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {catKeys.map(catKey => {
            const items = grouped[catKey].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
            const label = catKey === catNull ? 'Uncategorised' : catKey;
            const expanded = isExpanded(catKey);

            return (
              <div key={catKey} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCat(catKey)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', backgroundColor: 'var(--bg-nav)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.6)" viewBox="0 0 24 24"
                    style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.12)', padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.18)', fontWeight: 600 }}>
                    {items.length} product{items.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Product rows */}
                {expanded && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <colgroup>
                        <col style={{ minWidth: 40 }} />
                        <col style={{ minWidth: 220 }} />
                        <col style={{ minWidth: 140 }} />
                        <col style={{ minWidth: 120 }} />
                        <col style={{ minWidth: 70 }} />
                        <col style={{ minWidth: 90 }} />
                      </colgroup>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--card-overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>#</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Product Name</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Category</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>HS Code</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Order</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((p, idx) => (
                          <tr
                            key={p.id}
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                          >
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{idx + 1}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.name}</td>
                            <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                              {p.category ? (
                                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)', fontWeight: 500 }}>
                                  {p.category}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                              {p.hsCode ? (
                                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', backgroundColor: 'var(--card-overlay)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border-subtle)' }}>
                                  {p.hsCode}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{p.sortOrder}</td>
                            <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setEditTarget(p)}
                                  title="Edit"
                                  style={ib({ color: '#0369A1', borderColor: '#BFDBFE' })}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF'; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)'; }}
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(p)}
                                  title="Delete"
                                  style={ib({ color: '#DC2626', borderColor: '#FECACA' })}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)'; }}
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <ProductForm
          categories={allCategories}
          onSave={d => createMut.mutate(d)}
          onCancel={() => setShowCreate(false)}
          saving={createMut.isPending}
        />
      )}

      {editTarget && (
        <ProductForm
          initial={editTarget}
          categories={allCategories}
          onSave={d => updateMut.mutate({ id: editTarget.id, ...d })}
          onCancel={() => setEditTarget(null)}
          saving={updateMut.isPending}
        />
      )}


      {deleteTarget && (
        <Confirm
          msg={`Delete "${deleteTarget.name}"? This cannot be undone and will remove it from all officer assignments.`}
          onOk={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}


