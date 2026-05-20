import { useState, useEffect } from 'react'
import type { Project } from '../App'

interface ProjectStartModalProps {
  onSelect: (project: Project) => void
  onImport: (file: File) => void
}

export function ProjectStartModal({ onSelect, onImport }: ProjectStartModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'attivo',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects/')
      .then(r => r.json())
      .then(setProjects)
      .catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!form.name) { setError('Il nome è obbligatorio'); return }
    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      setError('La data di fine deve essere successiva alla data di inizio')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          status: form.status || null,
        }),
      })
      if (!res.ok) throw new Error('Errore nel salvataggio')
      const data = await res.json()
      onSelect(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: 'white',
    fontSize: 13,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f172a',
      zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, background: '#1d4ed8',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-building-castle" style={{ color: 'white', fontSize: 22 }} />
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 500 }}>CulturalTwin</h1>
            <p style={{ color: '#475569', fontSize: 13 }}>Piattaforma di monitoraggio IoT per beni culturali</p>
          </div>
        </div>

        {!showForm ? (
          <>
            {/* Azioni */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  flex: 1, padding: '14px',
                  background: 'rgba(59,130,246,0.15)',
                  border: '0.5px solid rgba(59,130,246,0.3)',
                  borderRadius: 10, color: '#60a5fa',
                  cursor: 'pointer', fontSize: 14,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
              >
                <i className="ti ti-plus" style={{ fontSize: 24 }} />
                Nuovo progetto
              </button>

              <label style={{
                flex: 1, padding: '14px',
                background: 'rgba(16,185,129,0.15)',
                border: '0.5px solid rgba(16,185,129,0.3)',
                borderRadius: 10, color: '#34d399',
                cursor: 'pointer', fontSize: 14,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <i className="ti ti-upload" style={{ fontSize: 24 }} />
                Importa progetto
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) onImport(file)
                  }}
                />
              </label>
            </div>

            {/* Progetti esistenti */}
            {projects.length > 0 && (
              <div>
                <p style={{ color: '#475569', fontSize: 12, marginBottom: 10 }}>OPPURE APRI UN PROGETTO ESISTENTE</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {projects.map(p => (
                    <div
                      key={p.project_id}
                      onClick={() => onSelect(p)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '0.5px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    >
                      <div>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                          {p.status} {p.start_date && `· ${p.start_date}`}
                        </div>
                      </div>
                      <i className="ti ti-arrow-right" style={{ color: '#475569', fontSize: 18 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(59,130,246,0.2)',
            borderRadius: 10, padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#60a5fa', fontSize: 14, fontWeight: 500 }}>Nuovo progetto</p>
              <button
                onClick={() => { setShowForm(false); setError(null) }}
                style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            {[
              { key: 'name',        label: 'Nome *'        },
              { key: 'description', label: 'Descrizione'   },
              { key: 'start_date',  label: 'Data inizio', type: 'date' },
              { key: 'end_date',    label: 'Data fine',   type: 'date' },
              { key: 'status',      label: 'Stato'         },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}

            {error && (
              <div style={{ color: '#f87171', fontSize: 12, padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              style={{
                padding: '10px',
                background: 'rgba(59,130,246,0.2)',
                border: '0.5px solid rgba(59,130,246,0.4)',
                borderRadius: 6, color: '#60a5fa',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
              }}
            >
              {loading ? 'Creazione...' : 'Crea e apri progetto'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}