import { useState, useEffect } from 'react'
import { Thermometer, Droplets, Wind, Sun, FlaskConical, Gauge, Radio, Search, Plus, X, MapPin, Edit, Trash2, ChevronUp, ChevronDown, Check, Satellite, Clock } from 'lucide-react'

const ARTEMIS_BASE_URL = '/api/artemis'

interface Sensor {
  sensor_id?: number
  ioct_node_id?: number
  name: string
  sensor_type: string
  unit: string
  sensor_key: string
  last_communication?: string | null
}

interface IoCtNode {
  ioct_node_id: number
  name: string
  status?: string
  serial_number?: string
  manufacturer?: string
  model?: string
  installation_date?: string
  notes?: string
  artemis_node_id?: string
  sensors?: Sensor[]
}

interface ArtemisNode {
  _id: string
  name?: string
  type?: string
  status?: string
  manufacturer?: string
  owner?: string
  location?: any
  capabilities?: {
    sensors?: { sensorId: string; name: string; type: string; dataType: string; unit: string }[]
  }
}

interface NodesPanelProps {
  selectedModelIndex: number | null
  selectedModelNode?: any
  onAddNode: (modelIndex: number, node: IoCtNode) => void
  onPlaceNode: (node: IoCtNode | null, artemisNodeId: string | null, position: [number, number, number]) => void
  onActivatePlacement: (node: IoCtNode | null, artemisNodeId: string | null) => void
  onUpdatePreviewPosition: (position: [number, number, number]) => void
  previewPosition: [number, number, number] | null
  currentProjectId?: number
  onDeleteNodeFromScene: (ioct_node_id: number) => void
}

function getSensorIcon(type: string, size = 13) {
  const props = { size, strokeWidth: 1.5 }
  switch (type) {
    case 'temperature': return <Thermometer {...props} />
    case 'humidity': return <Droplets {...props} />
    case 'co2': return <Wind {...props} />
    case 'light': return <Sun {...props} />
    case 'voc': return <FlaskConical {...props} />
    case 'pressure': return <Gauge {...props} />
    default: return <Radio {...props} />
  }
}

