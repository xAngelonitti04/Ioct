import { useState } from 'react'
import type {IoCtNode} from "../store/appStore.ts";

interface NodeCreateModalProps {
  onConfirm: (node: IoCtNode) => void
  onCancel: () => void
}

export function NodeCreateModal({ onConfirm, onCancel }: NodeCreateModalProps) {
  const [form, setForm] = useState({
    name: '',
    serial_number: '',
    sensor_type: '',
    model: '',
    manufacturer: '',
    status: 'attivo',
    installation_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.name) { setError('Il nome è obbligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ioct-nodes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          last_communication: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Errore nel salvataggio')
      const data = await res.json()
      onConfirm(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
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

  const labelStyle = {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
    display: 'block' as const,
  }

  const fields: { key: string; label: string; type?: string; required?: boolean }[] = [
    { key: 'name',              label: 'Nome',              required: true },
    { key: 'serial_number',     label: 'Numero seriale'     },
    { key: 'sensor_type',       label: 'Tipo sensore'       },
    { key: 'model',             label: 'Modello'            },
    { key: 'manufacturer',      label: 'Produttore'         },
    { key: 'status',            label: 'Stato'              },
    { key: 'installation_date', label: 'Data installazione', type: 'date' },
    { key: 'notes',             label: 'Note'               },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#16213e',
        border: '0.5px solid rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: '1.5rem',
        width: 420,
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-cpu" style={{ fontSize: 20, color: '#34d399' }} />
          <h3 style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>Crea nodo IoT</h3>
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={labelStyle}>
                {f.label} {f.required && <span style={{ color: '#f87171' }}>*</span>}
              </label>
              <input
                type={f.type ?? 'text'}
                value={(form as any)[f.key]}
                onChange={e => update(f.key, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{ color: '#f87171', fontSize: 12, padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '8px',
              background: 'transparent',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 6, color: '#94a3b8',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 2, padding: '8px',
              background: 'rgba(16,185,129,0.2)',
              border: '0.5px solid rgba(16,185,129,0.4)',
              borderRadius: 6, color: '#34d399',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
            }}
          >
            {loading ? 'Salvataggio...' : 'Salva nodo'}
          </button>
        </div>
      </div>
    </div>
  )
}