import { useState } from 'react'

interface ModelConfig {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface ModelUploadModalProps {
  file: File
  onConfirm: (url: string, config: ModelConfig) => void
  onCancel: () => void
}

export function ModelUploadModal({ file, onConfirm, onCancel }: ModelUploadModalProps) {
  const [config, setConfig] = useState<ModelConfig>({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  })

  const handleConfirm = () => {
    const url = URL.createObjectURL(file)
    onConfirm(url, config)
  }

  const updateValue = (
    key: keyof ModelConfig,
    index: 0 | 1 | 2,
    value: string
  ) => {
    setConfig(prev => {
      const updated = [...prev[key]] as [number, number, number]
      updated[index] = parseFloat(value) || 0
      return { ...prev, [key]: updated }
    })
  }

  const Row = ({
    label,
    field,
    step = '0.1',
  }: {
    label: string
    field: keyof ModelConfig
    step?: string
  }) => (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <div key={axis} style={{ flex: 1 }}>
            <p style={{ color: '#475569', fontSize: 11, marginBottom: 4 }}>{axis}</p>
            <input
              type="number"
              step={step}
              value={config[field][i]}
              onChange={e => updateValue(field, i as 0 | 1 | 2, e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#0f172a',
                border: '0.5px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                color: 'white',
                fontSize: 13,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#16213e',
        border: '0.5px solid rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: '1.5rem',
        width: 360,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <i className="ti ti-box-model-2" style={{ fontSize: 20, color: '#60a5fa' }} />
          <div>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>Carica modello</h3>
            <p style={{ color: '#475569', fontSize: 12 }}>{file.name}</p>
          </div>
        </div>

        <Row label="Posizione" field="position" step="0.5" />
        <Row label="Rotazione (gradi)" field="rotation" step="1" />
        <Row label="Scala" field="scale" step="0.1" />

        <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
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
            onClick={handleConfirm}
            style={{
              flex: 2, padding: '8px',
              background: 'rgba(59,130,246,0.2)',
              border: '0.5px solid rgba(59,130,246,0.4)',
              borderRadius: 6, color: '#60a5fa',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Carica
          </button>
        </div>
      </div>
    </div>
  )
}