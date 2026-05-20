import { useState, useEffect } from 'react'
import { NodeCreateModal } from '../NodeCreateModal'

interface IoCtNode {
  ioct_node_id: string
  name: string
  sensor_type?: string
  status?: string
  serial_number?: string
  manufacturer?: string
  model?: string
  installation_date?: string
  notes?: string
}

interface NodesPanelProps {
  selectedModelIndex: number | null
  selectedModelNode?: IoCtNode
  onAddNode: (modelIndex: number, node: IoCtNode) => void
}

export function NodesPanel({ selectedModelIndex, selectedModelNode, onAddNode }: NodesPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [nodeData, setNodeData] = useState<IoCtNode | null>(null)

  useEffect(() => {
    if (!selectedModelNode?.ioct_node_id) {
      setNodeData(null)
      return
    }
    fetch(`/api/ioct-nodes/${selectedModelNode.ioct_node_id}`)
      .then(r => r.json())
      .then(setNodeData)
      .catch(() => {})
  }, [selectedModelNode])

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: 16, fontWeight: 500 }}>Nodi IoT</h2>

      {selectedModelIndex === null ? (
        <div style={{
          padding: '1.5rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#475569', fontSize: 13, textAlign: 'center',
        }}>
          <i className="ti ti-hand-click" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#334155' }} />
          Seleziona un oggetto nella scena per gestire il nodo IoT
        </div>
      ) : nodeData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16,185,129,0.1)',
            border: '0.5px solid rgba(16,185,129,0.3)',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="ti ti-cpu" style={{ fontSize: 16, color: '#34d399' }} />
            <span style={{ color: '#34d399', fontSize: 13, fontWeight: 500 }}>{nodeData.name}</span>
          </div>
          {[
            { label: 'ID',            value: nodeData.ioct_node_id },
            { label: 'Tipo',          value: nodeData.sensor_type  },
            { label: 'Stato',         value: nodeData.status       },
            { label: 'Seriale',       value: nodeData.serial_number},
            { label: 'Produttore',    value: nodeData.manufacturer },
            { label: 'Modello',       value: nodeData.model        },
            { label: 'Installato il', value: nodeData.installation_date },
            { label: 'Note',          value: nodeData.notes        },
          ].filter(r => r.value).map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6, fontSize: 12,
            }}>
              <span style={{ color: '#64748b' }}>{row.label}</span>
              <span style={{ color: '#e2e8f0' }}>{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(59,130,246,0.1)',
            border: '0.5px solid rgba(59,130,246,0.3)',
            borderRadius: 8, color: '#60a5fa', fontSize: 13, marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="ti ti-box-model-2" style={{ fontSize: 16 }} />
            Oggetto {selectedModelIndex + 1} selezionato
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px',
              background: 'rgba(16,185,129,0.15)',
              border: '0.5px solid rgba(16,185,129,0.4)',
              borderRadius: 8, color: '#34d399',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 16 }} />
            Aggiungi nodo IoT
          </button>
        </div>
      )}

      {modalOpen && (
        <NodeCreateModal
          onConfirm={(node) => {
            onAddNode(selectedModelIndex!, node)
            setModalOpen(false)
          }}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}