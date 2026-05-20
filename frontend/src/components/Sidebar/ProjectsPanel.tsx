import { useState, useEffect, useRef } from 'react'
import type { Project, SceneModel } from '../../App'

interface ProjectsPanelProps {
  currentProject: Project | null
  models: SceneModel[]
  onSelectProject: (project: Project) => void
  onImportProject: (file: File) => void
}

export function ProjectsPanel({ currentProject, models, onSelectProject, onImportProject }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'attivo',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/projects/')
      .then(r => r.json())
      .then(setProjects)
      .catch(() => {})
  }, [])

  const openEdit = (p: Project) => {
    setEditingProject(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      start_date: p.start_date ?? '',
      end_date: p.end_date ?? '',
      status: p.status ?? '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingProject(null)
    setForm({ name: '', description: '', start_date: new Date().toISOString().split('T')[0], end_date: '', status: 'attivo' })
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name) { setError('Il nome è obbligatorio'); return }
    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      setError('La data di fine deve essere successiva alla data di inizio')
      return
    }
    setLoading(true)
    setError(null)

    const body = {
      name: form.name,
      description: form.description || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status || null,
    }

    try {
      if (editingProject) {
        const res = await fetch(`/api/projects/${editingProject.project_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Errore nel salvataggio')
        const data = await res.json()
        setProjects(prev => prev.map(p => p.project_id === data.project_id ? data : p))
      } else {
        const res = await fetch('/api/projects/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Errore nel salvataggio')
        const data = await res.json()
        setProjects(prev => [...prev, data])
      }
      resetForm()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p.project_id !== id))
  }

  const handleExport = (p: Project) => {
    const exportData = {
      project: p,
      scene_objects: p.project_id === currentProject?.project_id
        ? models.map(m => ({
            glb_filename: m.glb_filename,
            glb_base64: m.glb_base64,
            pos_x: m.config.position[0],
            pos_y: m.config.position[1],
            pos_z: m.config.position[2],
            rot_x: m.config.rotation[0],
            rot_y: m.config.rotation[1],
            rot_z: m.config.rotation[2],
            scale_x: m.config.scale[0],
            scale_y: m.config.scale[1],
            scale_z: m.config.scale[2],
            ioct_node: m.node ?? null,
          }))
        : []
    }
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `progetto_${p.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const body = {
          name: data.project.name,
          description: data.project.description || null,
          start_date: data.project.start_date || null,
          end_date: data.project.end_date || null,
          status: data.project.status || null,
        }
        const res = await fetch('/api/projects/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Errore importazione')
        const imported = await res.json()
        setProjects(prev => [...prev, imported])
      } catch {
        setError('Errore durante l\'importazione del file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: '#0f172a',
    border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: 'white',
    fontSize: 13,
  }

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Progetti</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: 'rgba(16,185,129,0.15)',
            border: '0.5px solid rgba(16,185,129,0.3)',
            borderRadius: 6, color: '#34d399',
            cursor: 'pointer', fontSize: 12,
          }}>
            <i className="ti ti-upload" style={{ fontSize: 14 }} />
            Importa
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
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
      </div>

      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: `0.5px solid ${editingProject ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, padding: '1rem', marginBottom: '1rem',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ color: editingProject ? '#facc15' : '#60a5fa', fontSize: 12, margin: 0 }}>
            <i className={`ti ${editingProject ? 'ti-edit' : 'ti-plus'}`} style={{ marginRight: 6 }} />
            {editingProject ? `Modifica: ${editingProject.name}` : 'Nuovo progetto'}
          </p>

          {[
            { key: 'name', label: 'Nome *' },
            { key: 'description', label: 'Descrizione' },
            { key: 'start_date', label: 'Data inizio', type: 'date' },
            { key: 'end_date', label: 'Data fine', type: 'date' },
            { key: 'status', label: 'Stato' },
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
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '8px',
              background: editingProject ? 'rgba(234,179,8,0.2)' : 'rgba(59,130,246,0.2)',
              border: `0.5px solid ${editingProject ? 'rgba(234,179,8,0.4)' : 'rgba(59,130,246,0.4)'}`,
              borderRadius: 6,
              color: editingProject ? '#facc15' : '#60a5fa',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
            }}
          >
            {loading ? 'Salvataggio...' : editingProject ? 'Salva modifiche' : 'Crea progetto'}
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{
          padding: '1.5rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#475569', fontSize: 13, textAlign: 'center',
        }}>
          <i className="ti ti-folder" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#334155' }} />
          Nessun progetto ancora
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
  <div key={p.project_id} style={{
    padding: '10px 14px',
    background: currentProject?.project_id === p.project_id
      ? 'rgba(59,130,246,0.08)'
      : editingProject?.project_id === p.project_id
      ? 'rgba(234,179,8,0.05)'
      : 'rgba(255,255,255,0.03)',
    border: `0.5px solid ${currentProject?.project_id === p.project_id
      ? 'rgba(59,130,246,0.3)'
      : editingProject?.project_id === p.project_id
      ? 'rgba(234,179,8,0.3)'
      : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <div
      style={{ flex: 1, cursor: 'pointer' }}
      onClick={() => onSelectProject(p)}
    >
      <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
        {p.name}
        {currentProject?.project_id === p.project_id && (
          <span style={{ color: '#60a5fa', fontSize: 10, marginLeft: 8 }}>● attivo</span>
        )}
      </div>
      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
        {p.status} {p.start_date && `· ${p.start_date}`}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={() => handleExport(p)}
        style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: 16 }}
        title="Esporta"
      >
        <i className="ti ti-download" />
      </button>
      <button
        onClick={() => openEdit(p)}
        style={{ background: 'transparent', border: 'none', color: '#facc15', cursor: 'pointer', fontSize: 16 }}
        title="Modifica"
      >
        <i className="ti ti-edit" />
      </button>
      <button
        onClick={() => handleDelete(p.project_id)}
        style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16 }}
        title="Elimina"
      >
        <i className="ti ti-trash" />
      </button>
    </div>
  </div>
))}
        </div>
      )}
    </div>
  )
}