function formatLastComm(ts?: string | null): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export function NodesPanel({
  selectedModelIndex, onAddNode, onPlaceNode, onActivatePlacement,
  onUpdatePreviewPosition, previewPosition, currentProjectId,
  onDeleteNodeFromScene
}: NodesPanelProps) {
  const [nodes, setNodes] = useState<IoCtNode[]>([])
  const [artemisNodes, setArtemisNodes] = useState<ArtemisNode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showArtemisSearch, setShowArtemisSearch] = useState(false)
  const [editingNode, setEditingNode] = useState<IoCtNode | null>(null)
  const [expandedNode, setExpandedNode] = useState<number | null>(null)
  const [placingNode, setPlacingNode] = useState<IoCtNode | null>(null)
  const [placingArtemisNode, setPlacingArtemisNode] = useState<ArtemisNode | null>(null)
  const [loadingArtemis, setLoadingArtemis] = useState(false)
  const [searchId, setSearchId] = useState('')
  const [manualPos, setManualPos] = useState({ x: '0', y: '0', z: '0' })
  const [form, setForm] = useState({
    name: '', serial_number: '', manufacturer: '', model: '',
    status: 'active', installation_date: new Date().toISOString().split('T')[0],
    notes: '', artemis_node_id: '',
  })
  const [formSensors, setFormSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchNodes() }, [])

  useEffect(() => {
    if (previewPosition) {
      setManualPos({
        x: previewPosition[0].toFixed(2),
        y: previewPosition[1].toFixed(2),
        z: previewPosition[2].toFixed(2),
      })
    }
  }, [previewPosition])

  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/ioct-nodes/')
      const data = await res.json()
      const nodesWithSensors = await Promise.all(data.map(async (n: IoCtNode) => {
        const sRes = await fetch(`/api/sensors/node/${n.ioct_node_id}`)
        const sensors = await sRes.json()
        return { ...n, sensors }
      }))
      setNodes(nodesWithSensors)
    } catch (e) { console.error(e) }
  }

  const fetchArtemisNodes = async () => {
    setLoadingArtemis(true)
    try {
      const res = await fetch(`${ARTEMIS_BASE_URL}/nodes`)
      const data = await res.json()
      setArtemisNodes(data.nodes ?? [])
    } catch (e) { console.error(e) }
    finally { setLoadingArtemis(false) }
  }

  const searchArtemisNode = async () => {
    if (!searchId) return
    setLoadingArtemis(true)
    try {
      const res = await fetch(`${ARTEMIS_BASE_URL}/nodes/${searchId}`)
      const data = await res.json()
      if (data._id) setArtemisNodes([data])
      else setArtemisNodes([])
    } catch (e) { setArtemisNodes([]) }
    finally { setLoadingArtemis(false) }
  }

  const createNodeFromArtemis = async (n: ArtemisNode) => {
    try {
      const checkRes = await fetch('/api/ioct-nodes/')
      const existing = await checkRes.json()
      if (existing.find((node: any) => node.artemis_node_id === n._id)) {
        alert('Nodo già presente nel sistema!')
        setShowArtemisSearch(false)
        return
      }
      const res = await fetch('/api/ioct-nodes/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n.name ?? n._id, serial_number: n._id, manufacturer: n.manufacturer ?? null, status: n.status ?? 'active', artemis_node_id: n._id }),
      })
      if (!res.ok) throw new Error('Errore creazione nodo')
      const created = await res.json()
      if (n.capabilities?.sensors) {
        await Promise.all(n.capabilities.sensors.map(s =>
          fetch('/api/sensors/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ioct_node_id: created.ioct_node_id, name: s.name, sensor_type: s.type, unit: s.unit, sensor_key: s.sensorId }) })
        ))
      }
      await fetchNodes()
      setShowArtemisSearch(false)
    } catch (e) { console.error(e) }
  }

  const resetForm = () => {
    setShowForm(false); setEditingNode(null)
    setForm({ name: '', serial_number: '', manufacturer: '', model: '', status: 'active', installation_date: new Date().toISOString().split('T')[0], notes: '', artemis_node_id: '' })
    setFormSensors([]); setError(null)
  }

  const openEdit = (n: IoCtNode) => {
    setEditingNode(n)
    setForm({ name: n.name, serial_number: n.serial_number ?? '', manufacturer: n.manufacturer ?? '', model: n.model ?? '', status: n.status ?? 'active', installation_date: n.installation_date ?? new Date().toISOString().split('T')[0], notes: n.notes ?? '', artemis_node_id: n.artemis_node_id ?? '' })
    setFormSensors(n.sensors ?? [])
    setShowForm(true)
  }

  const addSensorToForm = () => setFormSensors(prev => [...prev, { name: '', sensor_type: '', unit: '', sensor_key: '' }])
  const updateFormSensor = (i: number, field: keyof Sensor, value: string) => setFormSensors(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  const removeFormSensor = (i: number) => setFormSensors(prev => prev.filter((_, idx) => idx !== i))

  const sensorUnits: Record<string, string> = { temperature: '°C', humidity: '%', co2: 'ppm', light: 'lx', voc: 'ppb', pressure: 'hPa', other: '' }
  const sensorTypes = ['temperature', 'humidity', 'co2', 'light', 'voc', 'pressure', 'other']

  const handleSave = async () => {
    if (!form.name) { setError('Il nome è obbligatorio'); return }
    if (!form.serial_number) { setError('Il numero seriale è obbligatorio'); return }
    setLoading(true); setError(null)
    const body = { name: form.name, serial_number: form.serial_number, manufacturer: form.manufacturer || null, model: form.model || null, status: form.status || 'active', installation_date: form.installation_date || null, notes: form.notes || null, artemis_node_id: form.artemis_node_id || null }
    try {
      let nodeId: number
      if (editingNode) {
        const res = await fetch(`/api/ioct-nodes/${editingNode.ioct_node_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Errore nel salvataggio')
        nodeId = editingNode.ioct_node_id
        const existing = await fetch(`/api/sensors/node/${nodeId}`)
        const existingSensors = await existing.json()
        await Promise.all(existingSensors.map((s: Sensor) => fetch(`/api/sensors/${s.sensor_id}`, { method: 'DELETE' })))
      } else {
        const res = await fetch('/api/ioct-nodes/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Errore nel salvataggio')
        const data = await res.json()
        nodeId = data.ioct_node_id
      }
      await Promise.all(formSensors.map(s => fetch('/api/sensors/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ioct_node_id: nodeId, name: s.name || null, sensor_type: s.sensor_type || null, unit: s.unit || null, sensor_key: s.sensor_key || null }) })))
      await fetchNodes()
      resetForm()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/ioct-nodes/${id}`, { method: 'DELETE' })
    setNodes(prev => prev.filter(n => n.ioct_node_id !== id))
    onDeleteNodeFromScene(id)
  }

  const handleActivatePlacementLocal = (node: IoCtNode) => {
    setPlacingNode(node); setPlacingArtemisNode(null)
    setManualPos({ x: '0', y: '0', z: '0' })
    onActivatePlacement(node, null)
  }

  const handleManualPosChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const newPos = { ...manualPos, [axis]: value }
    setManualPos(newPos)
    onUpdatePreviewPosition([parseFloat(newPos.x) || 0, parseFloat(newPos.y) || 0, parseFloat(newPos.z) || 0])
  }

  const handleConfirmPlace = () => {
    const position: [number, number, number] = [parseFloat(manualPos.x) || 0, parseFloat(manualPos.y) || 0, parseFloat(manualPos.z) || 0]
    if (placingNode) onPlaceNode(placingNode, null, position)
    else if (placingArtemisNode) onPlaceNode(null, placingArtemisNode._id, position)
    setPlacingNode(null); setPlacingArtemisNode(null)
    setManualPos({ x: '0', y: '0', z: '0' })
  }

  const handleCancelPlace = () => {
    setPlacingNode(null); setPlacingArtemisNode(null)
    onActivatePlacement(null, null)
  }

  const getStatusColor = (status?: string) => status === 'active' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#475569'
  const isPlacing = placingNode !== null || placingArtemisNode !== null

  const inputStyle = {
    width: '100%', padding: '7px 10px',
    background: '#0f172a', border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 6, color: 'white', fontSize: 13,
  }

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Nodi IoT</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setShowArtemisSearch(!showArtemisSearch); if (!showArtemisSearch) fetchArtemisNodes() }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(234,179,8,0.15)', border: '0.5px solid rgba(234,179,8,0.3)', borderRadius: 6, color: '#facc15', cursor: 'pointer', fontSize: 12 }}>
            <Satellite size={13} strokeWidth={1.5} />{showArtemisSearch ? 'Chiudi' : 'Cerca ARTEMIS'}
          </button>
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(16,185,129,0.15)', border: '0.5px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#34d399', cursor: 'pointer', fontSize: 12 }}>
            {showForm ? <X size={13} strokeWidth={1.5} /> : <Plus size={13} strokeWidth={1.5} />}
            {showForm ? 'Annulla' : 'Nuovo'}
          </button>
        </div>
      </div>

      {showArtemisSearch && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ color: '#facc15', fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Satellite size={13} strokeWidth={1.5} />Nodi disponibili su ARTEMIS
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={12} strokeWidth={1.5} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input type="text" value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchArtemisNode()} placeholder="Cerca per ID nodo..." style={{ ...inputStyle, paddingLeft: 28, fontSize: 12 }} />
            </div>
            <button onClick={searchArtemisNode} style={{ padding: '6px 10px', background: 'rgba(59,130,246,0.15)', border: '0.5px solid rgba(59,130,246,0.3)', borderRadius: 6, color: '#60a5fa', cursor: 'pointer' }}>
              <Search size={13} strokeWidth={1.5} />
            </button>
            <button onClick={() => { setSearchId(''); fetchArtemisNodes() }} style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.15)', border: '0.5px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#34d399', cursor: 'pointer' }}>
              <Radio size={13} strokeWidth={1.5} />
            </button>
          </div>
          {loadingArtemis ? (
            <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '1rem' }}>Caricamento...</div>
          ) : artemisNodes.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '1rem' }}>Nessun nodo trovato</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {artemisNodes.map(n => (
                <div key={n._id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(n.status) }} />
                        <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>{n.name ?? n._id}</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{n._id} · {n.type}{n.location?.position?.room && ` · ${n.location.position.room}`}</div>
                    </div>
                    <button onClick={() => createNodeFromArtemis(n)} style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.15)', border: '0.5px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#34d399', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>
                      Crea nodo
                    </button>
                  </div>
                  {n.capabilities?.sensors && n.capabilities.sensors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {n.capabilities.sensors.map(s => (
                        <span key={s.sensorId} style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {getSensorIcon(s.type, 10)} {s.name} ({s.unit})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isPlacing && (
        <div style={{ padding: '10px 14px', background: 'rgba(234,179,8,0.15)', border: '0.5px solid rgba(234,179,8,0.4)', borderRadius: 8, marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#facc15', fontSize: 13 }}>
            <MapPin size={15} strokeWidth={1.5} />
            Posiziona: <strong>{placingNode?.name ?? placingArtemisNode?.name ?? placingArtemisNode?._id}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Clicca sulla scena oppure inserisci le coordinate manualmente</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} style={{ flex: 1 }}>
                <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 2 }}>{axis.toUpperCase()}</label>
                <input type="number" step="0.1" value={manualPos[axis]} onChange={e => handleManualPosChange(axis, e.target.value)} style={{ ...inputStyle, fontSize: 12, padding: '5px 8px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleConfirmPlace} style={{ flex: 2, padding: '7px', background: 'rgba(16,185,129,0.2)', border: '0.5px solid rgba(16,185,129,0.4)', borderRadius: 6, color: '#34d399', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Check size={13} strokeWidth={1.5} />Posiziona
            </button>
            <button onClick={handleCancelPlace} style={{ flex: 1, padding: '7px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#475569', cursor: 'pointer', fontSize: 12 }}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${editingNode ? 'rgba(234,179,8,0.3)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 8, padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ color: editingNode ? '#facc15' : '#34d399', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {editingNode ? <Edit size={13} strokeWidth={1.5} /> : <Plus size={13} strokeWidth={1.5} />}
            {editingNode ? `Modifica: ${editingNode.name}` : 'Nuovo nodo IoT'}
          </p>
          {[
            { key: 'name', label: 'Nome *', placeholder: 'es. Sensore Sala 1' },
            { key: 'serial_number', label: 'Numero seriale *', placeholder: '' },
            { key: 'manufacturer', label: 'Produttore', placeholder: '' },
            { key: 'model', label: 'Modello', placeholder: '' },
            { key: 'artemis_node_id', label: 'ID nodo ARTEMIS', placeholder: 'es. node-spain-pilot-xk7m2p9q4vl8' },
            { key: 'notes', label: 'Note', placeholder: '' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>{f.label}</label>
              <input type="text" value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inputStyle} placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Stato</label>
            <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} style={inputStyle}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>Data installazione</label>
            <input type="date" value={form.installation_date} onChange={e => setForm(prev => ({ ...prev, installation_date: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ color: '#94a3b8', fontSize: 11 }}>Sensori</label>
              <button onClick={addSensorToForm} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(59,130,246,0.15)', border: '0.5px solid rgba(59,130,246,0.3)', borderRadius: 4, color: '#60a5fa', cursor: 'pointer', fontSize: 11 }}>
                <Plus size={11} strokeWidth={1.5} />Aggiungi sensore
              </button>
            </div>
            {formSensors.length === 0 ? (
              <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '8px' }}>Nessun sensore aggiunto</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formSensors.map((s, i) => (
                  <div key={i} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#60a5fa', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {getSensorIcon(s.sensor_type)} Sensore {i + 1}
                      </span>
                      <button onClick={() => removeFormSensor(i)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                        <X size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                    <input type="text" value={s.name} onChange={e => updateFormSensor(i, 'name', e.target.value)} placeholder="Nome sensore" style={{ ...inputStyle, fontSize: 12, padding: '5px 8px' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select value={s.sensor_type} onChange={e => { updateFormSensor(i, 'sensor_type', e.target.value); updateFormSensor(i, 'unit', sensorUnits[e.target.value] ?? '') }} style={{ ...inputStyle, flex: 2, fontSize: 12, padding: '5px 8px' }}>
                        <option value="">Tipo...</option>
                        {sensorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="text" value={s.unit} onChange={e => updateFormSensor(i, 'unit', e.target.value)} placeholder="Unità" style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '5px 8px' }} />
                    </div>
                    <input type="text" value={s.sensor_key} onChange={e => updateFormSensor(i, 'sensor_key', e.target.value)} placeholder="ID sensore ARTEMIS" style={{ ...inputStyle, fontSize: 12, padding: '5px 8px' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <div style={{ color: '#f87171', fontSize: 12, padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{error}</div>}
          <button onClick={handleSave} disabled={loading} style={{ padding: '8px', background: editingNode ? 'rgba(234,179,8,0.2)' : 'rgba(16,185,129,0.2)', border: `0.5px solid ${editingNode ? 'rgba(234,179,8,0.4)' : 'rgba(16,185,129,0.4)'}`, borderRadius: 6, color: editingNode ? '#facc15' : '#34d399', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13 }}>
            {loading ? 'Salvataggio...' : editingNode ? 'Salva modifiche' : 'Crea nodo'}
          </button>
        </div>
      )}

      {nodes.length === 0 ? (
        <div style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#475569', fontSize: 13, textAlign: 'center' }}>
          <Radio size={28} strokeWidth={1} style={{ display: 'block', margin: '0 auto 8px', color: '#334155' }} />
          Nessun nodo IoT
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nodes.map(n => {
            const isExpanded = expandedNode === n.ioct_node_id
            const isPlacingThis = placingNode?.ioct_node_id === n.ioct_node_id
            return (
              <div key={n.ioct_node_id} style={{ background: isPlacingThis ? 'rgba(234,179,8,0.05)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${isPlacingThis ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedNode(isExpanded ? null : n.ioct_node_id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(n.status) }} />
                    <div>
                      <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{n.name}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                        {n.serial_number}
                        {n.artemis_node_id && <span style={{ color: '#facc15', marginLeft: 4 }}>· ARTEMIS</span>}
                        {!n.artemis_node_id && <span style={{ color: '#34d399', marginLeft: 4 }}>· SIM</span>}
                        {n.sensors && n.sensors.length > 0 && <span style={{ color: '#475569', marginLeft: 4 }}>· {n.sensors.length} sensori</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={14} strokeWidth={1.5} color="#475569" /> : <ChevronDown size={14} strokeWidth={1.5} color="#475569" />}
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {n.manufacturer && <div style={{ fontSize: 12, color: '#94a3b8' }}><span style={{ color: '#475569' }}>Produttore: </span>{n.manufacturer}</div>}
                    {n.model && <div style={{ fontSize: 12, color: '#94a3b8' }}><span style={{ color: '#475569' }}>Modello: </span>{n.model}</div>}
                    {n.artemis_node_id && <div style={{ fontSize: 12, color: '#facc15' }}><span style={{ color: '#475569' }}>ID ARTEMIS: </span>{n.artemis_node_id}</div>}

                    {n.sensors && n.sensors.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>SENSORI</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {n.sensors.map(s => (
                            <div key={s.sensor_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#94a3b8' }}>{getSensorIcon(s.sensor_type)}</span>
                                <span style={{ color: 'white', fontSize: 12 }}>{s.name || s.sensor_type}</span>
                                {s.unit && <span style={{ color: '#475569', fontSize: 11 }}>({s.unit})</span>}
                              </div>
                              {s.last_communication && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#334155', fontSize: 10 }}>
                                  <Clock size={9} strokeWidth={1.5} />
                                  {formatLastComm(s.last_communication)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={() => handleActivatePlacementLocal(n)} style={{ width: '100%', padding: '8px', background: isPlacingThis ? 'rgba(234,179,8,0.2)' : 'rgba(59,130,246,0.15)', border: `0.5px solid ${isPlacingThis ? 'rgba(234,179,8,0.4)' : 'rgba(59,130,246,0.3)'}`, borderRadius: 6, color: isPlacingThis ? '#facc15' : '#60a5fa', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <MapPin size={13} strokeWidth={1.5} />
                      {isPlacingThis ? 'In posizionamento...' : 'Posiziona nella scena'}
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(n)} style={{ flex: 1, padding: '6px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#facc15', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Edit size={12} strokeWidth={1.5} />Modifica
                      </button>
                      <button onClick={() => handleDelete(n.ioct_node_id)} style={{ flex: 1, padding: '6px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Trash2 size={12} strokeWidth={1.5} />Elimina
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
