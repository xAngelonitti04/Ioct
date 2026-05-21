import { useState, useEffect, useRef } from 'react'
import type { Project, SceneModel } from '../../App'

interface Asset {
  asset_id: number
  title: string
  description?: string
  asset_type: string
  location?: string
  artist_name?: string
  creation_date?: string
  conservation_state?: string
}

interface AssetContains {
  asset_contains_id: number
  parent_asset_id: number
  child_asset_id: number
  start_date?: string
  end_date?: string
  notes?: string
}

interface AssetPanelProps {
  currentProject: Project | null
  models: SceneModel[]
  selectedModelIndex: number | null
  onSelectModel: (index: number) => void
  onLoadGlb: (file: File, assetId: number) => void
}

export function AssetPanel({ currentProject, models, selectedModelIndex, onSelectModel, onLoadGlb }: AssetPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [relations, setRelations] = useState<AssetContains[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [expandedAsset, setExpandedAsset] = useState<number | null>(null)
  const [showRelationForm, setShowRelationForm] = useState<number | null>(null)
  const [relationForm, setRelationForm] = useState({
    type: 'child' as 'child' | 'parent',
    asset_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  })
  const [form, setForm] = useState({
    title: '',
    asset_type: '',
    description: '',
    location: '',
    artist_name: '',
    creation_date: '',
    conservation_state: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAssetId, setUploadingAssetId] = useState<number | null>(null)

  useEffect(() => {
    fetchAssets()
    fetchRelations()
  }, [])

  const fetchAssets = async () => {
    const res = await fetch('/api/assets/')
    const data = await res.json()
    setAssets(data)
  }

  const fetchRelations = async () => {
    const res = await fetch('/api/contains/')
    const data = await res.json()
    setRelations(data)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAsset(null)
    setForm({ title: '', asset_type: '', description: '', location: '', artist_name: '', creation_date: '', conservation_state: '' })
    setError(null)
  }

  const openEdit = (a: Asset) => {
    setEditingAsset(a)
    setForm({
      title: a.title,
      asset_type: a.asset_type,
      description: a.description ?? '',
      location: a.location ?? '',
      artist_name: a.artist_name ?? '',
      creation_date: a.creation_date ?? '',
      conservation_state: a.conservation_state ?? '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title) { setError('Il titolo è obbligatorio'); return }
    if (!form.asset_type) { setError('Il tipo è obbligatorio'); return }
    setLoading(true)
    setError(null)

    const body = {
      title: form.title,
      asset_type: form.asset_type,
      description: form.description || null,
      location: form.location || null,
      artist_name: form.artist_name || null,
      creation_date: form.creation_date || null,
      conservation_state: form.conservation_state || null,
    }

    try {
      if (editingAsset) {
        const res = await fetch(`/api/assets/${editingAsset.asset_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Errore nel salvataggio')
        const data = await res.json()
        setAssets(prev => prev.map(a => a.asset_id === data.asset_id ? data : a))
      } else {
        const res = await fetch('/api/assets/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Errore nel salvataggio')
        const data = await res.json()
        setAssets(prev => [...prev, data])
      }
      resetForm()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    setAssets(prev => prev.filter(a => a.asset_id !== id))
  }

  const handleGlbUpload = (assetId: number) => {
    setUploadingAssetId(assetId)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploadingAssetId === null) return
    onLoadGlb(file, uploadingAssetId)
    setUploadingAssetId(null)
    e.target.value = ''
  }

  const handleAddRelation = async (assetId: number) => {
    if (!relationForm.asset_id) return
    const otherId = parseInt(relationForm.asset_id)

    const body = {
      parent_asset_id: relationForm.type === 'parent' ? otherId : assetId,
      child_asset_id: relationForm.type === 'child' ? otherId : assetId,
      start_date: relationForm.start_date || null,
      end_date: relationForm.end_date || null,
      notes: relationForm.notes || null,
    }

    try {
      const res = await fetch('/api/contains/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Errore')
      await fetchRelations()
      setShowRelationForm(null)
      setRelationForm({ type: 'child', asset_id: '', start_date: '', end_date: '', notes: '' })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteRelation = async (id: number) => {
    await fetch(`/api/contains/${id}`, { method: 'DELETE' })
    await fetchRelations()
  }

  const getParents = (assetId: number) =>
    relations
      .filter(r => r.child_asset_id === assetId)
      .map(r => ({ ...r, asset: assets.find(a => a.asset_id === r.parent_asset_id) }))
      .filter(r => r.asset)

  const getChildren = (assetId: number) =>
    relations
      .filter(r => r.parent_asset_id === assetId)
      .map(r => ({ ...r, asset: assets.find(a => a.asset_id === r.child_asset_id) }))
      .filter(r => r.asset)

  const getModelIndex = (assetId: number) =>
    models.findIndex(m => m.asset_id === assetId)

  const assetTypes = ['museo', 'sala', 'teca', 'opera', 'struttura', 'archivio', 'altro']

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: '#0f172a',
    border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: 'white',
    fontSize: 13,
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'museo': return 'ti-building'
      case 'sala': return 'ti-door'
      case 'teca': return 'ti-box'
      case 'opera': return 'ti-photo'
      case 'struttura': return 'ti-building-arch'
      case 'archivio': return 'ti-archive'
      default: return 'ti-cube'
    }
  }

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Asset Culturali</h2>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: 'rgba(59,130,246,0.15)',
            border: '0.5px solid rgba(59,130,246,0.3)',
            borderRadius: 6, color: '#60a5fa',
            cursor: 'pointer', fontSize: 12,
          }}
        >
          <i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 14 }} />
          {showForm ? 'Annulla' : 'Nuovo'}
        </button>
      </div>

      {/* Form creazione/modifica */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: `0.5px solid ${editingAsset ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, padding: '1rem', marginBottom: '1rem',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ color: editingAsset ? '#facc15' : '#60a5fa', fontSize: 12, margin: 0 }}>
            <i className={`ti ${editingAsset ? 'ti-edit' : 'ti-plus'}`} style={{ marginRight: 6 }} />
            {editingAsset ? `Modifica: ${editingAsset.title}` : 'Nuovo asset'}
          </p>

          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Titolo *</label>
            <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} style={inputStyle} placeholder="es. Vaso Greco, Sala Principale..." />
          </div>

          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Tipo *</label>
            <select value={form.asset_type} onChange={e => setForm(prev => ({ ...prev, asset_type: e.target.value }))} style={inputStyle}>
              <option value="">Seleziona tipo...</option>
              {assetTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Stato conservazione</label>
            <input type="text" value={form.conservation_state} onChange={e => setForm(prev => ({ ...prev, conservation_state: e.target.value }))} style={inputStyle} placeholder="es. buono, restauro necessario..." />
          </div>

          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Artista</label>
            <input type="text" value={form.artist_name} onChange={e => setForm(prev => ({ ...prev, artist_name: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Data creazione</label>
            <input type="text" value={form.creation_date} onChange={e => setForm(prev => ({ ...prev, creation_date: e.target.value }))} style={inputStyle} placeholder="es. 400 a.C., XVII secolo..." />
          </div>

          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Descrizione</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} style={{ ...inputStyle, height: 60, resize: 'none' }} />
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: 12, padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{error}</div>
          )}

          <button onClick={handleSave} disabled={loading} style={{
            padding: '8px',
            background: editingAsset ? 'rgba(234,179,8,0.2)' : 'rgba(59,130,246,0.2)',
            border: `0.5px solid ${editingAsset ? 'rgba(234,179,8,0.4)' : 'rgba(59,130,246,0.4)'}`,
            borderRadius: 6, color: editingAsset ? '#facc15' : '#60a5fa',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
          }}>
            {loading ? 'Salvataggio...' : editingAsset ? 'Salva modifiche' : 'Crea asset'}
          </button>
        </div>
      )}

      {/* Input file nascosto */}
      <input ref={fileInputRef} type="file" accept=".glb,.gltf" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Lista asset */}
      {assets.length === 0 ? (
        <div style={{
          padding: '1.5rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#475569', fontSize: 13, textAlign: 'center',
        }}>
          <i className="ti ti-building" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#334155' }} />
          Nessun asset ancora
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assets.map(a => {
            const modelIndex = getModelIndex(a.asset_id)
            const hasModel = modelIndex >= 0
            const isExpanded = expandedAsset === a.asset_id
            const parents = getParents(a.asset_id)
            const children = getChildren(a.asset_id)

            return (
              <div key={a.asset_id} style={{
                background: selectedModelIndex === modelIndex && hasModel
                  ? 'rgba(59,130,246,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border: `0.5px solid ${selectedModelIndex === modelIndex && hasModel
                  ? 'rgba(59,130,246,0.3)'
                  : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, overflow: 'hidden',
              }}>
                {/* Header */}
                <div
                  style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedAsset(isExpanded ? null : a.asset_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`ti ${getAssetIcon(a.asset_type)}`} style={{ fontSize: 16, color: '#60a5fa' }} />
                    <div>
                      <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                        {a.asset_type}{a.conservation_state && ` · ${a.conservation_state}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {hasModel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                    {(parents.length > 0 || children.length > 0) && (
                      <span style={{ fontSize: 10, color: '#60a5fa', background: 'rgba(59,130,246,0.15)', padding: '2px 6px', borderRadius: 10 }}>
                        {parents.length}↑ {children.length}↓
                      </span>
                    )}
                    <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, color: '#475569' }} />
                  </div>
                </div>

                {/* Dettagli espansi */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Info */}
                    {a.artist_name && <div style={{ fontSize: 12, color: '#94a3b8' }}><span style={{ color: '#475569' }}>Artista: </span>{a.artist_name}</div>}
                    {a.creation_date && <div style={{ fontSize: 12, color: '#94a3b8' }}><span style={{ color: '#475569' }}>Data: </span>{a.creation_date}</div>}
                    {a.description && <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.description}</div>}

                    {/* Relazioni padre */}
                    <div>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>CONTENUTO IN</div>
                      {parents.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#334155' }}>Nessun asset padre</div>
                      ) : (
                        parents.map(r => (
                          <div key={r.asset_contains_id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '4px 8px', background: 'rgba(59,130,246,0.08)',
                            borderRadius: 6, marginBottom: 4,
                          }}>
                            <div>
                              <span style={{ fontSize: 12, color: '#60a5fa' }}>{r.asset?.title}</span>
                              {r.start_date && <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>{r.start_date}{r.end_date ? ` → ${r.end_date}` : ''}</span>}
                            </div>
                            <button onClick={() => handleDeleteRelation(r.asset_contains_id)} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14 }}>
                              <i className="ti ti-x" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Relazioni figlio */}
                    <div>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>CONTIENE</div>
                      {children.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#334155' }}>Nessun asset figlio</div>
                      ) : (
                        children.map(r => (
                          <div key={r.asset_contains_id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '4px 8px', background: 'rgba(16,185,129,0.08)',
                            borderRadius: 6, marginBottom: 4,
                          }}>
                            <div>
                              <span style={{ fontSize: 12, color: '#34d399' }}>{r.asset?.title}</span>
                              {r.start_date && <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>{r.start_date}{r.end_date ? ` → ${r.end_date}` : ''}</span>}
                            </div>
                            <button onClick={() => handleDeleteRelation(r.asset_contains_id)} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14 }}>
                              <i className="ti ti-x" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Form aggiungi relazione */}
                    {showRelationForm === a.asset_id ? (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setRelationForm(prev => ({ ...prev, type: 'parent' }))}
                            style={{
                              flex: 1, padding: '5px', fontSize: 11,
                              background: relationForm.type === 'parent' ? 'rgba(59,130,246,0.2)' : 'transparent',
                              border: `0.5px solid ${relationForm.type === 'parent' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: 6, color: relationForm.type === 'parent' ? '#60a5fa' : '#475569', cursor: 'pointer',
                            }}
                          >↑ È contenuto in</button>
                          <button
                            onClick={() => setRelationForm(prev => ({ ...prev, type: 'child' }))}
                            style={{
                              flex: 1, padding: '5px', fontSize: 11,
                              background: relationForm.type === 'child' ? 'rgba(16,185,129,0.2)' : 'transparent',
                              border: `0.5px solid ${relationForm.type === 'child' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: 6, color: relationForm.type === 'child' ? '#34d399' : '#475569', cursor: 'pointer',
                            }}
                          >↓ Contiene</button>
                        </div>

                        <select
                          value={relationForm.asset_id}
                          onChange={e => setRelationForm(prev => ({ ...prev, asset_id: e.target.value }))}
                          style={{ ...inputStyle, fontSize: 12 }}
                        >
                          <option value="">Seleziona asset...</option>
                          {assets.filter(x => x.asset_id !== a.asset_id).map(x => (
                            <option key={x.asset_id} value={x.asset_id}>{x.title}</option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Da</label>
                            <input type="date" value={relationForm.start_date} onChange={e => setRelationForm(prev => ({ ...prev, start_date: e.target.value }))} style={{ ...inputStyle, fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>A</label>
                            <input type="date" value={relationForm.end_date} onChange={e => setRelationForm(prev => ({ ...prev, end_date: e.target.value }))} style={{ ...inputStyle, fontSize: 12 }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setShowRelationForm(null)} style={{ flex: 1, padding: '6px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#475569', cursor: 'pointer', fontSize: 12 }}>Annulla</button>
                          <button onClick={() => handleAddRelation(a.asset_id)} style={{ flex: 2, padding: '6px', background: 'rgba(59,130,246,0.2)', border: '0.5px solid rgba(59,130,246,0.4)', borderRadius: 6, color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>Aggiungi</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRelationForm(a.asset_id)}
                        style={{
                          width: '100%', padding: '6px',
                          background: 'transparent',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, color: '#475569',
                          cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <i className="ti ti-git-branch" style={{ fontSize: 14 }} />
                        Aggiungi relazione
                      </button>
                    )}

                    {/* Modello 3D */}
                    <div>
                      {hasModel ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => onSelectModel(modelIndex)}
                            style={{
                              flex: 1, padding: '6px',
                              background: 'rgba(59,130,246,0.15)',
                              border: '0.5px solid rgba(59,130,246,0.3)',
                              borderRadius: 6, color: '#60a5fa',
                              cursor: 'pointer', fontSize: 12,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                          >
                            <i className="ti ti-eye" style={{ fontSize: 14 }} />
                            Seleziona
                          </button>
                          <button
                            onClick={() => handleGlbUpload(a.asset_id)}
                            style={{
                              flex: 1, padding: '6px',
                              background: 'rgba(234,179,8,0.15)',
                              border: '0.5px solid rgba(234,179,8,0.3)',
                              borderRadius: 6, color: '#facc15',
                              cursor: 'pointer', fontSize: 12,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                          >
                            <i className="ti ti-refresh" style={{ fontSize: 14 }} />
                            Sostituisci
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGlbUpload(a.asset_id)}
                          style={{
                            width: '100%', padding: '6px',
                            background: 'rgba(16,185,129,0.15)',
                            border: '0.5px solid rgba(16,185,129,0.3)',
                            borderRadius: 6, color: '#34d399',
                            cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}
                        >
                          <i className="ti ti-upload" style={{ fontSize: 14 }} />
                          Carica modello 3D
                        </button>
                      )}
                    </div>

                    {/* Azioni */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(a)}
                        style={{
                          flex: 1, padding: '6px',
                          background: 'transparent',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, color: '#facc15',
                          cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <i className="ti ti-edit" style={{ fontSize: 14 }} />
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(a.asset_id)}
                        style={{
                          flex: 1, padding: '6px',
                          background: 'transparent',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, color: '#f87171',
                          cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: 14 }} />
                        Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}